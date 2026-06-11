"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import axios from "axios";
import { API_BASE, authHeaders } from "@/utils/apiConfig";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  sessionId: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await axios.post(
        `${API_BASE}/interview/chat`,
        { sessionId, message: text },
        { headers: authHeaders() }
      );
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "(Failed to send)" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0.5rem" }}>
      <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Chat
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem" }}>
        {messages.length === 0 && (
          <div style={{ color: "var(--foreground-muted)", fontSize: "0.8rem", fontStyle: "italic" }}>
            Send a message to Sarah...
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
              padding: "0.4rem 0.7rem",
              borderRadius: "10px",
              maxWidth: "85%",
              fontSize: "0.8rem",
              color: "var(--foreground)",
              border: m.role === "user" ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          disabled={!sessionId || sending}
          style={{
            flex: 1,
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.4rem 0.7rem",
            color: "white",
            fontSize: "0.8rem",
          }}
        />
        <button onClick={sendMessage} disabled={!sessionId || sending || !input.trim()} style={{ padding: "0.4rem 0.7rem", borderRadius: "8px" }}>
          {sending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
};
