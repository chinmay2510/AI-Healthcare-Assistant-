import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HeartPulse,
  MessageSquare,
  Activity,
  HeartPulse as HeartPulseIcon,
  ShieldCheck,
  ShieldAlert,
  Send,
  User,
  Bot,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  XCircle,
  FileText,
  Lock,
  Unlock,
  Plus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Download,
  Search,
  X,
  Sun,
  Moon,
  HelpCircle
} from "lucide-react";

import { Message, GroundedSource } from "./types";
import DisclaimerModal from "./components/DisclaimerModal";
import SymptomChecker from "./components/SymptomChecker";
import PreventiveCare from "./components/PreventiveCare";
import AuditLogsView from "./components/AuditLogsView";
import MythBuster from "./components/MythBuster";

// Client-side quick parallel emergency terms checker to warn instantly on keystrokes
const CLIENT_EMERGENCY_REGEX = /\b(chest\s*pain|cannot\s*breathe|difficulty\s*breathing|slurred\s*speech|stroke\s*signs|want\s*to\s*die|suicidal|throat\s*closing|severe\s*allergic|poisoned|swallowed\s*bleach)\b/i;

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // Initialize theme from localStorage on client-side
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as "light" | "dark" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else {
      setTheme("dark"); // Default to premium futuristic dark mode
    }
  }, []);

  // Sync theme to root HTML element
  useEffect(() => {
    if (theme) {
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("app-theme", theme);
    }
  }, [theme]);

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "symptom" | "preventive" | "audit" | "myth">("chat");

  // Chat parameters
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: "Hello! I am your educational AI Health Information Assistant. I am here to help answer general health questions, explain common symptom factors, and help you locate preventive screening guides.\n\n*Please remember: I am an educational guide, not a clinician. I cannot diagnose conditions or prescribe medications.* How can I help you today?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponseStream, setCurrentResponseStream] = useState("");
  const [sessionID, setSessionID] = useState("");
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const filteredMessages = messages.filter((msg) => {
    if (!chatSearchQuery.trim()) return true;
    return msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

  // Instant safety visual feedback
  const [clientEmergency, setClientEmergency] = useState<string | null>(null);
  const [serverEmergencyAlert, setServerEmergencyAlert] = useState<{ triggered: boolean; reason: string | null; guideline: string | null } | null>(null);
  const [activeSources, setActiveSources] = useState<GroundedSource[]>([]);

  // Local Secure Health Profile State (Opt-in LocalStorage Encryption Simulation)
  const [profileOptIn, setProfileOptIn] = useState(false);
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Other");
  const [patientChronic, setPatientChronic] = useState("");
  const [profileSavedNotify, setProfileSavedNotify] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stop active speech/recognition on tab switch
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition on tab switch:", err);
      }
    }
    setIsListening(false);
  }, [activeTab]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping recognition on unmount:", err);
        }
      }
    };
  }, []);

  const handleSpeechToTextToggle = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping recognition:", err);
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setClientEmergency("Speech recognition is not fully supported in this browser frame. Try on Chrome/Safari.");
      setTimeout(() => setClientEmergency(null), 5000);
      return;
    }

    try {
      // Mute any active output before starting recording
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleInputChange(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error event:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition failed to initialize:", err);
      setIsListening(false);
    }
  };

  const speakMessage = (messageId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setClientEmergency("Speech synthesis is not supported in this browser environment.");
      setTimeout(() => setClientEmergency(null), 4000);
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Cancel any active speech output
    window.speechSynthesis.cancel();

    // Clean up response of Markdown characters
    const cleanText = text
      .replace(/[*_#`~>]/g, "") // strip asterisks, underscores, hashtags, backticks, tildes, blockquotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links with just link text
      .replace(/NOTE:/gi, "Note.")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownloadHistory = (format: "txt" | "json") => {
    let content = "";
    let filename = `health_chat_transcript_${sessionID || "session"}`;

    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
      filename += ".json";
    } else {
      content = `===========================================================
AI HEALTH INFORMATION ASSISTANT - CHAT TRANSCRIPT
Session ID: ${sessionID || "N/A"}
Downloaded At: ${new Date().toLocaleString()}
Disclaimer: This transcript is for general health education/public health awareness purposes only and does not substitute professional medical advice.
===========================================================\n\n`;

      messages.forEach((msg) => {
        const borderLine = "-".repeat(59);
        const roleLabel = msg.role === "user" ? "USER" : "ASSISTANT (AI)";
        content += `[${msg.timestamp}] ${roleLabel}:\n${msg.content}\n`;
        
        if (msg.sources && msg.sources.length > 0) {
          content += `\nSOURCES CITED:\n`;
          msg.sources.forEach((src) => {
            content += `- ${src.source}: ${src.title} (${src.url})\n`;
          });
        }
        
        content += `\n${borderLine}\n\n`;
      });
      
      filename += ".txt";
    }

    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Initialize session and load local profile
  useEffect(() => {
    // Generate static session ID
    setSessionID(`sess-${Math.random().toString(36).substring(2, 11)}`);

    // Check profile opt-in
    const optIn = localStorage.getItem("ai-health-profile-opt-in") === "true";
    setProfileOptIn(optIn);
    if (optIn) {
      setPatientAge(localStorage.getItem("ai-health-patient-age") || "");
      setPatientGender(localStorage.getItem("ai-health-patient-gender") || "Other");
      setPatientChronic(localStorage.getItem("ai-health-patient-chronic") || "");
    }
  }, []);

  // Scroll to bottom of message history
  useEffect(() => {
    if (!isScrollLocked) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentResponseStream, isScrollLocked]);

  // Monitor typing to trigger instant safety warnings
  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (CLIENT_EMERGENCY_REGEX.test(text)) {
      setClientEmergency("Warning: Potential life-threatening clinical symptom keyword detected. Please call the Indian Government emergency helpline 112 instantly or contact your local emergency services.");
    } else {
      setClientEmergency(null);
    }
  };

  // Toggle Health Profile Opt-in
  const handleProfileOptInToggle = () => {
    const newVal = !profileOptIn;
    setProfileOptIn(newVal);
    localStorage.setItem("ai-health-profile-opt-in", String(newVal));
    if (!newVal) {
      // Clear local states
      localStorage.removeItem("ai-health-patient-age");
      localStorage.removeItem("ai-health-patient-gender");
      localStorage.removeItem("ai-health-patient-chronic");
      setPatientAge("");
      setPatientGender("Other");
      setPatientChronic("");
    }
  };

  // Save Local Health Profile
  const handleSaveProfile = () => {
    if (profileOptIn) {
      localStorage.setItem("ai-health-patient-age", patientAge);
      localStorage.setItem("ai-health-patient-gender", patientGender);
      localStorage.setItem("ai-health-patient-chronic", patientChronic);
      setProfileSavedNotify(true);
      setTimeout(() => setProfileSavedNotify(false), 3000);
    }
  };

  // Submit standard chat messages or symptom checks to the AI Streaming Endpoint
  const handleSendMessage = async (customMessage?: string) => {
    const promptToSend = customMessage || inputValue;
    if (!promptToSend.trim() || isLoading) return;

    // Reset active speech or recording
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
    }

    // Reset local alerts
    setInputValue("");
    setClientEmergency(null);
    setServerEmergencyAlert(null);
    setActiveSources([]);
    setIsLoading(true);

    // Format text if user has opt-in active health profile
    let finalPrompt = promptToSend;
    if (!customMessage && profileOptIn && patientAge) {
      finalPrompt = `[Context of Patient: Age ${patientAge}, Gender ${patientGender}, Chronic factors: ${patientChronic || "None"}]\n${promptToSend}`;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: promptToSend, // Show the raw user question in UI
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentResponseStream("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.role === "user" ? (profileOptIn && patientAge ? `[Context of Patient: Age ${patientAge}, Gender ${patientGender}, Chronic factors: ${patientChronic || "None"}]\n${m.content}` : m.content) : m.content
          })),
          sessionID
        }),
      });

      if (!response.ok) {
        throw new Error("Server returned an error status");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No readable response stream available");

      let done = false;
      let accumulatedText = "";
      let metadataReceived = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataText = line.slice(6).trim();
              if (dataText === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataText);
                if (parsed.type === "metadata") {
                  metadataReceived = true;
                  if (parsed.emergency && parsed.emergency.triggered) {
                    setServerEmergencyAlert(parsed.emergency);
                  }
                  if (parsed.groundedSources && parsed.groundedSources.length > 0) {
                    setActiveSources(parsed.groundedSources);
                  }
                } else if (parsed.type === "content") {
                  accumulatedText += parsed.text;
                  setCurrentResponseStream(accumulatedText);
                } else if (parsed.type === "error") {
                  accumulatedText += `\n[Stream Error: ${parsed.message}]`;
                  setCurrentResponseStream(accumulatedText);
                }
              } catch (e) {
                // Ignore parsing errors for partial packet splittings
              }
            }
          }
        }
      }

      // Append finished model response to state
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: accumulatedText,
          timestamp: new Date().toLocaleTimeString(),
          sources: activeSources.length > 0 ? activeSources : undefined,
          isEmergency: serverEmergencyAlert?.triggered,
          emergencyReason: serverEmergencyAlert?.reason
        }
      ]);
      setCurrentResponseStream("");
    } catch (err: any) {
      console.error("Chat streaming failure:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: `An error occurred while streaming response: ${err.message || "Unknown error"}. Please check your server keys or try again later.`,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to chat and load symptom checker output
  const handleSymptomCheckerSubmit = (compiledPrompt: string) => {
    setActiveTab("chat");
    setTimeout(() => {
      handleSendMessage(compiledPrompt);
    }, 150);
  };

  return (
    <div id="ai-health-app-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 bg-grid-light dark:bg-grid-dark flex flex-col antialiased transition-colors duration-300 relative">
      {/* Disclaimer first-visit overlay */}
      <DisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />

      {/* Primary Navigation Header */}
      <header id="app-primary-header" className="sticky top-0 z-40 glass-panel-light dark:glass-panel-dark border-b border-slate-200/80 dark:border-slate-850/80 backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/10 dark:shadow-emerald-700/15">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-[#0d9b0e] tracking-tight">AI Health Information Assistant</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Educational Public Health Guide</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-850 dark:text-red-400 items-center gap-1.5 text-xs font-semibold">
              <PhoneCall className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-pulse" />
              <span>Emergency? Call Indian Govt National Helpline 112 or Health Line 1075.</span>
            </div>

            <button
              type="button"
              id="theme-toggle-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 border border-slate-200 dark:border-slate-800/80 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center bg-white/40 dark:bg-slate-900/40 shadow-sm"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Primary Layout Block */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left-sidebar: Control parameters, Secure Health Profile */}
        <section id="sidebar-panel" className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Main App Navigation Cards */}
          <div className="glass-panel-light dark:glass-panel-dark border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 space-y-1.5 shadow-xl backdrop-blur-lg glow-medical">
            <span className="block text-[10px] font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Modes</span>
            
            <button
              type="button"
              id="nav-chat-btn"
              onClick={() => setActiveTab("chat")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-cyan-600 dark:bg-cyan-700 text-white shadow-md shadow-cyan-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Balanced Health Chat
            </button>

            <button
              type="button"
              id="nav-symptom-btn"
              onClick={() => setActiveTab("symptom")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "symptom"
                  ? "bg-cyan-600 dark:bg-cyan-700 text-white shadow-md shadow-cyan-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <Activity className="h-4 w-4" /> Symptom Checker Form
            </button>

            <button
              type="button"
              id="nav-preventive-btn"
              onClick={() => setActiveTab("preventive")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "preventive"
                  ? "bg-cyan-600 dark:bg-cyan-700 text-white shadow-md shadow-cyan-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <HeartPulseIcon className="h-4 w-4" /> Preventive Care Guide
            </button>

            <button
              type="button"
              id="nav-myth-btn"
              onClick={() => setActiveTab("myth")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "myth"
                  ? "bg-cyan-600 dark:bg-cyan-700 text-white shadow-md shadow-cyan-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <HelpCircle className="h-4 w-4" /> Health Myth Buster
            </button>

            <button
              type="button"
              id="nav-audit-btn"
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "audit"
                  ? "bg-cyan-600 dark:bg-cyan-700 text-white shadow-md shadow-cyan-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Clinician Security Audit
            </button>
          </div>

          {/* Secure Health Profile Component */}
          <div className="glass-panel-light dark:glass-panel-dark border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-lg glow-medical space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100">Local Health Profile</h3>
              </div>
              <button
                type="button"
                id="profile-opt-in-toggle"
                onClick={handleProfileOptInToggle}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  profileOptIn
                    ? "bg-cyan-100 dark:bg-cyan-950/80 border-cyan-400 dark:border-cyan-600 text-cyan-800 dark:text-cyan-100"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {profileOptIn ? "Opted In" : "Opt In"}
              </button>
            </div>

            {profileOptIn ? (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed font-medium">
                  Active parameters are automatically added to outbound chat queries to give personalized contextual guides. Encrypted locally inside your browser.
                </p>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <label htmlFor="patient-age" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Age
                    </label>
                    <input
                      id="patient-age"
                      type="number"
                      placeholder="e.g. 35"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="patient-gender" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Gender Context
                    </label>
                    <select
                      id="patient-gender"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none"
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Non-binary</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="patient-chronic" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Chronic/Allergic factors
                    </label>
                    <input
                      id="patient-chronic"
                      type="text"
                      placeholder="e.g. asthma, penicillin"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none"
                      value={patientChronic}
                      onChange={(e) => setPatientChronic(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="save-profile-btn"
                    onClick={handleSaveProfile}
                    className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-display font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer hover:scale-[1.01] active:scale-98"
                  >
                    Save Encrypted Profile
                  </button>
                  {profileSavedNotify && (
                    <span className="block text-center text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold mt-1.5 animate-pulse">
                      ✓ Saved to secure browser localStorage
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Unlock className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">Profile Is Disabled</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px] mx-auto leading-normal font-medium">
                    Turn on Profile Opt-in to secure local wellness variables. Standard stateless mode currently active.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Content Frame: Sub-Modules rendering depending on active tab */}
        <section id="content-view-panel" className="flex-grow flex flex-col min-w-0">
          
          <AnimatePresence mode="wait">
            {activeTab === "chat" && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="glass-panel-light dark:glass-panel-dark border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col h-[650px] overflow-hidden backdrop-blur-xl glow-medical"
              >
                {/* Chat Header Safety disclaimer */}
                <div className="bg-amber-500/10 dark:bg-amber-550/5 border-b border-slate-100 dark:border-slate-800/60 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Educational Guardrail Active:</span> This AI system streams grounded guidelines from the WHO, CDC, and MedlinePlus in real-time. If you trigger safety warnings, an emergency hazard guidelines card is rendered above.
                  </div>
                </div>

                {/* Chat Session Action Bar */}
                <div className="bg-slate-50/40 dark:bg-slate-900/40 border-b border-slate-150 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Active Session: {messages.length} message{messages.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScrollLocked(!isScrollLocked)}
                      className={`px-2 py-1 rounded-lg border transition-all font-semibold flex items-center gap-1 cursor-pointer text-[10px] ${
                        isScrollLocked 
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/10 border-rose-300 dark:border-rose-800' 
                          : 'text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                      }`}
                      title={isScrollLocked ? "Unlock Scroll" : "Lock Scroll to read history"}
                    >
                      {isScrollLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      <span>{isScrollLocked ? "Scroll Locked" : "Lock Scroll"}</span>
                    </button>
                    <button
                      type="button"
                      id="download-transcript-txt"
                      onClick={() => handleDownloadHistory("txt")}
                      disabled={messages.length === 0}
                      className="px-2 py-1 rounded-lg bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer text-[10px]"
                      title="Download clean text transcript of this chat"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download TXT</span>
                    </button>
                    <button
                      type="button"
                      id="download-transcript-json"
                      onClick={() => handleDownloadHistory("json")}
                      disabled={messages.length === 0}
                      className="px-2 py-1 rounded-lg bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-1 cursor-pointer text-[10px]"
                      title="Download raw JSON data of this chat"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>

                {/* Message Search Bar */}
                <div className="bg-slate-50/20 dark:bg-slate-900/20 border-b border-slate-150 dark:border-slate-800/80 px-4 py-2 flex items-center gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter current chat messages..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    />
                    {chatSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setChatSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer animate-fade-in"
                        title="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {chatSearchQuery && (
                    <span className="text-[10px] bg-cyan-500/10 dark:bg-cyan-500/5 text-cyan-700 dark:text-cyan-400 border border-cyan-500/25 px-2 py-1 rounded font-semibold shrink-0">
                      {filteredMessages.length} matched
                    </span>
                  )}
                </div>

                {/* Messages Panel */}
                <div id="messages-container" className="flex-grow p-4 space-y-4 overflow-y-auto">
                  {filteredMessages.length === 0 && chatSearchQuery.trim() !== "" ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 gap-2">
                      <Search className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                      <p className="text-xs font-medium">No messages found matching "{chatSearchQuery}"</p>
                      <button
                        type="button"
                        onClick={() => setChatSearchQuery("")}
                        className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                      >
                        Clear search filter
                      </button>
                    </div>
                  ) : (
                    filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${
                          msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            msg.role === "user"
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                              : "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-100 dark:border-cyan-800/80 text-cyan-600 dark:text-cyan-400"
                          }`}
                        >
                          {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        <div className="space-y-1.5">
                          <div
                            className={`rounded-2xl p-4 text-xs leading-relaxed ${
                              msg.role === "user"
                                ? "bg-slate-800 dark:bg-slate-900 text-slate-50 dark:text-slate-100 rounded-tr-none shadow-md"
                                : "bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-sm"
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* RAG citations display attached below Assistant text */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="pl-1 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                                Grounded Source Citations:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((src) => (
                                  <a
                                    key={src.id}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-150 dark:border-cyan-800/60 px-2 py-0.5 rounded-lg hover:bg-cyan-100/60 dark:hover:bg-cyan-900/60 transition-colors shadow-sm"
                                  >
                                    {src.source} • {src.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 px-1 mt-1 select-none">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                              {msg.timestamp}
                            </span>
                            {msg.role === "assistant" && (
                              <button
                                type="button"
                                onClick={() => speakMessage(msg.id, msg.content)}
                                className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  speakingMessageId === msg.id
                                    ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/5 hover:bg-rose-100/80"
                                    : "text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                }`}
                                title={speakingMessageId === msg.id ? "Mute speech" : "Read aloud"}
                              >
                                {speakingMessageId === msg.id ? (
                                  <>
                                    <VolumeX className="h-3 w-3 animate-pulse text-rose-600" />
                                    <span>Stop Voice</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3 w-3" />
                                    <span>Read Aloud</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Active response stream block */}
                  {isLoading && currentResponseStream && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border bg-cyan-50 dark:bg-cyan-950/50 border-cyan-100 dark:border-cyan-800/85 text-cyan-600 dark:text-cyan-400">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="space-y-1.5 flex-grow">
                        <div className="rounded-2xl p-4 text-xs leading-relaxed bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-sm">
                          {currentResponseStream}
                        </div>
                        {activeSources.length > 0 && (
                          <div className="pl-1 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              Citing Live Sources:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {activeSources.map((src) => (
                                <span
                                  key={src.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-150 dark:border-cyan-800/60 px-2 py-0.5 rounded-lg"
                                >
                                  {src.source}: {src.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <span className="block text-[9px] text-slate-400 dark:text-slate-500 px-1 font-mono animate-pulse">
                          Writing response...
                        </span>
                      </div>
                    </div>
                  )}

                  {isLoading && !currentResponseStream && (
                    <div className="flex items-center gap-2 pl-12 text-slate-400 dark:text-slate-500 text-xs py-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                      <span className="animate-pulse font-medium">Consulting clinical guidelines...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Instant warning banner from key inputs (keystroke monitor) */}
                {clientEmergency && (
                  <div className="bg-red-500/10 dark:bg-red-500/5 border-t border-b border-red-200/50 dark:border-red-900/40 px-4 py-2.5 flex items-center gap-3 text-red-800 dark:text-red-400 text-xs animate-pulse">
                    <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="font-semibold">{clientEmergency}</span>
                  </div>
                )}

                {/* Server safety emergency alert block */}
                {serverEmergencyAlert && serverEmergencyAlert.triggered && (
                  <div className="bg-red-500/10 dark:bg-red-500/5 border-t border-b border-red-300/40 dark:border-red-900/50 p-4 flex items-start gap-3.5 shadow-inner">
                    <PhoneCall className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-bounce" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-red-900 dark:text-red-200 text-xs uppercase tracking-wider">
                        Emergency Warning Triggered!
                      </h4>
                      <p className="text-[11px] font-semibold text-red-800 dark:text-red-400 leading-normal">
                        Your input matches markers for: {serverEmergencyAlert.reason}
                      </p>
                      <p className="text-[11px] text-red-700 dark:text-red-400 font-medium leading-relaxed">
                        {serverEmergencyAlert.guideline}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Chat Inputs */}
                <div className="p-4 border-t border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        id="chat-user-input"
                        disabled={isLoading}
                        placeholder={
                          isListening
                            ? "Listening... Speak your symptoms or question now"
                            : profileOptIn && patientAge
                            ? `Query as Age ${patientAge}...`
                            : "Ask any general health or wellness questions..."
                        }
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 text-xs transition-all ${
                          isListening
                            ? "border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/10 dark:ring-rose-500/5 placeholder-rose-400 dark:placeholder-rose-500 font-medium pr-28 bg-rose-50/5 dark:bg-rose-950/10 text-rose-800 dark:text-rose-200"
                            : "border-slate-200 dark:border-slate-800 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        }`}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendMessage();
                        }}
                      />
                      {isListening && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 select-none pointer-events-none bg-rose-50/95 dark:bg-rose-950/90 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-900/50 shadow-sm">
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider animate-pulse">Live Voice</span>
                          <div className="flex items-end gap-0.5 h-3 pb-0.5">
                            <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
                            <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: "150ms" }} />
                            <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: "300ms" }} />
                            <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-2.5" style={{ animationDelay: "450ms" }} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      id="toggle-mic-btn"
                      onClick={handleSpeechToTextToggle}
                      className={`p-3 rounded-xl transition-all duration-150 cursor-pointer border ${
                        isListening
                          ? "bg-rose-600 dark:bg-rose-700 text-white shadow-md border-rose-500 shadow-rose-600/20 animate-bounce"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                      title={isListening ? "Listening... Click to cancel" : "Speak with Voice Assistant"}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                    </button>

                    <button
                      type="button"
                      id="send-message-btn"
                      disabled={isLoading || !inputValue.trim()}
                      onClick={() => handleSendMessage()}
                      className={`p-3 rounded-xl transition-all duration-150 border cursor-pointer ${
                        inputValue.trim() && !isLoading
                          ? "bg-cyan-600 dark:bg-cyan-700 text-white shadow-md border-cyan-500 dark:border-cyan-600 shadow-cyan-600/15 hover:bg-cyan-700 dark:hover:bg-cyan-600"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-150 dark:border-slate-800/80 cursor-not-allowed"
                      }`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
                    <span>Press Enter to send. Keep questions general for best RAG citations.</span>
                    {profileOptIn && (
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">✓ Local Health Profile Synced</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "symptom" && (
              <motion.div
                key="symptom-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <SymptomChecker onSymptomChecked={handleSymptomCheckerSubmit} />
              </motion.div>
            )}

            {activeTab === "preventive" && (
              <motion.div
                key="preventive-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <PreventiveCare />
              </motion.div>
            )}

            {activeTab === "audit" && (
              <motion.div
                key="audit-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <AuditLogsView />
              </motion.div>
            )}

            {activeTab === "myth" && (
              <motion.div
                key="myth-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <MythBuster />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Floating Emergency Reminder Footer */}
      <footer id="app-footer-bar" className="bg-slate-950 text-slate-400 text-xs py-4 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 text-center md:text-left leading-normal">
            <strong>Educational Disclaimer:</strong> All guidance provided is for educational information and general public health awareness. Never delay seeking clinical medical assessment because of insights received on this assistant.
          </p>
          <div className="text-[11px] font-semibold text-red-500 flex items-center gap-1 hover:underline">
            <PhoneCall className="h-3 w-3 animate-pulse" /> India Emergency Helplines: Call 112 (Govt National Hotline) or 1075 (Health Help)
          </div>
        </div>
      </footer>
    </div>
  );
}
