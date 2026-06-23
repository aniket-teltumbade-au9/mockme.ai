"use client";
import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import axios from "axios";
import { API_BASE, authHeaders } from "@/utils/apiConfig";

interface RetryModalProps {
  sessionId: string;
  gaps: string[];
  onClose: () => void;
  onRetryStarted: (newSessionId: string, focusGaps: string[]) => void;
}

export const RetryModal: React.FC<RetryModalProps> = ({
  sessionId,
  gaps,
  onClose,
  onRetryStarted,
}) => {
  const [selectedGaps, setSelectedGaps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGap = (gap: string) => {
    const newSelected = new Set(selectedGaps);
    if (newSelected.has(gap)) {
      newSelected.delete(gap);
    } else {
      newSelected.add(gap);
    }
    setSelectedGaps(newSelected);
  };

  const selectAll = () => {
    setSelectedGaps(new Set(gaps));
  };

  const clearAll = () => {
    setSelectedGaps(new Set());
  };

  const handleRetry = async () => {
    if (selectedGaps.size === 0) {
      setError("Please select at least one gap to focus on");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("previous_session_id", sessionId);
      selectedGaps.forEach((gap) => formData.append("focus_gaps", gap));
      formData.append("voice_lang", "en-in");

      const res = await axios.post(`${API_BASE}/session/start-focused`, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      if (res.data.sessionId) {
        onRetryStarted(res.data.sessionId, Array.from(selectedGaps));
        onClose();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start focused interview";
      setError(message);
      console.error("Error starting focused interview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(2, 6, 23, 0.7)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "500px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            Retry Interview: Focus on Weaknesses
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--foreground-muted)",
              padding: "0.5rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <div
          style={{
            padding: "1rem",
            background: "rgba(99, 102, 241, 0.1)",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={20} style={{ color: "#6366f1", flexShrink: 0, marginTop: "0.125rem" }} />
          <p style={{ fontSize: "0.85rem", color: "var(--foreground)", margin: 0 }}>
            Select the areas where you struggled in the previous interview. The AI will focus its
            questions on these specific topics to help you improve.
          </p>
        </div>

        {/* Gap Selection */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Select Focus Areas ({selectedGaps.size} of {gaps.length})
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={selectAll}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.75rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {gaps.length > 0 ? (
              gaps.map((gap) => (
                <label
                  key={gap}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    background: selectedGaps.has(gap) ? "rgba(16, 185, 129, 0.1)" : "rgba(255,255,255,0.02)",
                    border: selectedGaps.has(gap)
                      ? "1px solid rgba(16, 185, 129, 0.3)"
                      : "1px solid var(--border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedGaps.has(gap)}
                    onChange={() => toggleGap(gap)}
                    style={{
                      accentColor: "#10b981",
                      cursor: "pointer",
                      width: "18px",
                      height: "18px",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: selectedGaps.has(gap) ? 600 : 400,
                      color: selectedGaps.has(gap) ? "#10b981" : "var(--foreground)",
                    }}
                  >
                    {gap}
                  </span>
                  {selectedGaps.has(gap) && (
                    <CheckCircle2
                      size={16}
                      style={{ color: "#10b981", marginLeft: "auto" }}
                    />
                  )}
                </label>
              ))
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--foreground-muted)",
                  fontSize: "0.9rem",
                }}
              >
                No gaps detected in previous interview
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "0.75rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onClose}
            className="secondary"
            style={{ flex: 1 }}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleRetry}
            style={{ flex: 1 }}
            disabled={isLoading || selectedGaps.size === 0}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Starting...
              </>
            ) : (
              `Start Focused Interview (${selectedGaps.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
