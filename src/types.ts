export interface GroundedSource {
  id: string;
  title: string;
  source: string;
  url: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isEmergency?: boolean;
  emergencyReason?: string | null;
  sources?: GroundedSource[];
}

export interface SymptomForm {
  symptom: string;
  severity: "Mild" | "Moderate" | "Severe";
  duration: string;
  age: string;
  chronicConditions: string;
}

export interface PreventiveForm {
  age: string;
  gender: "Male" | "Female" | "Other";
  chronicConditions: string;
  physicalActivity: "Sedentary" | "Lightly Active" | "Moderately Active" | "Highly Active";
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  sessionID: string;
  querySummary: string;
  emergencyTriggered: boolean;
  emergencyType: string | null;
  responseTimeMs: number;
  sourcesCited: string[];
}
