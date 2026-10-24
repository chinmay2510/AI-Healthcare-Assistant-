import React, { useState } from "react";
import { 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  XCircle, 
  HelpCircle as QuestionIcon,
  BookOpen,
  Info
} from "lucide-react";

interface MythBusterProps {
  onAddAuditLog?: (summary: string) => void;
}

const CURATED_MYTHS = [
  {
    id: "cold-water",
    title: "Does drinking cold water cause a cold?",
    short: "Belief that cold drinks trigger viral infections."
  },
  {
    id: "knuckles-arthritis",
    title: "Does cracking your knuckles cause arthritis?",
    short: "Concern about joint damage from repetitive popping."
  },
  {
    id: "carrots-vision",
    title: "Does eating carrots improve your night vision?",
    short: "WWII propaganda about vegetable-induced radar eyesight."
  },
  {
    id: "sugar-hyper",
    title: "Does sugar make children hyperactive?",
    short: "Linking candy and dessert consumption to behavioral spikes."
  },
  {
    id: "gum-stomach",
    title: "Does chewing gum stay in your stomach for 7 years?",
    short: "Folk warning about accidental swallows."
  },
  {
    id: "brain-percent",
    title: "Do humans only use 10% of their brains?",
    short: "Neurological myth about unlocked mental capacity."
  }
];

