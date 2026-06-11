"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Mic,
  MicOff,
  Terminal,
  User,
  Loader2,
  BarChart3,
  History,
  CheckCircle2,
  Send,
  Video,
  VideoOff,
} from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { InterviewHistoryCard } from "@/components/Dashboard/InterviewHistoryCard";
import { AudioPlayerModal } from "@/components/Dashboard/AudioPlayerModal";
import { AnalysisDrawer } from "@/components/Dashboard/AnalysisDrawer";
import { PreflightWizard } from "@/components/PreflightWizard";
import { LiveTranscript, VoiceSelector, TTSVoice } from "@/components/InterviewOverlays";
import { Whiteboard } from "@/components/Whiteboard";
import { ChatPanel } from "@/components/ChatPanel";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";

interface EditorConfig {
  language: string;
  codeContent: string;
}

interface UiConfig {
  currentState: string;
  showCodeWorkspace: boolean;
  progress: number;
  hints: string[];
  detectedGaps: string[];
  editorConfig: EditorConfig;
  voice_script?: string;
}

const PERSONAS = [
  { id: "", label: "Default (Based on JD)" },
  { id: "Friendly", label: "Friendly" },
  { id: "Calm", label: "Calm" },
  { id: "Strict", label: "Strict" },
  { id: "Technical", label: "Technical" },
  { id: "Behavioral", label: "Behavioral" },
  { id: "Challenging", label: "Challenging" },
  { id: "Experienced Peer", label: "Experienced Peer" },
];

interface UserProgress {
  total_interviews: number;
  skill_gaps: string[];
}

interface InterviewRecord {
  sessionId: string;
  created_at: string;
  analysis?: { hire_verdict?: string };
  dropbox_video_url?: string;
  finalized?: boolean;
  finalization_error?: string;
}

