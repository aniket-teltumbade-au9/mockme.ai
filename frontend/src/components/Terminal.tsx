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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const getColorClass = (type: TerminalLine["type"]) => {
    switch (type) {
      case "stderr": return "text-red-400";
      case "stdout": return "text-slate-200";
      case "input": return "text-indigo-400";
      case "system": return "text-slate-500";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-b-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 flex-shrink-0 bg-[#161b22] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="text-[0.7rem] text-slate-500 ml-2">
            Terminal — {language}
          </span>
        </div>
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors min-h-[32px] ${
            isRunning 
              ? "bg-slate-800 text-white cursor-not-allowed" 
              : "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600"
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Running…
            </>
          ) : (
            <>
              <Play size={12} fill="white" /> Run
            </>
          )}
        </button>
      </div>

      {/* Output area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 font-mono text-[0.75rem] leading-relaxed min-w-0">
        {lines.length === 0 && (
          <span className="text-slate-500">
            Press <kbd className="bg-slate-800 px-1 rounded">Run</kbd> to execute your code.
          </span>
        )}
        {lines.map((line, i) => (
          <div 
            key={i} 
            className={`${getColorClass(line.type)} whitespace-pre-wrap break-all overflow-wrap-anywhere`}
          >
            {line.type === "input" && <span className="text-slate-600">$ </span>}
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
