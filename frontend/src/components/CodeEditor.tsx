"use client";
import React, { useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Terminal, TerminalLine } from "./Terminal";

import { API_BASE, authHeaders } from "@/utils/apiConfig";

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
}) => {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "system", text: "Ready. Write your solution and press Run." },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // Track current code in a ref so the Run button always has the latest value
  const codeRef = useRef(code);
  const handleChange = (value: string | undefined) => {
    codeRef.current = value ?? "";
    onChange(value);
  };

  const runCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalLines([{ type: "input", text: `Running ${language} solution…` }]);

    try {
      const res = await axios.post(`${API_BASE}/code/run`, {
        code: codeRef.current,
        language,
      }, {
        headers: authHeaders(),
      });

      const next: TerminalLine[] = [];

      if (res.data.stdout) {
        next.push({ type: "stdout", text: res.data.stdout });
      }
      if (res.data.stderr) {
        next.push({ type: "stderr", text: res.data.stderr });
      }
      if (!res.data.stdout && !res.data.stderr) {
        next.push({ type: "system", text: "(no output)" });
      }

      const exitCode: number = res.data.exit_code ?? 0;
      next.push({
        type: exitCode === 0 ? "system" : "stderr",
        text: `Process exited with code ${exitCode}`,
      });

      setTerminalLines(next);
    } catch (err) {
      setTerminalLines([
        { type: "stderr", text: "Failed to reach code runner. Is the backend running?" },
      ]);
      console.error("Code run error", err);
    } finally {
      setIsRunning(false);
    }
  }, [language, isRunning]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Editor — takes 60% of available height */}
      <div className="flex-[0_0_60%] min-h-0 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            padding: { top: 12 },
          }}
        />
      </div>

      {/* Divider */}
      <div className="h-1 bg-white/5 flex-shrink-0 cursor-ns-resize" />

      {/* Terminal — takes remaining 40% */}
      <div className="flex-[0_0_40%] min-h-0 overflow-hidden">
        <Terminal
          lines={terminalLines}
          isRunning={isRunning}
          onRun={runCode}
          language={language}
        />
      </div>
    </div>
  );
};
