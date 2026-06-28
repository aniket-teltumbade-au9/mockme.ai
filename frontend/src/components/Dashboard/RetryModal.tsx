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
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-[500px] w-full max-h-[80vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold">Retry Interview: Focus on Weaknesses</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md bg-secondary hover:bg-secondary-hover text-foreground-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4 bg-indigo-500/10 rounded-lg mb-6 border border-indigo-500/20 flex gap-3 items-start">
          <AlertCircle size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Select the areas where you struggled in the previous interview. The AI will focus its
            questions on these specific topics to help you improve.
          </p>
        </div>

        {/* Gap Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold">
              Select Focus Areas ({selectedGaps.size} of {gaps.length})
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1 bg-white/5 border border-border rounded cursor-pointer text-foreground-muted hover:text-foreground"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="text-xs px-3 py-1 bg-white/5 border border-border rounded cursor-pointer text-foreground-muted hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {gaps.length > 0 ? (
              gaps.map((gap) => (
                <label
                  key={gap}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedGaps.has(gap)
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold"
                      : "bg-white/2 border-transparent text-foreground hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedGaps.has(gap)}
                    onChange={() => toggleGap(gap)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm">{gap}</span>
                  {selectedGaps.has(gap) && (
                    <CheckCircle2 size={16} className="ml-auto text-emerald-400" />
                  )}
                </label>
              ))
            ) : (
              <div className="p-8 text-center text-foreground-muted text-sm">
                No gaps detected in previous interview
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleRetry}
            className="flex-1 bg-primary text-white font-bold rounded-lg disabled:opacity-50"
            disabled={isLoading || selectedGaps.size === 0}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Starting...
              </div>
            ) : (
              `Start Focused Interview (${selectedGaps.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