export default function InterviewPage() {
  // FIX 1: destructure sessionExpired and logout from useAuth
  const { userId, accessToken, isInitialized, sessionExpired, logout } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uiConfig, setUiConfig] = useState<UiConfig | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const uiConfigRef = useRef<UiConfig | null>(null);

  const setSessionIdSynced = (id: string | null) => {
    sessionIdRef.current = id;
    setSessionId(id);
  };
  const setUiConfigSynced = (config: UiConfig | null) => {
    uiConfigRef.current = config;
    setUiConfig(config);
  };

  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Pre-flight wizard
  const [showPreflight, setShowPreflight] = useState(false);
  const [pendingJd, setPendingJd] = useState<string | null>(null);

  // Live transcript (last thing Sarah said)
  const [lastSarahText, setLastSarahText] = useState<string | null>(null);

  // Voice selection — controls backend TTS accent
  const [voiceList, setVoiceList] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>({ name: "English (US)", lang_code: "en", flag: "\u{1f1fa}\u{1f1f8}" });

  // Code submission state
  const [codeSyncState, setCodeSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  const latestCodeRef = useRef<string>("");

  // Per-turn webcam+mic MediaRecorder
  const turnRecorderRef = useRef<MediaRecorder | null>(null);
  const turnChunksRef = useRef<Blob[]>([]);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [jd, setJd] = useState("");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showJDScreen, setShowJDScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewRecord[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRecord | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/user/progress`, { headers: authHeaders() });
      setUserProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch progress", err);
    }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}/interviews/history`, { headers: authHeaders() });
      setInterviewHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, [userId]);

  const fetchVoices = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/voices`);
      if (res.data?.length > 0) {
        setVoiceList(res.data);
        setSelectedVoice(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch voices", err);
    }
  }, []);

  const handleRetryFinalize = async (interview: InterviewRecord) => {
    try {
      await axios.post(`${API_BASE}/interviews/${interview.sessionId}/refinalize`, {}, { headers: authHeaders() });
      await fetchHistory();
      alert("Re-processing started. Please check back in a moment.");
    } catch (err) {
      console.error("Retry failed", err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(detail || "Failed to restart processing.");
    }
  };

  // Called when user clicks "Begin Interview" — show preflight wizard
  const requestStartInterview = () => {
    if (!jd.trim()) {
      alert("Please provide a Job Description to begin.");
      return;
    }
    setPendingJd(jd);
    setShowPreflight(true);
  };

  // Called when preflight wizard gives the all-clear
  const handlePreflightComplete = async () => {
    setShowPreflight(false);
    if (!pendingJd) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post(`${API_BASE}/session/start`, {
        jd: pendingJd,
        persona: selectedPersona.id || undefined,
        voice_lang: selectedVoice.lang_code,
      }, { headers: authHeaders() });
      if (res.data.error) {
        setErrorMsg(res.data.message);
        setIsLoading(false);
        return;
      }
      setSessionIdSynced(res.data.sessionId);
      setUiConfigSynced(res.data.uiConfig);

      playAudio(res.data.uiConfig?.voice_script || "Hello, I'm Sarah. Let's start.");
    } catch (err) {
      console.error("Failed to start interview", err);
      setErrorMsg("Connection error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

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

  /** Uses browser SpeechSynthesis for TTS */
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      webcamStreamRef.current = stream;
      // Show webcam preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      turnChunksRef.current = [];
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) turnChunksRef.current.push(e.data);
      };
      mr.start();
      turnRecorderRef.current = mr;
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting webcam recording", err);
      alert("Webcam access required. Please allow camera and microphone.");
    }
  };

  const stopRecording = () => {
    const mr = turnRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(turnChunksRef.current, { type: mr.mimeType || "video/webm" });
      // Release all tracks
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
      turnRecorderRef.current = null;
      sendVideoResponse(blob);
    };
    mr.stop();
    setIsRecording(false);
  };

  const sendVideoResponse = async (blob: Blob) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("sessionId", currentSessionId);
    formData.append("file", blob, "recording.webm");
    try {
      const res = await axios.post(`${API_BASE}/interview/respond-video`, formData, { headers: authHeaders() });
      setUiConfigSynced(res.data.uiConfig);
      playAudio(res.data.uiConfig?.voice_script || "I understand.");

      if (res.data.uiConfig?.currentState === "STATE_3") {
        setIsLoading(false);
        setIsSpeaking(false);
        setIsFinalizing(true);
        await fetchHistory();
        await fetchProgress();
        setIsFinalizing(false);
        setSessionIdSynced(null);
        return;
      }
    } catch (err) {
      console.error("Error sending video", err);
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const codeChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCodeChange = (value?: string) => {
    if (!value || !sessionIdRef.current) return;
    latestCodeRef.current = value;
    setCodeSyncState("idle");
    if (codeChangeTimer.current) clearTimeout(codeChangeTimer.current);
    codeChangeTimer.current = setTimeout(() => syncCode(value), 2000);
  };

  const syncCode = async (code: string) => {
    if (!sessionIdRef.current) return;
    setCodeSyncState("syncing");
    try {
      const res = await axios.post(`${API_BASE}/interview/respond-code`, {
        sessionId: sessionIdRef.current,
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
    }
  };

  const submitCode = () => {
    if (codeChangeTimer.current) clearTimeout(codeChangeTimer.current);
    syncCode(latestCodeRef.current);
  };

  useEffect(() => {
    fetchVoices();
    if (!isInitialized || !userId || !accessToken) return;
    (async () => {
      await fetchProgress();
      await fetchHistory();
    })();
  }, [fetchProgress, fetchHistory, fetchVoices, accessToken, isInitialized, userId]);

  if (!isInitialized) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "white",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!userId || !accessToken) {
    return <LoginScreen />;
  }

  // ─── Dashboard (no active session) ───────────────────────────────────────────
  if (!sessionId) {
    return (
      // FIX 2: single outer container — no double-nested "container" divs
      <div className="container">

        {/* FIX 1: sessionExpired and logout now correctly sourced from useAuth */}
        {sessionExpired && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(2, 6, 23, 0.9)",
              backdropFilter: "blur(12px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="glass-panel" style={{ maxWidth: "400px", textAlign: "center" }}>
              <h2 style={{ marginBottom: "1rem" }}>Session Expired</h2>
              <p style={{ color: "var(--foreground-muted)", marginBottom: "2rem" }}>
                Your authentication token has expired. Please re-authenticate to continue.
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="secondary" style={{ flex: 1 }} onClick={logout}>
                  Logout
                </button>
                {/* <button
                  style={{ flex: 1 }}
                  onClick={() => {
                    window.location.href = "/";
                  }}
                >
                  Resume
                </button> */}
              </div>
            </div>
          </div>
        )}

        {/* FIX 2: layout-conversational is NOT a second "container" */}
        <div className="layout-conversational" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!showJDScreen ? (
            <div
              className="glass-panel text-center"
              style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "2rem",
                }}
              >
                <h1
                  style={{
                    fontSize: "2rem",
                    background: "linear-gradient(to right, #818cf8, #c084fc)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 800,
                  }}
                >
                  MockMe.AI
                </h1>
              </div>

              {errorMsg && (
                <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{errorMsg}</div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                  textAlign: "left",
                  marginBottom: "3rem",
                }}
              >
                <div
                  className="glass-panel"
                  style={{ padding: "2rem", background: "rgba(255,255,255,0.02)" }}
                >
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      marginBottom: "1.25rem",
                      color: "var(--foreground-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <BarChart3 size={18} color="var(--primary)" /> Performance
                  </h2>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                    <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--foreground)" }}>
                      {userProgress?.total_interviews || 0}
                    </span>
                    <span style={{ color: "var(--foreground-muted)", fontWeight: 500 }}>
                      Sessions
                    </span>
                  </div>
                </div>

                <div
                  className="glass-panel"
                  style={{ padding: "2rem", background: "rgba(255,255,255,0.02)" }}
                >
                  <h2
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      marginBottom: "1.25rem",
                      color: "var(--foreground-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <History size={18} color="var(--accent)" /> Recent Gaps
                  </h2>
                  <div style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>
                    {(userProgress?.skill_gaps?.length ?? 0) > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {userProgress!.skill_gaps.slice(0, 3).map((g, i) => (
                          <span
                            key={i}
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#fca5a5",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              border: "1px solid rgba(239,68,68,0.1)",
                              fontWeight: 500,
                            }}
                          >
                            {g}
                          </span>
                        ))}
                        {userProgress!.skill_gaps.length > 3 && (
                          <span style={{ padding: "4px 10px", color: "var(--foreground-muted)" }}>
                            +{userProgress!.skill_gaps.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontStyle: "italic", opacity: 0.7 }}>
                        No gaps detected yet. Start an interview!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "left", marginBottom: "3rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Interview History</h3>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--foreground-muted)",
                      fontWeight: 500,
                    }}
                  >
                    {interviewHistory.length} Recorded Sessions
                  </div>
                </div>
                <div
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    paddingRight: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {interviewHistory.length > 0 ? (
                    interviewHistory.map((inv) => (
                      <InterviewHistoryCard
                        key={inv.sessionId}
                        interview={inv}
                        onPlayAudio={(i) => {
                          setSelectedInterview(i);
                          setShowVideoPlayer(true);
                        }}
                        onViewAnalysis={(i) => {
                          setSelectedInterview(i);
                          setShowAnalysis(true);
                        }}
                        onRetryFinalize={handleRetryFinalize}
                      />
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px dashed var(--border)",
                        color: "var(--foreground-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      No previous sessions found.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowJDScreen(true)}
                className="mic-btn"
                style={{
                  margin: "0 auto",
                  width: "280px",
                  borderRadius: "var(--radius-lg)",
                  height: "64px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  boxShadow: "0 20px 40px -10px var(--primary-glow)",
                }}
              >
                Start Daily Practice
              </button>
            </div>
          ) : (
            <div className="glass-panel" style={{ maxWidth: "600px", width: "90%" }}>
              <h2 style={{ marginBottom: "1rem" }}>Target Job Description</h2>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the Job Description here. Sarah will tailor the interview to these requirements..."
                style={{
                  width: "100%",
                  height: "200px",
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1rem",
                  color: "white",
                  marginBottom: "1.5rem",
                }}
              />
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--foreground-muted)" }}>
                  Interview Persona
                </label>
                <select
                  value={selectedPersona.id}
                  onChange={(e) => setSelectedPersona(PERSONAS.find(p => p.id === e.target.value) || PERSONAS[0])}
                  style={{
                    width: "100%",
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "0.75rem 1rem",
                    color: "white",
                    fontSize: "0.9rem",
                  }}
                >
                  {PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setShowJDScreen(false)}
                  className="secondary"
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button onClick={requestStartInterview} disabled={isLoading} style={{ flex: 2 }}>
                  {isLoading ? (
                    <Loader2 className="animate-spin" style={{ margin: "0 auto" }} />
                  ) : (
                    "Begin Interview"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>{/* end layout-conversational */}

        {/* FIX 3: Modals are outside the layout div, still inside the outer container */}
        {showPreflight && userId && (
          <PreflightWizard
            userId={userId}
            onComplete={handlePreflightComplete}
            onCancel={() => {
              setShowPreflight(false);
              setPendingJd(null);
            }}
          />
        )}

        {showVideoPlayer && selectedInterview?.dropbox_video_url && (
          <AudioPlayerModal
            audioUrl={selectedInterview.dropbox_video_url}
            onClose={() => setShowVideoPlayer(false)}
          />
        )}

        {showAnalysis && selectedInterview && (
          <AnalysisDrawer
            interview={selectedInterview}
            onClose={() => setShowAnalysis(false)}
          />
        )}

      </div> // end outer container
    );
  }

  // ─── Active Interview Session ─────────────────────────────────────────────────
  const isSplit = uiConfig?.showCodeWorkspace;

  return (
    <div className="container">
      <header className="header">
        <div className="logo" style={{ fontWeight: 800, letterSpacing: "1px" }}>
          MOCKME.AI
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

      <main className="main-content" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", flex: 1, gap: "0.75rem", minHeight: 0 }}>
          {/* Left panel — interview + webcam */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: 0 }}>
            <div
              className="glass-panel"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "1.5rem 2rem",
                flex: 1,
              }}
            >
              {/* Webcam preview */}
              <div style={{ width: "160px", height: "120px", borderRadius: "10px", overflow: "hidden", marginBottom: "0.75rem", border: "1px solid var(--border)", background: "#000" }}>
                <video ref={videoPreviewRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              </div>

              <div className="interviewer-container" style={{ marginBottom: "0.5rem" }}>
                <div className={`avatar-pulse ${isSpeaking ? "speaking" : ""}`} />
                <div
                  className="avatar-core"
                  style={{
                    boxShadow: isSpeaking
                      ? "0 0 60px var(--primary-glow)"
                      : "0 0 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <User size={40} />
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                <h2 style={{ fontSize: "1rem", marginBottom: "0", color: "var(--foreground)" }}>
                  Sarah
                </h2>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSpeaking ? "var(--primary)" : "var(--accent)" }} />
                  <p style={{ color: "var(--foreground-muted)", fontSize: "0.8rem", fontWeight: 500, margin: 0 }}>
                    {isSpeaking ? "Speaking..." : "Listening..."}
                  </p>
                </div>
              </div>

              <div className="controls">
                {uiConfig?.currentState === "STATE_3" ? (
                  <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
                    {isFinalizing ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                        <p style={{ fontWeight: 600, color: "var(--foreground-muted)", fontSize: "0.9rem" }}>
                          Finalizing Analysis...
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                        <CheckCircle2 size={36} color="var(--accent)" />
                        <h3 style={{ fontSize: "1.1rem" }}>Interview Complete</h3>
                        <button onClick={() => window.location.reload()} style={{ minWidth: "160px", fontSize: "0.85rem" }}>
                          Return to Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                ) : isRecording ? (
                  <button onClick={stopRecording} className="mic-btn listening" title="Stop Recording">
                    <VideoOff size={28} />
                  </button>
                ) : (
                  <button
                    disabled={isSpeaking || isLoading}
                    onClick={startRecording}
                    className="mic-btn"
                    title="Record Webcam"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <Video size={28} />}
                  </button>
                )}
              </div>

              <div style={{ width: "100%", maxWidth: "500px", marginTop: "0.75rem" }}>
                <LiveTranscript text={isSpeaking ? lastSarahText : null} />
              </div>
            </div>

            {/* Chat panel */}
            <div className="glass-panel" style={{ padding: "0.75rem", flex: "0 0 auto", maxHeight: "180px" }}>
              <ChatPanel sessionId={sessionId} />
            </div>
          </div>

          {/* Right panel — code workspace + whiteboard tabs */}
          {isSplit && (
            <div className="right-panel" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 0 }}>
              <div className="workspace-panel" style={{ flex: 1 }}>
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
              {/* Whiteboard */}
              <div className="glass-panel" style={{ padding: "0.5rem", flex: "0 0 auto", maxHeight: "250px" }}>
                <Whiteboard visible={true} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}