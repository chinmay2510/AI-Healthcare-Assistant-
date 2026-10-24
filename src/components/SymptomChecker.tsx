import React, { useState, useRef, useEffect } from "react";
import { Activity, ArrowRight, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, Send, Mic, Volume2, VolumeX } from "lucide-react";
import { SymptomForm } from "../types";

interface SymptomCheckerProps {
  onSymptomChecked: (symptomSummary: string) => void;
}

export default function SymptomChecker({ onSymptomChecked }: SymptomCheckerProps) {
  const [form, setForm] = useState<SymptomForm>({
    symptom: "",
    severity: "Mild",
    duration: "1 day",
    age: "Adult (18-64)",
    chronicConditions: "",
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    emergencyCheck: { triggered: boolean; reason: string | null; guideline: string | null };
    nextRecommendedSteps: string[];
    summaryContext: string;
  } | null>(null);

  // Voice Assistant local states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Stop synthesis and recognition on change/reset
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const handleSpeechToText = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not fully supported in this browser frame. Try on Chrome/Safari.");
      return;
    }

    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);

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
          setForm((prev) => ({
            ...prev,
            symptom: prev.symptom ? `${prev.symptom} ${transcript}` : transcript,
          }));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  const handleReadGuidanceAloud = () => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window) || !result) {
      return;
    }

    window.speechSynthesis.cancel();

    const speechParts: string[] = [];
    if (result.emergencyCheck.triggered) {
      speechParts.push(`Emergency Warning! Detected indicators of ${result.emergencyCheck.reason || "acute crisis"}. Guidance is: ${result.emergencyCheck.guideline}`);
    } else {
      speechParts.push("Your symptoms were screened. No critical medical emergency words were identified.");
    }

    speechParts.push("Precautionary recommendations are as follows:");
    result.nextRecommendedSteps.forEach((rec, idx) => {
      speechParts.push(`Number ${idx + 1}: ${rec}`);
    });

    const utterance = new SpeechSynthesisUtterance(speechParts.join(". "));
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.error("Synthesis error:", e);
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form.symptom.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/symptom-check-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      console.error("Symptom guidance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      symptom: "",
      severity: "Mild",
      duration: "1 day",
      age: "Adult (18-64)",
      chronicConditions: "",
    });
    setStep(1);
    setResult(null);
  };

  const handleStartAIChat = () => {
    if (result) {
      const chatPrompt = `Hello, I've completed the guided symptom checker. Here is my profile:\n\n${result.summaryContext}\n\nPlease explain what these symptoms could generally indicate educationally, offer standard lifestyle/precautionary actions, and outline what symptoms I should watch for that would require professional medical care.`;
      onSymptomChecked(chatPrompt);
    }
  };

  return (
    <div id="symptom-checker-card" className="glass-panel-light dark:glass-panel-dark rounded-2xl p-6 max-w-2xl mx-auto shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg glow-medical">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 glow-medical shrink-0">
          <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="font-display font-bold text-lg text-[#16922b]">Guided Symptom Screening</h3>
      </div>

      {step < 4 && (
        <div className="flex items-center justify-between mb-6 text-xs text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <span className={step === 1 ? "text-cyan-600 dark:text-cyan-400" : ""}>1. Primary Symptom</span>
          <span className={step === 2 ? "text-cyan-600 dark:text-cyan-400" : ""}>2. Severity & Timeline</span>
          <span className={step === 3 ? "text-cyan-600 dark:text-cyan-400" : ""}>3. Health Profile</span>
        </div>
      )}

      {/* Step 1: Symptom */}
      {step === 1 && (
        <div id="step-1-container" className="space-y-4 animate-in fade-in slide-in-from-right-5 duration-150">
          <div>
            <label htmlFor="symptom-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              What primary symptom are you experiencing?
            </label>
            <div className="relative">
              <textarea
                id="symptom-input"
                rows={3}
                placeholder={isListening ? "Listening... Speak your symptoms now" : "e.g. Dull headache, dry scratchy throat, nasal congestion, mild stomach discomfort..."}
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 text-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-100 transition-all focus:outline-none ${
                  isListening
                    ? "border-rose-400 ring-2 ring-rose-500/15 placeholder-rose-400 dark:placeholder-rose-500/60 font-medium bg-rose-50/50 dark:bg-rose-950/40 pl-24 text-slate-950 dark:text-slate-100"
                    : "border-slate-300 dark:border-slate-700 focus:ring-cyan-500/20 focus:border-cyan-500"
                }`}
                value={form.symptom}
                onChange={(e) => setForm({ ...form, symptom: e.target.value })}
              />
              {isListening && (
                <div className="absolute left-3 top-3 flex items-center gap-1 select-none pointer-events-none bg-rose-50/95 dark:bg-rose-950/95 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-900 shadow-sm">
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider animate-pulse">Speak</span>
                  <div className="flex items-end gap-0.5 h-2.5 pb-0.5">
                    <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: "0ms" }} />
                    <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-2.5" style={{ animationDelay: "150ms" }} />
                    <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-1" style={{ animationDelay: "300ms" }} />
                    <span className="w-0.5 bg-rose-500 rounded-full animate-bounce h-2" style={{ animationDelay: "450ms" }} />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleSpeechToText}
                className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all cursor-pointer ${
                  isListening
                    ? "bg-rose-600 text-white animate-bounce shadow-md"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
                title={isListening ? "Listening... click to stop" : "Dictate symptoms with voice"}
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Be brief and specify the location (e.g., upper arm, right side of abdomen, forehead). Do not enter any PII (names, SSN, etc.).
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100/50 dark:border-slate-800/40">
            <button
              type="button"
              id="step-1-next"
              disabled={!form.symptom.trim()}
              onClick={handleNext}
              className={`px-5 py-2.5 rounded-xl font-display font-semibold text-sm flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                form.symptom.trim()
                  ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-600/10 hover:scale-[1.02] active:scale-98"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              }`}
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Severity & Timeline */}
      {step === 2 && (
        <div id="step-2-container" className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-150">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              How severe is this discomfort?
            </span>
            <div className="grid grid-cols-3 gap-3">
              {(["Mild", "Moderate", "Severe"] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  id={`severity-btn-${sev.toLowerCase()}`}
                  onClick={() => setForm({ ...form, severity: sev })}
                  className={`py-3 rounded-xl font-display font-semibold text-xs border transition-all cursor-pointer ${
                    form.severity === sev
                      ? sev === "Mild"
                        ? "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 text-cyan-800 dark:text-cyan-400 shadow-sm shadow-cyan-500/10"
                        : sev === "Moderate"
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-400 shadow-sm shadow-amber-500/10"
                        : "bg-red-50 dark:bg-red-950/40 border-red-500 text-red-800 dark:text-red-400 shadow-sm shadow-red-500/10 font-bold"
                      : "bg-slate-50/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="duration-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              How long has this symptom been present?
            </label>
            <select
              id="duration-input"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            >
              <option value="Less than 12 hours">Less than 12 hours</option>
              <option value="1 day">1 day</option>
              <option value="2-3 days">2-3 days</option>
              <option value="4-7 days">4-7 days</option>
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="More than 2 weeks">More than 2 weeks</option>
            </select>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100/50 dark:border-slate-800/40">
            <button
              type="button"
              id="step-2-back"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              id="step-2-next"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 dark:bg-cyan-700 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 font-display font-semibold text-sm flex items-center gap-1.5 shadow-md shadow-cyan-600/10 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Health Profile */}
      {step === 3 && (
        <div id="step-3-container" className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-150">
          <div>
            <label htmlFor="age-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Age Group of the Patient
            </label>
            <select
              id="age-select"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            >
              <option value="Infant (under 2 years)">Infant (under 2 years)</option>
              <option value="Child (2-12 years)">Child (2-12 years)</option>
              <option value="Adolescent (13-17 years)">Adolescent (13-17 years)</option>
              <option value="Adult (18-64)">Adult (18-64)</option>
              <option value="Senior (65+ years)">Senior (65+ years)</option>
            </select>
          </div>

          <div>
            <label htmlFor="conditions-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Known chronic or pre-existing conditions (Optional)
            </label>
            <input
              id="conditions-input"
              type="text"
              placeholder="e.g. Asthma, High Blood Pressure, Diabetes, Penicillin Allergy"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              value={form.chronicConditions}
              onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100/50 dark:border-slate-800/40">
            <button
              type="button"
              id="step-3-back"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              id="step-3-submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-500 dark:to-indigo-500 text-white font-display font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Screening...
                </>
              ) : (
                <>
                  Perform Symptom Review <CheckCircle className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results Display */}
      {step === 4 && result && (
        <div id="step-4-container" className="space-y-6 animate-in fade-in duration-300">
          {/* Emergency Alarm Banner if triggered */}
          {result.emergencyCheck.triggered ? (
            <div className="bg-red-500/10 dark:bg-red-500/5 border-2 border-red-500 p-5 rounded-2xl flex items-start gap-4 shadow-xl shadow-red-500/5 animate-pulse">
              <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-display font-bold text-red-900 dark:text-red-300 text-sm uppercase tracking-wide">
                  Emergency Alert Triggered!
                </h4>
                <p className="text-xs font-bold text-red-800 dark:text-red-400">
                  Detected indicators of: {result.emergencyCheck.reason}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300/90 leading-relaxed font-semibold">
                  {result.emergencyCheck.guideline}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-cyan-500/10 dark:bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl flex items-center gap-3 shadow-inner">
              <CheckCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0 animate-pulse" />
              <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-400">
                Symptom screened safely: No critical life-threatening emergency words detected in initial input.
              </span>
            </div>
          )}

          {/* Form Parameters Summary */}
          <div className="bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-xl text-xs space-y-1.5 border border-slate-200/50 dark:border-slate-800/80">
            <span className="font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 text-[10px]">
              Screened Case Summary
            </span>
            <div className="grid grid-cols-2 gap-y-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <div><strong className="text-slate-700 dark:text-slate-100">Patient Profile:</strong> {form.age}</div>
              <div><strong className="text-slate-700 dark:text-slate-100">Primary Discomfort:</strong> {form.symptom}</div>
              <div><strong className="text-slate-700 dark:text-slate-100">Severity Factor:</strong> {form.severity}</div>
              <div><strong className="text-slate-700 dark:text-slate-100">Duration Profile:</strong> {form.duration}</div>
              <div className="col-span-2">
                <strong className="text-slate-700 dark:text-slate-100">Co-existing Illnesses:</strong> {form.chronicConditions || "None declared"}
              </div>
            </div>
          </div>

          {/* Clinical Steps */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-sm font-display font-bold text-slate-800 dark:text-slate-100">Immediate Precautionary Recommendations</h4>
              <button
                type="button"
                onClick={handleReadGuidanceAloud}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border cursor-pointer ${
                  isSpeaking
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Read Guidance Aloud</span>
                  </>
                )}
              </button>
            </div>
            <ul className="space-y-2.5">
              {result.nextRecommendedSteps.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans font-medium">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              id="symptom-checker-reset"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-display font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Start New Screen
            </button>

            <button
              type="button"
              id="start-ai-chat-btn"
              onClick={handleStartAIChat}
              className="w-full sm:flex-grow px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white font-display font-semibold text-xs shadow-lg shadow-cyan-600/10 flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-98 cursor-pointer transition-all"
            >
              <Send className="h-3.5 w-3.5 text-cyan-100" /> Feed to AI Consultation Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
