"use client";
import React, { useState } from "react";
import { X, Sparkles, MessageSquareQuote, Lightbulb, RefreshCw } from "lucide-react";
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
  tutorMode: "gold_standard" | "comparative" | "second_attempt";
}

export const TutorPanel: React.FC<TutorPanelProps> = ({ question, userAnswer, onClose }) => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mode, setMode] = useState<"gold_standard" | "comparative" | "second_attempt">("gold_standard");
  const [error, setError] = useState<string | null>(null);

  const handleRefine = async (selectedMode: "gold_standard" | "comparative" | "second_attempt") => {
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
        } as Record<string, string>, // <-- Tells TS exactly what to expect
        body: JSON.stringify({
          sessionId: (window as { currentSessionId?: string }).currentSessionId || "", // We'll need a way to pass sessionId down
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
        maxWidth: "400px",
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
            Choose a Mode
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
              }}
            >
              <MessageSquareQuote size={16} color="var(--primary)" />
              <span>Get Gold Standard</span>
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
              }}
            >
              <Lightbulb size={16} color="var(--accent)" />
              <span>Comparative Analysis</span>
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
              }}
            >
              <RefreshCw size={16} color="#86efac" />
              <span>Evaluate 2nd Attempt</span>
            </button>
          </div>
        </div>

        {/* Feedback Area */}
        {(loading || feedback || error) && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
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
                <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--accent)" }}>Coach Feedback:</div>
                <div dangerouslySetInnerHTML={{ __html: feedback?.replace(/<br\s*\/?>/gi, '<br/>') || '' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
