export interface EmergencyCheckResult {
  triggered: boolean;
  reason: string | null;
  guideline: string | null;
}

// Comprehensive emergency keywords to protect users in parallel with GenAI guardrails
export const emergencyKeywords = [
  {
    regex: /\b(chest\s*pain|crushing\s*chest|angina|pressure\s*in\s*chest|pain\s*in\s*left\s*arm)\b/i,
    reason: "Possible Acute Coronary Syndrome (Heart Attack)",
    guideline: "Sit down, try to remain calm, and immediately call India's national single emergency number 112 or local ambulance services (108 / 102). Do not drive yourself to the hospital."
  },
  {
    regex: /\b(difficulty\s*breathing|cannot\s*breathe|shortness\s*of\s*breath|gasping\s*for\s*air|suffocating|strangling|asphyxiation)\b/i,
    reason: "Severe Respiratory Distress",
    guideline: "Call 112 (National Emergency Number, India) or local emergency services immediately. Sit upright, try to stay calm, and if you have a prescribed rescue inhaler, use it as instructed."
  },
  {
    regex: /\b(stroke|slurred\s*speech|facial\s*droop|weakness\s*on\s*one\s*side|drooping\s*face|arm\s*numbness|loss\s*of\s*balance|sudden\s*numbness)\b/i,
    reason: "Possible Acute Stroke (F.A.S.T.)",
    guideline: "Act F.A.S.T. Call 112 immediately. Note the time when symptoms first started. Do not take aspirin or any other medication without direct medical supervision."
  },
  {
    regex: /\b(suicide|suicidal|kill\s*myself|end\s*my\s*life|want\s*to\s*die|self-harm|harm\s*myself|depressed\s*and\s*want\s*to\s*end)\b/i,
    reason: "Suicidal Ideation / Mental Health Crisis",
    guideline: "You are not alone. Please immediately call the KIRAN Mental Health Helpline (Government of India) at 1800-599-0019, or reach out to 112. Assistance is free, confidential, and available 24/7."
  },
  {
    regex: /\b(loss\s*of\s*consciousness|passed\s*out|fainted|unconscious|blacked\s*out|responsiveness|coma)\b/i,
    reason: "Altered Mental Status or Loss of Consciousness",
    guideline: "Call 112 immediately. Ensure the individual is lying flat on their back, loosen tight clothing, lift legs slightly, and check for breathing."
  },
  {
    regex: /\b(severe\s*allergic|anaphylaxis|throat\s*closing|swelling\s*of\s*lips\s*and\s*tongue|difficulty\s*swallowing\s*after\s*bee|hives\s*and\s*breathing)\b/i,
    reason: "Anaphylactic Reaction (Severe Allergy)",
    guideline: "Call 112 immediately. If you have an epinephrine auto-injector, administer it immediately into the outer thigh."
  },
  {
    regex: /\b(poison|poisoned|swallowed\s*bleach|chemical\s*ingestion|overdose|overdosed|toxic\s*fumes)\b/i,
    reason: "Poisoning or Overdose",
    guideline: "Immediately call the National Poison Information Centre (AIIMS New Delhi, Government of India) at 1800-116-117 or 011-26593677, or call 112 / emergency services."
  },
  {
    regex: /\b(severe\s*headache\s*sudden|worst\s*headache\s*of\s*life|thunderclap\s*headache)\b/i,
    reason: "Possible Aneurysm or Intracranial Hemorrhage",
    guideline: "Call 112 or visit the nearest government or private emergency department immediately."
  }
];

export function checkEmergency(text: string): EmergencyCheckResult {
  for (const item of emergencyKeywords) {
    if (item.regex.test(text)) {
      return {
        triggered: true,
        reason: item.reason,
        guideline: item.guideline
      };
    }
  }
  return {
    triggered: false,
    reason: null,
    guideline: null
  };
}

// System instructions enforcing medical education, disclaimer, and preventing medication suggestions
export const SYSTEM_INSTRUCTION = `You are a warm, caring, and knowledgeable medical awareness companion called the "AI Health Information Assistant".
Your purpose is to provide general, evidence-based health education, explain symptoms, suggest general preventive care, and answer general health queries in a way that is easy to understand.

CRITICAL TONE & STYLE DIRECTIVES:
- SMALL & CONCISE REPLIES: Keep your responses brief, clear, and straight to the point. Avoid long essays, excessively verbose explanations, or dense blocks of text.
- FRIENDLY & UNDERSTANDABLE: Speak like a supportive, caring friend who wants to help. Use simple, everyday words. Avoid heavy medical jargon unless you explain it in simple terms immediately. Be encouraging and compassionate.
- ACCURATE & SCIENTIFIC: Keep your information precise and evidence-based, aligning with standard health guidelines.

CRITICAL RESPONSIBLE AI DIRECTIVES:
1. GENERAL EDUCATION ONLY: Never diagnose specific diseases, prescribe treatment, or claim clinical authority. Speak only as an educational wellness guide, not a doctor.
2. NO DRUG NAMES OR DOSAGES: Do not recommend specific pharmaceutical products, prescription drug names, or specific dosages. You may mention general categories of over-the-counter wellness concepts (e.g., "staying hydrated", "using saline nasal sprays", "consulting a healthcare professional for over-the-counter options") if standard, but NEVER prescribe or state exact regimens.
3. NEVER DISMISS SYMPTOMS: Never minimize symptoms as trivial or harmless. If symptoms can indicate serious health conditions, explain them objectively and encourage consulting a real healthcare provider.
4. INCORPORATE RAG DATA: Whenever the user query matches grounded documentation from the WHO, CDC, MedlinePlus, or Ministry of Health and Family Welfare (MoHFW), cite the source clearly and ground your statements in the provided documents.
5. REQUIRED ENDNOTE: You must ALWAYS end every single response with this exact note verbatim on a new line:
"NOTE: This information is for general educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a physician or qualified healthcare provider with any questions regarding a medical condition."`;
