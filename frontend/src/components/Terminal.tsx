"use client";
import React, { useRef, useEffect } from "react";
import { Loader2, Play } from "lucide-react";

export interface TerminalLine {
  type: "input" | "stdout" | "stderr" | "system";
  text: string;
}

interface TerminalProps {
  lines: TerminalLine[];
  isRunning: boolean;
  onRun: () => void;
  language: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  isRunning,
  onRun,
  language,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever output changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const colorFor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "stderr":  return "#f87171"; // red-400
      case "stdout":  return "#e2e8f0"; // slate-200
      case "input":   return "#818cf8"; // indigo-400
      case "system":  return "#64748b"; // slate-500
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0d1117",
        borderRadius: "0 0 20px 20px",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          background: "#161b22",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* traffic-light dots */}
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "0.5rem" }}>
            Terminal — {language}
          </span>
        </div>
        <button
          onClick={onRun}
          disabled={isRunning}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.3rem 0.8rem",
            fontSize: "0.75rem",
            borderRadius: "6px",
            background: isRunning ? "#1e293b" : "#10b981",
            color: "white",
            border: "none",
            cursor: isRunning ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? (
            <><Loader2 size={12} className="animate-spin" /> Running…</>
          ) : (
            <><Play size={12} fill="white" /> Run</>
          )}
        </button>
      </div>

      {/* Output area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem 1rem",
          fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
          fontSize: "0.8rem",
          lineHeight: 1.6,
        }}
      >
        {lines.length === 0 && (
          <span style={{ color: "#64748b" }}>
            Press <kbd style={{ background: "#1e293b", padding: "1px 5px", borderRadius: 3 }}>Run</kbd> to execute your code.
          </span>
        )}
        {lines.map((line, i) => (
          <div key={i} style={{ color: colorFor(line.type), whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {line.type === "input" && <span style={{ color: "#475569" }}>$ </span>}
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
