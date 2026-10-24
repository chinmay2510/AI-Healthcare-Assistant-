export interface AuditLog {
  id: string;
  timestamp: string;
  sessionID: string;
  querySummary: string; // Trimmed/masked for PII
  emergencyTriggered: boolean;
  emergencyType: string | null;
  responseTimeMs: number;
  sourcesCited: string[];
}

const logs: AuditLog[] = [];

export function addAuditLog(log: Omit<AuditLog, "id" | "timestamp">) {
  const newLog: AuditLog = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  // Limit array to 100 entries to prevent memory leak
  if (logs.length >= 100) {
    logs.shift();
  }
  logs.push(newLog);
  console.log(`[SAFETY AUDIT LOG] ${newLog.timestamp} | Session: ${newLog.sessionID} | Emergency Triggered: ${newLog.emergencyTriggered}`);
}

export function getAuditLogs(): AuditLog[] {
  return [...logs].reverse();
}
