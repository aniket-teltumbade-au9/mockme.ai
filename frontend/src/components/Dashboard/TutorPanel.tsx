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
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 101,
        width: "100%",
        maxWidth: "420px",
        background: "var(--background-alt)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        animation: "slideInRight 0.3s ease-out",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={18} color="var(--accent)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>AI Tutor</h2>
        </div>
        <button onClick={onClose} className="secondary" style={{ padding: "0.4rem" }}>
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase" }}>
            The Question
          </p>
          <p style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "var(--foreground)" }}>{question}</p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase" }}>
            Your Answer
          </p>
          <p style={{ fontSize: "0.9rem", lineHeight: "1.5", color: "var(--foreground-muted)", fontStyle: "italic" }}>
            {"\""}{userAnswer}{"\""}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", marginBottom: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>
            Learning Mode
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              onClick={() => handleRefine("gold_standard")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: mode === "gold_standard" ? "rgba(129, 140, 248, 0.15)" : "rgba(255,255,255,0.03)",
                border: mode === "gold_standard" ? "1px solid var(--primary)" : "1px solid transparent",
                color: "var(--foreground)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500
              }}
            >
              <MessageSquareQuote size={14} color="var(--primary)" />
              <span>Gold Standard</span>
            </button>
            <button
              onClick={() => handleRefine("comparative")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: mode === "comparative" ? "rgba(129, 140, 248, 0.15)" : "rgba(255,255,255,0.03)",
                border: mode === "comparative" ? "1px solid var(--primary)" : "1px solid transparent",
                color: "var(--foreground)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500
              }}
            >
              <Lightbulb size={14} color="var(--accent)" />
              <span>Comparative</span>
            </button>
            <button
              onClick={() => handleRefine("second_attempt")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: mode === "second_attempt" ? "rgba(129, 140, 248, 0.15)" : "rgba(255,255,255,0.03)",
                border: mode === "second_attempt" ? "1px solid var(--primary)" : "1px solid transparent",
                color: "var(--foreground)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500
              }}
            >
              <RefreshCw size={14} color="#86efac" />
              <span>Evaluate 2nd</span>
            </button>
            <button
              onClick={() => handleRefine("study_roadmap")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: mode === "study_roadmap" ? "rgba(129, 140, 248, 0.15)" : "rgba(255,255,255,0.03)",
                border: mode === "study_roadmap" ? "1px solid var(--primary)" : "1px solid transparent",
                color: "var(--foreground)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500
              }}
            >
              <BarChart3 size={14} color="#fca5a5" />
              <span>Study Guide</span>
            </button>
            <button
              onClick={() => handleRefine("gap_fixer")}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "8px",
                background: mode === "gap_fixer" ? "rgba(129, 140, 248, 0.15)" : "rgba(255,255,255,0.03)",
                border: mode === "gap_fixer" ? "1px solid var(--primary)" : "1px solid transparent",
                color: "var(--foreground)",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500
              }}
            >
              <ShieldCheck size={14} color="#86efac" />
              <span>Gap Fixer</span>
            </button>
          </div>
        </div>

        {/* Feedback Area */}
        {(loading || feedback || error) && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem",
              borderRadius: "var(--radius-md)",
              background: error ? "rgba(239, 68, 68, 0.05)" : "rgba(255, 255, 255, 0.03)",
              border: error ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--foreground-muted)" }}>
                <RefreshCw size={16} className="animate-spin" />
                Thinking...
              </div>
            ) : error ? (
              <p style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{error}</p>
            ) : (
              <div style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "var(--foreground)" }}>
                <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={16} />
                  {mode === 'study_roadmap' ? 'Your Study Roadmap' : mode === 'gap_fixer' ? 'Actionable Fixes' : 'Coach Feedback'}
                </div>
                <div 
                  className="tutor-feedback-content"
                  style={{ 
                    color: "var(--foreground-muted)",
                    whiteSpace: "pre-wrap" 
                  }}
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
