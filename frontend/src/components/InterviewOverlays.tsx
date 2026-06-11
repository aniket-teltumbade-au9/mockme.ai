"use client";
import React, { useState } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";

// ── Live Transcript ──────────────────────────────────────────────────────────
interface LiveTranscriptProps {
  text: string | null;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({ text }) => {
  if (!text) return null;
  return (
    <div style={{
      position: "absolute",
      bottom: "1rem",
      left: "50%",
      transform: "translateX(-50%)",
      width: "90%",
      maxWidth: "600px",
      background: "rgba(2,6,23,0.85)",
      border: "1px solid rgba(103,232,249,0.2)",
      borderRadius: "12px",
      padding: "0.75rem 1rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.6rem",
      zIndex: 20,
      backdropFilter: "blur(8px)",
    }}>
      <MessageSquare size={14} style={{ color: "#67e8f9", marginTop: "2px", flexShrink: 0 }} />
      <p style={{ fontSize: "0.82rem", color: "#a5f3fc", lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
    </div>
  );
};

// ── Voice / Accent Selector ──────────────────────────────────────────────────

export interface TTSVoice {
  name: string;
  lang_code: string;
  flag: string;
  accent?: string;
}

interface VoiceSelectorProps {
  voices: TTSVoice[];
  selectedVoice: TTSVoice;
  onSelect: (voice: TTSVoice) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoice, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        className="secondary"
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", padding: "4px 10px" }}
      >
        <span>{selectedVoice.flag}</span>
        <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedVoice.name}
        </span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px", width: "200px",
          zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          {voices.map((v) => (
            <button
              key={v.lang_code}
              onClick={() => { onSelect(v); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                width: "100%", textAlign: "left",
                background: selectedVoice.lang_code === v.lang_code ? "rgba(99,102,241,0.15)" : "transparent",
                border: "none", padding: "0.55rem 0.75rem", fontSize: "0.8rem",
                color: "#cbd5e1", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{v.flag}</span>
              <span style={{ fontWeight: selectedVoice.lang_code === v.lang_code ? 600 : 400 }}>{v.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
