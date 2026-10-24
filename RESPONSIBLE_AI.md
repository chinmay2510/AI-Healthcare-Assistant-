# Responsible AI Safeguards & Clinical Guardrails
### AI Health Information Assistant

This document outlines the multi-layered safety boundaries, keyword/regex parallel emergency screenings, system prompts, rate limit configs, and local data protection designs implemented within the **AI Health Information Assistant**.

---

## 1. Safety Architecture Overview
The application uses a **Defense-in-Depth** safety strategy to prevent the model from generating dangerous diagnoses or drug advice, while actively protecting users experiencing life-threatening symptoms:

```
  [User Inbound Query]
          │
          ├─────────────────────────┐
          ▼                         ▼
  [Parallel Regex Screening]  [Local RAG Document Search]
  (Chest pain, stroke, etc.)  (CDC, WHO, MedlinePlus citations)
          │                         │
          ▼                         ▼
  [Emergency Alert Banner]    [Context Prepend to Prompt]
          │                         │
          └────────────┬────────────┘
                       ▼
            [System Prompts Guardrail]
            (Low temperature, No drugs)
                       ▼
          [Real-time Token Streaming]
                       ▼
          [PII Scrubbed Safety Audit]
```

---

## 2. Multi-Layer Safeguard Specifications

### A. Parallel Regex Emergency Filter (`server/safety.ts`)
We run a regex keyword screening process *in parallel* with the Gemini API to identify immediate medical crises. The model's reasoning alone is not relied upon for safety:
* **Trigger Conditions:** Screens for severe symptoms including chest pain (heart attack markers), breathing failure (anaphylaxis/respiratory distress), sudden slurred speech or facial droop (acute stroke), and explicit suicidal ideation.
* **Instant Action:** If triggered, the server prepends emergency alert metadata to the event stream, forcing a high-priority red **Emergency Alert Banner** with precise instructions (e.g. telling the user to sit upright, call 911, administer epinephrine, or dial the 988 Crisis Lifeline).
* **Real-time Keystroke Monitor (Client-side):** As the user types in the input box, client-side regex matches input terms in real-time. If matched, a warning banner appears *before* they click submit to encourage immediate emergency action.

### B. GenAI System Instructions (`server/safety.ts`)
The system prompt contains strict instructions that govern how the Gemini model generates answers:
1. **Scope Limit:** Mandates educational general guidance only; prohibits diagnoses and prescriptive treatment instructions.
2. **Medication Ban:** Explicitly bans generating specific prescription drug names or chemical dosages.
3. **No Minimization:** Forbids trivializing severe symptoms.
4. **Verbatim Disclaimer:** Enforces a persistent required disclaimer note on a new line at the end of every response:
   > *"NOTE: This information is for general educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment..."*

### C. Curated RAG Grounding (`server/knowledge.ts`)
To prevent GenAI hallucinations, a local Retrieval-Augmented Generation (RAG) vector layer scans a database of guidelines from the World Health Organization (WHO), Centers for Disease Control (CDC), and MedlinePlus.
* Grounded documents are prepended as context to the prompt, instructing the model to rely only on documented clinical facts.
* Relevant documents are streamed back to the user, providing links and official citation footnotes next to the response.

### D. Rate Limiting & Audit Logging (`server/rateLimiter.ts` & `server/auditLogger.ts`)
* **Abuse Protection:** Outbound AI queries are rate-limited per minute/IP (30 requests/min maximum) to protect server API credits and prevent brute-force attacks.
* **Clinician Safety Dashboard:** A secure log tracks request latency, emergency alerts hit, and citations compiled. 
* **PII Compliance:** The audit logger scrubs Protected Health Information (PHI) and PII before storing records in memory, ensuring full audit compliance.

### E. Local Storage Profile Encryption (`src/App.tsx`)
Users can opt in to a personal profile (Age, Gender, Chronic factors). 
* To ensure patient privacy, this data is saved **only** on the user's browser local state (simulating a client-side encrypted sandbox) and is never persisted on any remote cloud database, leaving the patient in full ownership of their health variables.
