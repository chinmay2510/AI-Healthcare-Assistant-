import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, FileText, RefreshCw, Clock, ExternalLink } from "lucide-react";
import { AuditLogEntry } from "../types";

export default function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/audit-logs");
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load safety audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh logs every 15 seconds
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="audit-logs-card" className="glass-panel-light dark:glass-panel-dark rounded-2xl p-6 max-w-4xl mx-auto shadow-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg glow-medical transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 glow-medical shrink-0">
            <ShieldCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-[#2aa10b]">Clinical Safety Audit Logs</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Real-time server-side safety checks (PII scrubbed for privacy compliance)</p>
          </div>
        </div>
        <button
          type="button"
          id="refresh-logs-btn"
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-500" : ""}`} /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-950 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Session ID</th>
              <th className="p-3.5">Query Summary</th>
              <th className="p-3.5">Safety Trigger</th>
              <th className="p-3.5 text-right font-display">Latency</th>
              <th className="p-3.5">Sources Cited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-700 animate-pulse" />
                  No security audits logged yet. Submit inquiries or run symptom check to see safety tracking.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="p-3.5 whitespace-nowrap text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400 max-w-[100px] truncate" title={log.sessionID}>
                    {log.sessionID}
                  </td>
                  <td className="p-3.5 max-w-[180px] truncate font-medium text-slate-700 dark:text-slate-200" title={log.querySummary}>
                    {log.querySummary}
                  </td>
                  <td className="p-3.5">
                    {log.emergencyTriggered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/5 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-bold text-[10px]">
                        <ShieldAlert className="h-3 w-3 animate-pulse" /> Emergency: {log.emergencyType}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/50 text-[10px] font-bold">
                        <ShieldCheck className="h-3 w-3" /> Clear
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="h-3 w-3 text-slate-400 dark:text-slate-600" /> {log.responseTimeMs}ms
                    </span>
                  </td>
                  <td className="p-3.5 max-w-[180px] truncate" title={log.sourcesCited.join(", ")}>
                    {log.sourcesCited.length > 0 ? (
                       <span className="text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-500/10 dark:bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-900/50">
                        {log.sourcesCited.join(", ")}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 font-medium">None</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-start gap-2.5 text-xs bg-amber-500/10 dark:bg-amber-500/5 text-amber-800 dark:text-amber-400 p-4 rounded-xl border border-amber-500/20 shadow-inner">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
        <div className="leading-relaxed font-sans font-medium">
          <span className="font-bold">Compliance Checklist Verification:</span> Our server scrubbing utility ensures no Protected Health Information (PHI) or Personally Identifiable Information (PII) is ever written to safety log indices. Outgoing responses and incoming strings are checked asynchronously.
        </div>
      </div>
    </div>
  );
}
