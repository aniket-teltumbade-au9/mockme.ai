/**
 * AddMarkerModal Component
 * 
 * Modal dialog for adding a new timestamp marker with optional note.
 * Implements sub-task 3.3.2 (Create marker with current video time and optional note)
 */

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface AddMarkerModalProps {
  isOpen: boolean;
  timestamp: number;
  onClose: () => void;
  onAdd: (note?: string) => void;
}

/**
 * Format seconds to MM:SS format
 */
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * AddMarkerModal Component
 * 
 * Modal dialog for creating timestamp markers with:
 * - Display of current video timestamp
 * - Text input for optional note
 * - Add/Cancel buttons
 * - Keyboard support (Enter to add, Escape to cancel)
 * 
 * @component
 * @example
 * ```tsx
 * <AddMarkerModal
 *   isOpen={true}
 *   timestamp={45.5}
 *   onClose={() => console.log('Modal closed')}
 *   onAdd={(note) => console.log('Added marker with note:', note)}
 * />
 * ```
 */
export const AddMarkerModal: React.FC<AddMarkerModalProps> = ({
  isOpen,
  timestamp,
  onClose,
  onAdd,
}) => {
  const [note, setNote] = React.useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleAdd = () => {
    onAdd(note.trim() || undefined);
    setNote("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
        }}
        onClick={onClose}
        role="presentation"
      >
        {/* Modal */}
        <div
          style={{
            background: "var(--background)",
            borderRadius: "12px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            padding: "1.5rem",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
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
            }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              Add Timestamp Marker
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                color: "#a5b4fc",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Timestamp Display */}
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "rgba(99, 102, 241, 0.05)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "#818cf8",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              Current Timestamp
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#6366f1",
                fontFamily: "monospace",
              }}
            >
              {formatTime(timestamp)}
            </div>
          </div>

          {/* Note Input */}
          <div
            style={{
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label
              htmlFor="marker-note"
              style={{
                fontSize: "0.85rem",
                color: "#818cf8",
                fontWeight: 500,
              }}
            >
              Note (Optional)
            </label>
            <input
              ref={inputRef}
              id="marker-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Stuttered here, needs practice"
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                color: "var(--foreground)",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: "#6366f1",
                border: "1px solid #6366f1",
                color: "white",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#818cf8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
              }}
            >
              Add Marker
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
