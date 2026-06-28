"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Terminal, User, Loader2, CheckCircle2, Send } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { useInterviewRecorder } from "@/hooks/useInterviewRecorder";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { LiveTranscript, VoiceSelector, TTSVoice } from "@/components/InterviewOverlays";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";
import { UiConfig } from "@/types/interview";

export default function InterviewSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { isInitialized, accessToken } = useAuth();
  
  const [uiConfig, setUiConfig] = useState<UiConfig | null>(null);
  const uiConfigRef = useRef<UiConfig | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [lastSarahText, setLastSarahText] = useState<string | null>(null);
  
  const [voiceList, setVoiceList] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>({ name: "English (US)", lang_code: "en", flag: "\u{1f1fa}\u{1f1f8}" });
  
  const [codeSyncState, setCodeSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  const latestCodeRef = useRef<string>("");

  const turnRecorderRef = useRef<MediaRecorder | null>(null);
  const turnChunksRef = useRef<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const { stopRecording: stopFullSessionRecording } = useInterviewRecorder();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setUiConfigSynced = (config: UiConfig | null) => {
    uiConfigRef.current = config;
    setUiConfig(config);
  };

  // --- Fetch Session Data ---
  useEffect(() => {
    if (!sessionId || !accessToken) return;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/session/${sessionId}`, { headers: authHeaders() });
        setUiConfigSynced(res.data.uiConfig);
      } catch (err) {
        console.error("Failed to fetch session", err);
        setErrorMsg("Failed to load interview session.");
      }
    })();
  }, [sessionId, accessToken]);

  // --- Audio/Recording Logic ---
  const playAudio = async (text: string) => {
    setLastSarahText(text || null);
    if (!text) {
      setIsSpeaking(false);
      startRecording();
      return;
    }

    setIsSpeaking(true);
    fallbackSpeechSynthesis(text);
  };

  const fallbackSpeechSynthesis = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          (v.name.includes("Google") || v.name.includes("Aria") || v.name.includes("Samantha")) &&
          v.lang.startsWith("en"),
      ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (uiConfigRef.current?.currentState !== "STATE_3") startRecording();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      turnChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) turnChunksRef.current.push(e.data);
      };
      mr.start();
      turnRecorderRef.current = mr;
      setAudioStream(stream);
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting turn recording", err);
    }
  };

  const stopRecording = () => {
    const mr = turnRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(turnChunksRef.current, { type: "audio/webm" });
      mr.stream.getTracks().forEach((t) => t.stop());
      turnRecorderRef.current = null;
      setAudioStream(null);
      sendAudioResponse(blob);
    };
    mr.stop();
    setIsRecording(false);
  };

  const sendAudioResponse = async (blob: Blob) => {
    if (!sessionId) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("sessionId", sessionId as string);
    formData.append("file", blob, "recording.webm");
    try {
      const res = await axios.post(`${API_BASE}/interview/respond-audio`, formData, { headers: authHeaders() });
      setUiConfigSynced(res.data.uiConfig);
      playAudio(res.data.uiConfig?.voice_script || "I understand.");

      if (res.data.uiConfig?.currentState === "STATE_3") {
        setIsLoading(false);
        setIsSpeaking(false);
        setIsFinalizing(true);
        try { await stopFullSessionRecording(); } catch {}
        setIsFinalizing(false);
        return;
      }
    } catch (err) {
      console.error("Error sending audio", err);
      setIsSpeaking(false);
      setErrorMsg("Failed to process audio response.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Code Logic ---
  const onCodeChange = (value?: string) => {
    if (!value) return;
    latestCodeRef.current = value;
    setCodeSyncState("idle");
  };

  const syncCode = async (code: string) => {
    if (!sessionId) return;
    setCodeSyncState("syncing");
    try {
      const res = await axios.post(`${API_BASE}/interview/respond-code`, {
        sessionId: sessionId as string,
        code,
      }, {
        headers: authHeaders(),
      });
      setUiConfigSynced(res.data.uiConfig);
      const voiceScript = res.data.uiConfig?.voice_script;
      if (voiceScript) {
        playAudio(voiceScript);
      }
      setCodeSyncState("synced");
    } catch (err) {
      console.error("Failed to sync code", err);
      setCodeSyncState("idle");
      setErrorMsg("Failed to save code. Please try again.");
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const submitCode = () => {
    syncCode(latestCodeRef.current);
  };

  // --- Rendering ---
  if (!isInitialized) return <div>Loading...</div>;

  const isSplit = uiConfig?.showCodeWorkspace;

  return (
    <div className="container">
      {errorMsg && (
        <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl">
          {errorMsg}
        </div>
      )}
      {isFinalizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="animate-spin" size={48} />
            <p className="text-xl font-semibold">Finalizing interview...</p>
          </div>
        </div>
      )}
      <header className="header">
        <div className="flex items-center gap-0.5 font-bold tracking-tight">
          <span className="text-slate-100 text-lg">mockme</span>
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs">.ai</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar-outer">
            <div
              className="progress-bar-inner"
              style={{ width: `${uiConfig?.progress || 0}%` }}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <VoiceSelector voices={voiceList} selectedVoice={selectedVoice} onSelect={setSelectedVoice} />
          <div
            className="state-badge"
            style={{
              background: "var(--secondary)",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "0.7rem",
            }}
          >
            {uiConfig?.currentState}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div
          className={isSplit ? "layout-split" : "layout-conversational"}
          style={isSplit ? { flex: 1, minHeight: 0 } : undefined}
        >
          {/* Left / conversational panel */}
          <div
            className={isSplit ? "left-panel glass-panel" : "glass-panel"}
            style={{
              ...(!isSplit ? { width: "100%", maxWidth: "800px" } : {}),
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 2rem",
              transition: "var(--transition-smooth)",
            }}
          >
            <div className="interviewer-container" style={{ position: 'relative' }}>
              <div className={`avatar-pulse ${isSpeaking ? "speaking" : ""}`} />
              <div
                className="avatar-core"
                style={{
                  boxShadow: isSpeaking
                    ? "0 0 60px var(--primary-glow)"
                    : "0 0 40px rgba(0,0,0,0.3)",
                }}
              >
                <User size={54} />
              </div>
              <VoiceVisualizer 
                isActive={isSpeaking || isRecording} 
                audioSource={isSpeaking ? undefined : audioStream || undefined} 
              />
            </div>

            <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", color: "var(--foreground)" }}>
                Sarah
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: isSpeaking ? "var(--primary)" : "var(--accent)",
                  }}
                />
                <p
                  style={{
                    color: "var(--foreground-muted)",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  {isSpeaking ? "Speaking..." : "Listening..."}
                </p>
              </div>
            </div>

            <div className="controls">
              {uiConfig?.currentState === "STATE_3" ? (
                <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
                  {isFinalizing ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                      <p style={{ fontWeight: 600, color: "var(--foreground-muted)" }}>
                        Finalizing Analysis...
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--accent-glow)",
                          padding: "1rem",
                          borderRadius: "50%",
                        }}
                      >
                        <CheckCircle2 size={48} color="var(--accent)" />
                      </div>
                      <h3 style={{ fontSize: "1.25rem" }}>Interview Complete</h3>
                      <button
                        onClick={() => router.push("/")}
                        style={{ minWidth: "200px" }}
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  )}
                </div>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="mic-btn listening"
                  title="Stop Recording"
                >
                  <MicOff size={32} />
                </button>
              ) : (
                <button
                  disabled={isSpeaking || isLoading}
                  onClick={startRecording}
                  className="mic-btn"
                  title="Start Recording"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Mic size={32} />}
                </button>
              )}
            </div>

            {/* Live transcript of last Sarah utterance */}
            <div style={{ width: "100%", maxWidth: "600px", marginTop: "2rem" }}>
              <LiveTranscript text={isSpeaking ? lastSarahText : null} />
            </div>
          </div>

          {/* Right panel — code workspace */}
          {isSplit && (
            <div
              className="right-panel"
              style={{ animation: "fadeInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              <div className="workspace-panel">
                <div
                  className="workspace-panel-header"
                  style={{ justifyContent: "space-between", height: "56px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        background: "rgba(99, 102, 241, 0.1)",
                        padding: "0.4rem",
                        borderRadius: "8px",
                      }}
                    >
                      <Terminal size={18} color="var(--primary)" />
                    </div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        color: "var(--foreground)",
                      }}
                    >
                      TECHNICAL WORKSPACE
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {codeSyncState === "syncing" && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--foreground-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "rgba(255,255,255,0.03)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                        }}
                      >
                        <Loader2 size={12} className="animate-spin" />
                        <span>Syncing…</span>
                      </div>
                    )}
                    {codeSyncState === "synced" && (
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "rgba(16, 185, 129, 0.05)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>Changes Saved</span>
                      </div>
                    )}
                    <button
                      onClick={submitCode}
                      disabled={codeSyncState === "syncing"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        padding: "6px 14px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--primary)",
                        height: "32px",
                      }}
                    >
                      <Send size={12} /> Submit
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <CodeEditor
                    code={uiConfig?.editorConfig?.codeContent || ""}
                    language={uiConfig?.editorConfig?.language || "javascript"}
                    onChange={onCodeChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
