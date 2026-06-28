"use client";
import React, { useState } from "react";
import { X, Sparkles, MessageSquareQuote, Lightbulb, RefreshCw, BarChart3, ShieldCheck } from "lucide-react";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";

interface TutorPanelProps {
  question: string;
  userAnswer: string;
  onClose: () => void;
}

interface RefineRequest {
  sessionId: string;
  question: string;
  userAnswer: string;
  tutorMode: "gold_standard" | "comparative" | "second_attempt" | "study_roadmap" | "gap_fixer";
}

export const TutorPanel: React.FC<TutorPanelProps> = ({ question, userAnswer, onClose }) => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mode, setMode] = useState<"gold_standard" | "comparative" | "second_attempt" | "study_roadmap" | "gap_fixer">("gold_standard");
  const [error, setError] = useState<string | null>(null);

  const handleRefine = async (selectedMode: "gold_standard" | "comparative" | "second_attempt" | "study_roadmap" | "gap_fixer") => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setFeedback(null);
    setMode(selectedMode);

    try {
      const res = await fetch(`${API_BASE}/tutor/refine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        } as Record<string, string>,
        body: JSON.stringify({
          sessionId: (window as { currentSessionId?: string }).currentSessionId || "",
          question,
          userAnswer,
          tutorMode: selectedMode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to get feedback: ${res.statusText}`);
      }

      const data = await res.json();
      setFeedback(data.feedback);
    } catch (err: Error | unknown) {
      console.error("Tutor error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to tutor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-[420px] bg-background-alt border-l border-border flex flex-col animate-slide-in-right shadow-[-10px_0_30px_rgba(0,0,0,0.3)]"
    >
      {/* Header */}
      <div
        className="p-5 border-b border-border flex justify-between items-center bg-slate-900/80 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h2 className="text-base font-extrabold">AI Tutor</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-md bg-secondary hover:bg-secondary-hover text-foreground-muted hover:text-foreground transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-[10px] text-foreground-muted mb-1 font-bold uppercase tracking-widest">
            The Question
          </p>
          <p className="text-sm leading-relaxed text-foreground">{question}</p>
        </div>

        <div className="mb-6">
          <p className="text-[10px] text-foreground-muted mb-1 font-bold uppercase tracking-widest">
            Your Answer
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted italic">
            {"\""}{userAnswer}{"\""}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-[10px] text-foreground-muted mb-2 font-bold uppercase tracking-widest">
            Learning Mode
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRefine("gold_standard")}
              disabled={loading}
              className={`flex items-center gap-2 p-3 rounded-lg text-left cursor-pointer text-xs font-medium transition-all border ${mode === "gold_standard" ? "bg-primary/15 border-primary text-foreground" : "bg-white/5 border-transparent text-foreground-muted hover:bg-white/10"}`}
            >
              <MessageSquareQuote size={14} className="text-primary" />
              <span>Gold Standard</span>
            </button>
            <button
              onClick={() => handleRefine("comparative")}
              disabled={loading}
              className={`flex items-center gap-2 p-3 rounded-lg text-left cursor-pointer text-xs font-medium transition-all border ${mode === "comparative" ? "bg-primary/15 border-primary text-foreground" : "bg-white/5 border-transparent text-foreground-muted hover:bg-white/10"}`}
            >
              <Lightbulb size={14} className="text-accent" />
              <span>Comparative</span>
            </button>
            <button
              onClick={() => handleRefine("second_attempt")}
              disabled={loading}
              className={`flex items-center gap-2 p-3 rounded-lg text-left cursor-pointer text-xs font-medium transition-all border ${mode === "second_attempt" ? "bg-primary/15 border-primary text-foreground" : "bg-white/5 border-transparent text-foreground-muted hover:bg-white/10"}`}
            >
              <RefreshCw size={14} className="text-emerald-400" />
              <span>Evaluate 2nd</span>
            </button>
            <button
              onClick={() => handleRefine("study_roadmap")}
              disabled={loading}
              className={`flex items-center gap-2 p-3 rounded-lg text-left cursor-pointer text-xs font-medium transition-all border ${mode === "study_roadmap" ? "bg-primary/15 border-primary text-foreground" : "bg-white/5 border-transparent text-foreground-muted hover:bg-white/10"}`}
            >
              <BarChart3 size={14} className="text-red-400" />
              <span>Study Guide</span>
            </button>
            <button
              onClick={() => handleRefine("gap_fixer")}
              disabled={loading}
              className={`flex items-center gap-2 p-3 rounded-lg text-left cursor-pointer text-xs font-medium transition-all border ${mode === "gap_fixer" ? "bg-primary/15 border-primary text-foreground" : "bg-white/5 border-transparent text-foreground-muted hover:bg-white/10"}`}
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Gap Fixer</span>
            </button>
          </div>
        </div>

        {/* Feedback Area */}
        {(loading || feedback || error) && (
          <div
            className={`mt-6 p-5 rounded-xl border transition-all ${error ? "bg-danger/5 border-danger/20" : "bg-white/5 border-border"}`}
          >
            {loading ? (
              <div className="flex items-center gap-2 text-foreground-muted text-sm">
                <RefreshCw size={16} className="animate-spin" />
                Thinking...
              </div>
            ) : error ? (
              <p className="text-danger-hover text-sm">{error}</p>
            ) : (
              <div className="text-sm leading-relaxed text-foreground">
                <div className="font-bold mb-3 text-accent flex items-center gap-2">
                  <Sparkles size={16} />
                  {mode === 'study_roadmap' ? 'Your Study Roadmap' : mode === 'gap_fixer' ? 'Actionable Fixes' : 'Coach Feedback'}
                </div>
                <div 
                  className="tutor-feedback-content text-foreground-muted whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: feedback?.replace(/<br\s*\/?>/gi, '<br/>') || '' }} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