export default function MythBuster({ onAddAuditLog }: MythBusterProps) {
  const [customQuestion, setCustomQuestion] = useState("");
  const [selectedMythId, setSelectedMythId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdictReport, setVerdictReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Parse structured sections of the verdict report for richer UI layout
  const parseVerdict = (text: string) => {
    let verdict: "MYTH" | "FACT" | "PARTIAL TRUTH" | "COMPLEX" | "UNKNOWN" = "UNKNOWN";
    const lowerText = text.toUpperCase();
    
    if (lowerText.includes("VERDICT: MYTH") || lowerText.includes("**VERDICT**: MYTH") || lowerText.includes("**VERDICT:** MYTH") || lowerText.includes("VERDICT: UNTRUE")) {
      verdict = "MYTH";
    } else if (lowerText.includes("VERDICT: FACT") || lowerText.includes("**VERDICT**: FACT") || lowerText.includes("**VERDICT:** FACT") || lowerText.includes("VERDICT: TRUE")) {
      verdict = "FACT";
    } else if (lowerText.includes("VERDICT: PARTIAL TRUTH") || lowerText.includes("**VERDICT**: PARTIAL TRUTH") || lowerText.includes("**VERDICT:** PARTIAL TRUTH") || lowerText.includes("PARTIALLY TRUE")) {
      verdict = "PARTIAL TRUTH";
    } else if (lowerText.includes("VERDICT: COMPLEX") || lowerText.includes("**VERDICT**: COMPLEX") || lowerText.includes("**VERDICT:** COMPLEX")) {
      verdict = "COMPLEX";
    }

    return verdict;
  };

  const handleSpeakToggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not fully supported in this browser environment.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown characters out of text for natural speaking
    const cleanText = verdictReport
      .replace(/[*#`_\-]/g, "")
      .replace(/\[.*?\]/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleMythQuery = async (question: string, id: string | null) => {
    setSelectedMythId(id);
    setCustomQuestion(question);

    // Cancel active playback on new query
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    setLoading(true);
    setError(null);
    setVerdictReport("");

    const prompt = `You are a medical facts and public health expert. Analyze the following health belief or question: "${question}"

Please provide a highly structured, scientifically rigorous, yet conversational public health explanation. 

You MUST use the exact structure below:
**VERDICT**: [State one word clearly: MYTH, FACT, PARTIAL TRUTH, or COMPLEX]

**THE SHORT VERDICT**:
[Provide a clear, 1-2 sentence direct explanation of why it is a myth/fact]

**THE SCIENTIFIC EVIDENCE**:
[Provide a thorough, evidence-based scientific breakdown of what clinical studies and health authorities like WHO, NIH, or Mayo Clinic say about this. Explain the physiology/biology clearly so users understand the actual mechanisms]

**ORIGIN OF THE BELIEF**:
[Explain why this myth started or why it is so widely believed by people]

**ACTIONABLE TAKEAWAY**:
[What should the user actually do? Give practical, safe, evidence-based recommendations]

Remember: Keep the tone empathetic and informative, never dismissive, and include the standard medical educational disclaimer at the end. Do not recommend specific pharmaceutical dosages.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          sessionID: "myth-buster-module"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact the health facts server.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Streaming reader not supported by response.");
      }

      let done = false;
      let fullText = "";
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
                  fullText += parsed.text;
                  setVerdictReport(fullText);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) {
      setError("Please type a health myth question to investigate.");
      return;
    }
    handleMythQuery(customQuestion, null);
  };

  const parsedVerdictType = parseVerdict(verdictReport);

  return (
    <div id="myth-buster-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Form Input / Curated Myths Selector */}
      <div id="myth-form-panel" className="lg:col-span-5 glass-panel-light dark:glass-panel-dark rounded-2xl p-6 h-fit border border-slate-200/80 dark:border-slate-800/80 shadow-xl glow-medical backdrop-blur-lg transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 glow-medical shrink-0">
            <HelpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#16922b]">Health Myth Buster</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Uncover the scientific evidence behind common home remedies, beliefs, and old wives' tales. 
          Enter your own or pick a popular topic below.
        </p>

        {/* Selected / Custom Query Box */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="myth-input" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Ask or Investigate a Health Belief
            </label>
            <div className="relative">
              <input
                id="myth-input"
                type="text"
                placeholder="e.g. Does cold weather directly cause a cold?"
                className="w-full pl-4 pr-12 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Curated Pre-set Myths Grid */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Popular Curated Myths
          </span>
          <div className="space-y-2.5">
            {CURATED_MYTHS.map((myth) => {
              const isSelected = selectedMythId === myth.id;
              return (
                <button
                  key={myth.id}
                  type="button"
                  id={`myth-preset-${myth.id}`}
                  onClick={() => handleMythQuery(myth.title, myth.id)}
                  className={`w-full text-left p-3 border rounded-xl transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-emerald-500 shadow-sm"
                      : "bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <QuestionIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                    {myth.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-5">
                    {myth.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Explanation Display */}
      <div id="myth-results-panel" className="lg:col-span-7 glass-panel-light dark:glass-panel-dark rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xl glow-medical backdrop-blur-lg flex flex-col min-h-[450px] transition-all duration-300">
        {loading && !verdictReport && (
          <div className="flex flex-col items-center justify-center my-auto space-y-3 text-slate-400 dark:text-slate-500">
            <RefreshCw className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-xs font-semibold animate-pulse">Analyzing scientific literature & consensus docs...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-red-800 dark:text-red-400 rounded-xl p-4 flex items-start gap-3 shadow-inner">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Investigation Failed:</span> {error}
            </div>
          </div>
        )}

        {!loading && !verdictReport && !error && (
          <div className="flex flex-col items-center justify-center my-auto space-y-4 text-center px-6">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 glow-medical animate-bounce">
              <HelpCircle className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-700 dark:text-slate-200 text-sm">Awaiting Myth Investigation</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed font-medium">
                Select a popular curated myth on the left or type your own custom health question to generate an evidence-based clinical verdict backed by global medical consensus.
              </p>
            </div>
          </div>
        )}

        {(verdictReport || loading) && (
          <div className="flex-grow flex flex-col h-full justify-between">
            <div>
              {/* Verdict Header Status */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <span className="text-xs font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest inline-flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Consensus Verdict Report
                </span>
                
                <button
                  type="button"
                  id="myth-tts-btn"
                  onClick={handleSpeakToggle}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    isSpeaking
                      ? "bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-850 text-rose-700 dark:text-rose-300 animate-pulse"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                  title={isSpeaking ? "Mute Speaking" : "Listen to Explanation"}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" /> Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" /> Read Aloud
                    </>
                  )}
                </button>
              </div>

              {/* Verdict Indicator Badge */}
              {parsedVerdictType !== "UNKNOWN" && (
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase border shadow-sm ${
                    parsedVerdictType === "MYTH" 
                      ? "bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      : parsedVerdictType === "FACT"
                      ? "bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 dark:bg-amber-500/5 text-amber-600 dark:text-amber-450 border-amber-500/20"
                  }`}>
                    {parsedVerdictType === "MYTH" ? (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    ) : parsedVerdictType === "FACT" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Info className="h-4 w-4 text-amber-500" />
                    )}
                    <span>VERDICT: {parsedVerdictType}</span>
                  </div>
                </div>
              )}

              {/* Text explanation body */}
              <div 
                id="myth-report-body" 
                className="text-xs bg-slate-950 dark:bg-black text-slate-100 border border-slate-800 p-5 rounded-2xl leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto max-h-[500px]"
              >
                {verdictReport}
              </div>
            </div>

            {/* Scientific Consensus Disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Verdicts are synthesized from general peer-reviewed literature and standard public health guidance. This report is for educational purposes and does not substitute for personalized clinical advice.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
