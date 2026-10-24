import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { findGroundedDocs } from "./server/knowledge.js";
import { checkEmergency, SYSTEM_INSTRUCTION } from "./server/safety.js";
import { rateLimiter } from "./server/rateLimiter.js";
import { addAuditLog, getAuditLogs } from "./server/auditLogger.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_API_KEY",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint for safe streaming chat with RAG and Emergency warning
app.post("/api/chat", rateLimiter, async (req, res) => {
  const { messages, sessionID } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Invalid messages payload" });
    return;
  }

  const latestMessage = messages[messages.length - 1];
  const queryText = latestMessage.content || "";

  // 1. Parallel Emergency Safeguard Screening
  const emergencyCheck = checkEmergency(queryText);

  // 2. Curated RAG Grounding Search
  const groundedDocs = findGroundedDocs(queryText);
  const sourcesCited = groundedDocs.map(doc => `${doc.source}: ${doc.title}`);

  // Set up EventStream headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Record audit log entry at the end of the API call
  let finalResponseText = "";
  const startTime = Date.now();

  // Send metadata: emergency check results and grounding documents
  res.write(`data: ${JSON.stringify({
    type: "metadata",
    emergency: emergencyCheck,
    groundedSources: groundedDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      url: doc.url
    }))
  })}\n\n`);

  try {
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback for missing key
      const fallbackText = "Error: Server's GEMINI_API_KEY is not configured or is a placeholder. Please configure your GEMINI_API_KEY in the Secrets panel.";
      res.write(`data: ${JSON.stringify({ type: "content", text: fallbackText })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // Map conversation roles to correct Gemini roles ('user' and 'model')
    const geminiHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" || msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // Prepend grounded RAG text to the current prompt to guide the model correctly
    let groundedPrompt = queryText;
    if (groundedDocs.length > 0) {
      const ragContext = groundedDocs.map(doc => `Source: ${doc.source}\nContent: ${doc.content}`).join("\n\n");
      groundedPrompt = `Use the following medical guidelines if relevant to answer the query responsibly:\n\n${ragContext}\n\nUser Question: ${queryText}`;
    }

    // Append the final prompted message
    geminiHistory.push({
      role: "user",
      parts: [{ text: groundedPrompt }]
    });

    // Request stream from Gemini (using models/gemini-3.5-flash for balanced medical guidance Q&A)
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: geminiHistory,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for factual consistency
      },
    });

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      finalResponseText += chunkText;
      res.write(`data: ${JSON.stringify({ type: "content", text: chunkText })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
  } catch (error: any) {
    console.error("Gemini stream error:", error);
    res.write(`data: ${JSON.stringify({ type: "error", message: error.message || "Failed to generate stream" })}\n\n`);
    res.write("data: [DONE]\n\n");
  } finally {
    res.end();

    // Log the interaction for audit logs
    const responseTimeMs = Date.now() - startTime;
    addAuditLog({
      sessionID: sessionID || "anonymous",
      querySummary: queryText.length > 60 ? queryText.substring(0, 57) + "..." : queryText,
      emergencyTriggered: emergencyCheck.triggered,
      emergencyType: emergencyCheck.reason,
      responseTimeMs,
      sourcesCited
    });
  }
});

// Endpoint to fetch safety/audit logs for clinicians
app.get("/api/audit-logs", (req, res) => {
  res.json(getAuditLogs());
});

// Endpoint to perform instant symptomatic screening guidance
app.post("/api/symptom-check-guidance", (req, res) => {
  const { symptom, severity, duration, age, chronicConditions } = req.body;
  if (!symptom) {
    res.status(400).json({ error: "Symptom is required" });
    return;
  }

  // Double check symptom for emergency terms
  const emergencyCheck = checkEmergency(symptom);

  res.json({
    emergencyCheck,
    nextRecommendedSteps: [
      "Note the exact onset and patterns of the symptom.",
      "Stay hydrated and avoid high physical strain.",
      "Track your temperature and blood pressure if relevant tools are at home.",
      "Schedule a consultation with an primary care physician if symptom is persistent or worsens."
    ],
    summaryContext: `Symptom Profile:\n- Symptom: ${symptom}\n- Severity: ${severity}\n- Duration: ${duration}\n- Age Group: ${age}\n- Pre-existing conditions: ${chronicConditions || "None"}`
  });
});

// Integrate Vite middleware in development or static serving in production
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Health Information Assistant listening on http://localhost:${PORT}`);
  });
}

bootstrap();
