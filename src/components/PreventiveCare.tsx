import React, { useState, useEffect } from "react";
import { HeartPulse, CheckSquare, Dumbbell, Apple, Sparkles, RefreshCw, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { PreventiveForm } from "../types";

export default function PreventiveCare() {
  const [form, setForm] = useState<PreventiveForm>({
    age: "",
    gender: "Other",
    chronicConditions: "",
    physicalActivity: "Moderately Active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("");

  // Voice playback state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop playback when component is unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleReadPlanAloud = () => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window) || !plan) {
      return;
    }

    window.speechSynthesis.cancel();

    // Remove markdown characters for realistic reading
    const cleanText = plan
      .replace(/[*_#`~>]/g, "") // strip asterisks, underscores, hashtags, backticks, tildes, blockquotes
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip links
      .replace(/NOTE:/gi, "Note.")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.age) {
      setError("Please enter your age.");
      return;
    }

    // Cancel active playback on new query
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    setLoading(true);
    setError(null);
    setPlan("");

    // Package details to query the server
    const prompt = `Identify age-specific, evidence-based preventive screenings and general diet/exercise wellness suggestions based on this demographic profile:
- Age: ${form.age} years old
- Gender: ${form.gender}
- Existing conditions: ${form.chronicConditions || "None declared"}
- Active Level: ${form.physicalActivity}

Please structure your response into 3 clear headings:
1. Recommended Screenings & Immunizations (include ages/timelines based on CDC/WHO)
2. Dietary Recommendations
3. Physical Activity Plan (suitable for a ${form.physicalActivity} individual)

Remember: give educational guidelines only, do not recommend pharmaceutical drugs or dosages, and include the standard medical advice disclaimer at the end.`;

    try {
      // Stream response directly from our server endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          sessionID: "preventive-module"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact the wellness guide server.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Streaming reader not supported by response.");
      }

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataContent = line.slice(6).trim();
              if (dataContent === "[DONE]") continue;
              try {
                const parsed = JSON.parse(dataContent);
                if (parsed.type === "content") {
                  setPlan((prev) => prev + parsed.text);
                } else if (parsed.type === "error") {
                  setError(parsed.message);
                }
              } catch (e) {
                // Ignore parsing of partial stream packets
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setForm({
      age: "",
      gender: "Other",
      chronicConditions: "",
      physicalActivity: "Moderately Active",
    });
    setPlan("");
    setError(null);
  };

  return (
    <div id="preventive-care-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Form Input Block */}
      <div id="preventive-form-panel" className="lg:col-span-5 glass-panel-light dark:glass-panel-dark rounded-2xl p-6 h-fit border border-slate-200/80 dark:border-slate-800/80 shadow-xl glow-medical backdrop-blur-lg transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 glow-medical shrink-0">
            <HeartPulse className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#1b8b0a]">Preventive Care</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prev-age" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Age (Years)
            </label>
            <input
              id="prev-age"
              type="number"
              min="1"
              max="120"
              placeholder="e.g. 45"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Gender (Assigned at Birth)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["Male", "Female", "Other"] as const).map((genderOption) => (
                <button
                  key={genderOption}
                  type="button"
                  id={`gender-opt-${genderOption.toLowerCase()}`}
                  onClick={() => setForm({ ...form, gender: genderOption })}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    form.gender === genderOption
                      ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-400 border-cyan-500 bg-cyan-50/70 font-bold shadow-sm shadow-cyan-500/10"
                      : "bg-slate-50/60 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  {genderOption}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="prev-activity" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Weekly Physical Activity
            </label>
            <select
              id="prev-activity"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none"
              value={form.physicalActivity}
              onChange={(e) => setForm({ ...form, physicalActivity: e.target.value as any })}
            >
              <option value="Sedentary">Sedentary (Little to no exercise)</option>
              <option value="Lightly Active">Lightly Active (Walking, light tasks 1-2 days/wk)</option>
              <option value="Moderately Active">Moderately Active (Moderate exercise 3-5 days/wk)</option>
              <option value="Highly Active">Highly Active (Heavy sports or physical work 6-7 days/wk)</option>
            </select>
          </div>

          <div>
            <label htmlFor="prev-conditions" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Co-existing Conditions
            </label>
            <input
              id="prev-conditions"
              type="text"
              placeholder="e.g. Mild high cholesterol, none"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              value={form.chronicConditions}
              onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
            />
          </div>

          <button
            type="submit"
            id="generate-plan-btn"
            disabled={loading}
            className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white font-display font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/10 hover:scale-[1.02] transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-100" /> Stream-generating Guide...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-cyan-100 animate-pulse" /> Generate Personalized Plan
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Guide Display */}
      <div id="preventive-results-panel" className="lg:col-span-7 glass-panel-light dark:glass-panel-dark rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xl glow-medical backdrop-blur-lg flex flex-col min-h-[400px] transition-all duration-300">
        {loading && !plan && (
          <div className="flex flex-col items-center justify-center my-auto space-y-3 text-slate-400 dark:text-slate-500">
            <RefreshCw className="h-8 w-8 text-cyan-600 dark:text-cyan-400 animate-spin" />
            <p className="text-xs font-semibold animate-pulse">Contacting medical awareness RAG system...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-red-800 dark:text-red-400 rounded-xl p-4 flex items-start gap-3 shadow-inner">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Generation Failed:</span> {error}
            </div>
          </div>
        )}

        {!loading && !plan && !error && (
          <div className="flex flex-col items-center justify-center my-auto space-y-4 text-center px-6">
            <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 glow-medical">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-700 dark:text-slate-200 text-sm">Your Personalized Preventive Blueprint</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
                Provide your clinical demographics on the left to synthesize targeted evidence-based screenings, dietary adjustments, and exercise metrics.
              </p>
            </div>
          </div>
        )}

        {(plan || loading) && (
          <div className="flex-grow flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <span className="text-xs font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" /> Dynamic Guideline Report
              </span>
              {plan && !loading && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReadPlanAloud}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all border cursor-pointer ${
                      isSpeaking
                        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100/80 dark:hover:bg-rose-900 border-rose-200 dark:border-rose-900"
                        : "text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="h-3 w-3 animate-pulse text-rose-600 dark:text-rose-400" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3" />
                        <span>Read Aloud</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    id="reset-plan-btn"
                    onClick={handleReset}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Clear Report
                  </button>
                </div>
              )}
            </div>

            <div id="preventive-report-body" className="text-xs bg-slate-950 dark:bg-black text-slate-100 border border-slate-800 p-4 rounded-xl leading-relaxed whitespace-pre-wrap font-sans flex-grow overflow-y-auto max-h-[500px] pr-2">
              {plan}
            </div>

            {loading && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping"></span>
                <span>Writing guidelines with CDC/WHO reference alignment...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
