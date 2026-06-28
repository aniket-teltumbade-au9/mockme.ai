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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-slate-950/85 border border-cyan-500/20 rounded-xl p-3 flex items-start gap-2 z-20 backdrop-blur-md">
      <MessageSquare size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-cyan-100 leading-relaxed m-0 flex-1 min-w-0">
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
    <div className="relative">
      <button
        className="secondary flex items-center gap-1 text-xs px-2.5 py-1 min-h-[36px]"
        onClick={() => setOpen(o => !o)}
        aria-label="Select voice"
      >
        <span>{selectedVoice.flag}</span>
        <span className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
          {selectedVoice.name}
        </span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] right-0 bg-slate-800 border border-white/10 rounded-lg w-[200px] z-50 shadow-xl overflow-hidden">
          {voices.map((v) => (
            <button
              key={v.lang_code}
              onClick={() => { onSelect(v); setOpen(false); }}
              className={`flex items-center gap-2 w-full text-left p-2 text-sm text-slate-300 cursor-pointer min-h-[36px] ${
                selectedVoice.lang_code === v.lang_code ? "bg-indigo-500/15 text-foreground font-semibold" : ""
              }`}
            >
              <span className="text-base">{v.flag}</span>
              <span className="font-medium truncate">
                {v.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
