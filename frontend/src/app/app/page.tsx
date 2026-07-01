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
  X,
} from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { useInterviewRecorder } from "@/hooks/useInterviewRecorder";
import { InterviewHistoryCard } from "@/components/Dashboard/InterviewHistoryCard";
import { AudioPlayerModal } from "@/components/Dashboard/AudioPlayerModal";
import { AnalysisDrawer } from "@/components/Dashboard/AnalysisDrawer";
import { PreflightWizard } from "@/components/PreflightWizard";
import { JDSelector } from "@/components/JDSelector";
import { LiveTranscript, VoiceSelector, TTSVoice } from "@/components/InterviewOverlays";
import { ProgressDashboard } from "@/components/Dashboard/ProgressDashboard";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import { InterviewRecord, UserProgress } from "@/types/interview";

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
  const [pendingResume, setPendingResume] = useState<File | null>(null);

  // Live transcript (last thing Sarah said)
  const [lastSarahText, setLastSarahText] = useState<string | null>(null);

  // Voice selection — controls backend TTS accent
  const [voiceList, setVoiceList] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>({ name: "English (US)", lang_code: "en", flag: "\u{1f1fa}\u{1f1f8}" });

  // Code submission state
  const [codeSyncState, setCodeSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  const latestCodeRef = useRef<string>("");

  // FIX 4: Separate per-turn MediaRecorder refs (do NOT reuse the full session recorder)
  const turnRecorderRef = useRef<MediaRecorder | null>(null);
  const turnChunksRef = useRef<Blob[]>([]);

  const {
    startRecording: startFullSessionRecording,
    stopRecording: stopFullSessionRecording,
  } = useInterviewRecorder();

  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [jd, setJd] = useState("");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showJDScreen, setShowJDScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewRecord[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRecord | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"history" | "progress">("history");

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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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

  const handleRetryAftersave = async (interview: InterviewRecord) => {
    try {
      await axios.post(`${API_BASE}/interviews/${interview.sessionId}/refinalize`, null, { headers: authHeaders() });
      await fetchHistory();
      alert("Re-processing started. Please check back in a moment.");
    } catch (err) {
      console.error("Retry failed", err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(detail || "Failed to restart processing. Please try connecting to Dropbox first and try again.");
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
  const handlePreflightComplete = async (topic: string, isRehearsal: boolean, jd?: string) => {
    setShowPreflight(false);
    const finalJd = jd || pendingJd;
    if (!finalJd) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("jd", finalJd);
      if (topic) formData.append("topic", topic);
      formData.append("is_rehearsal", isRehearsal.toString());
      if (selectedPersona.id) formData.append("persona", selectedPersona.id);
      formData.append("voice_lang", selectedVoice.lang_code);
      if (pendingResume) formData.append("resume", pendingResume);

      const res = await axios.post(`${API_BASE}/session/start`, formData, { 
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } 
      });
      if (res.data.error) {
        setErrorMsg(res.data.message);
        setIsLoading(false);
        return;
      }
      setSessionIdSynced(res.data.sessionId);
      setUiConfigSynced(res.data.uiConfig);

      // Start the long-running full-session recorder (runs for the entire interview)
      try {
        await startFullSessionRecording();
      } catch (err) {
        console.warn("Full session recording could not start.", err);
      }

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

  // FIX 4: startRecording uses a dedicated per-turn MediaRecorder,
  // completely separate from the full-session recorder.
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
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting turn recording", err);
    }
  };

  // FIX 4: stopRecording stops only the per-turn recorder and sends the blob.
  // The full-session recorder keeps running untouched until handleFinalization.
  const stopRecording = () => {
    const mr = turnRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(turnChunksRef.current, { type: "audio/webm" });
      // Release the mic track so the browser stops showing the recording indicator
      mr.stream.getTracks().forEach((t) => t.stop());
      turnRecorderRef.current = null;
      sendAudioResponse(blob);
    };
    mr.stop();
    setIsRecording(false);
  };

  const sendAudioResponse = async (blob: Blob) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("sessionId", currentSessionId);
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
        await fetchHistory();
        await fetchProgress();
        setIsFinalizing(false);
        setSessionIdSynced(null);
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

  const codeChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCodeChange = (value?: string) => {
    if (!value) return;
    latestCodeRef.current = value;
    setCodeSyncState("idle");
    // Removed automatic sync timer
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
      setErrorMsg("Failed to save code. Please try again.");
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const submitCode = () => {
    if (codeChangeTimer.current) clearTimeout(codeChangeTimer.current);
    syncCode(latestCodeRef.current);
  };

  useEffect(() => {
    setTimeout(() => fetchVoices(), 0);
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
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Performance & History</h3>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setDashboardTab("history")}
                      style={{
                        padding: "0.5rem 1rem",
                        background: dashboardTab === "history" ? "rgba(129, 140, 248, 0.2)" : "transparent",
                        border: dashboardTab === "history" ? "1px solid #818cf8" : "1px solid transparent",
                        borderRadius: "8px",
                        color: dashboardTab === "history" ? "#818cf8" : "var(--foreground-muted)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: dashboardTab === "history" ? 600 : 400,
                        transition: "all 0.2s",
                      }}
                    >
                      History
                    </button>
                    <button
                      onClick={() => setDashboardTab("progress")}
                      style={{
                        padding: "0.5rem 1rem",
                        background: dashboardTab === "progress" ? "rgba(129, 140, 248, 0.2)" : "transparent",
                        border: dashboardTab === "progress" ? "1px solid #818cf8" : "1px solid transparent",
                        borderRadius: "8px",
                        color: dashboardTab === "progress" ? "#818cf8" : "var(--foreground-muted)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: dashboardTab === "progress" ? 600 : 400,
                        transition: "all 0.2s",
                      }}
                    >
                      Progress & Analytics
                    </button>
                  </div>
                </div>

                {dashboardTab === "history" ? (
                  <div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--foreground-muted)",
                        fontWeight: 500,
                        marginBottom: "1rem",
                      }}
                    >
                      {interviewHistory.length} Recorded Sessions
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
                              setShowAudioPlayer(true);
                            }}
                            onViewAnalysis={(i) => {
                              setSelectedInterview(i);
                              setShowAnalysis(true);
                            }}
                            onViewTranscript={(i) => {
                              setSelectedInterview(i);
                              setShowTranscript(true);
                            }}
                            onRetryFinalize={handleRetryAftersave}
                            onRetryStarted={(_newSessionId) => {
                              // Switch to focused interview and fetch history
                              setSessionIdSynced(_newSessionId);
                              setShowJDScreen(false);
                              fetchHistory();
                            }}
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
                ) : (
                  <ProgressDashboard />
                )}
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
              <h2 style={{ marginBottom: "1.5rem" }}>Interview Setup</h2>
              
              <JDSelector value={jd} onChange={setJd} />
              
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--foreground-muted)" }}>
                  Resume (PDF/Docx)
                </label>
                <input
                  type="file"
                  onChange={(e) => setPendingResume(e.target.files?.[0] || null)}
                  style={{
                    width: "100%",
                    background: "var(--secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "0.75rem 1rem",
                    color: "white",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
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

        {showAudioPlayer && selectedInterview?.dropbox_audio_url && (
          <AudioPlayerModal
            audioUrl={selectedInterview.dropbox_audio_url}
            onClose={() => setShowAudioPlayer(false)}
          />
        )}

        {showAnalysis && selectedInterview && (
          <AnalysisDrawer
            interview={selectedInterview}
            onClose={() => setShowAnalysis(false)}
          />
        )}
        
        {showTranscript && selectedInterview && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="h-full w-full max-w-[640px] bg-zinc-900 border-l border-zinc-800 p-8 overflow-y-auto shadow-2xl animate-slide-in-right">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">Transcript</h2>
                <button 
                  onClick={() => setShowTranscript(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {selectedInterview.history?.map((msg, index) => (
                  <div key={index} className={`p-4 rounded-xl ${msg.role === 'assistant' ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-zinc-800/50 border border-zinc-700/50'}`}>
                    <strong className={`block mb-1 text-sm ${msg.role === 'assistant' ? 'text-indigo-400' : 'text-zinc-100'}`}>
                      {msg.role === 'assistant' ? 'Sarah' : 'You'}
                    </strong>
                    <p className="text-sm text-zinc-300 leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div> // end outer container
    );
  }

  // ─── Active Interview Session ─────────────────────────────────────────────────
  const isSplit = uiConfig?.showCodeWorkspace;

  return (
    <div className="flex flex-col h-screen bg-slate-950">
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

      {/* Sticky Header with Progress */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-0.5 font-bold tracking-tight">
            <span className="text-slate-100 text-lg">mockme</span>
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs">.ai</span>
          </div>
          <div className="flex items-center gap-3">
            <VoiceSelector voices={voiceList} selectedVoice={selectedVoice} onSelect={setSelectedVoice} />
            <div className="state-badge" style={{ background: "var(--secondary)", padding: "4px 12px", borderRadius: "12px", fontSize: "0.7rem" }}>
              {uiConfig?.currentState}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-800/50 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uiConfig?.progress || 0}%` }} />
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex flex-row overflow-hidden">
        {/* Left Panel - Conversational (always visible, 50% width in split mode) */}
        <div className={`${isSplit ? 'w-1/2' : 'w-full'} flex flex-col bg-slate-950 border-r border-slate-800 overflow-y-auto`}>
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
            {/* Avatar Section */}
            <div className="mb-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className={`absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-pulse ${isSpeaking ? 'ring-4 ring-indigo-500/50' : ''}`} />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <User size={64} className="text-white" />
                </div>
              </div>
            </div>

            {/* Name and Status */}
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Sarah</h2>
            <div className="flex items-center gap-2 mb-8">
              <span className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
              <p className="text-slate-400 text-sm font-medium">{isSpeaking ? 'Speaking...' : 'Ready to listen'}</p>
            </div>

            {/* Last Sarah Text */}
            {lastSarahText && (
              <div className="w-full max-w-xs mb-8 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                <p className="text-slate-200 text-sm leading-relaxed italic">{lastSarahText}</p>
              </div>
            )}

            {/* Mic Button or Completion State */}
            {uiConfig?.currentState === "STATE_3" ? (
              <div className="w-full max-w-xs text-center">
                {isFinalizing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                    <p className="text-slate-400 font-medium">Finalizing Analysis...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100">Interview Complete</h3>
                    <p className="text-slate-400 text-sm">Your responses have been recorded and analyzed.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            ) : isRecording ? (
              <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all" title="Stop Recording">
                <MicOff size={40} />
              </button>
            ) : (
              <button disabled={isSpeaking || isLoading} onClick={startRecording} className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all" title="Start Recording">
                {isLoading ? <Loader2 className="animate-spin" size={40} /> : <Mic size={40} />}
              </button>
            )}

            {/* Transcript View */}
            <div className="w-full max-w-xs mt-8">
              <LiveTranscript text={isSpeaking ? lastSarahText : null} />
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor (50% width when split) */}
        {isSplit && (
          <div className="w-1/2 flex flex-col bg-slate-950 overflow-hidden">
            {/* Code Editor Header */}
            <div className="flex items-center justify-between h-14 px-6 bg-slate-900/50 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-indigo-600/20 flex items-center justify-center">
                  <Terminal size={16} className="text-indigo-400" />
                </div>
                <span className="text-xs font-bold tracking-wide text-slate-300">TECHNICAL WORKSPACE</span>
              </div>
              <div className="flex items-center gap-3">
                {codeSyncState === "syncing" && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded bg-slate-800/50 text-xs text-slate-400">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Syncing…</span>
                  </div>
                )}
                {codeSyncState === "synced" && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/10 text-xs text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>Saved</span>
                  </div>
                )}
                <button onClick={submitCode} disabled={codeSyncState === "syncing"} className="flex items-center gap-1 px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white text-xs font-semibold transition-colors">
                  <Send size={12} /> Submit
                </button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                code={uiConfig?.editorConfig?.codeContent || ""}
                language={uiConfig?.editorConfig?.language || "javascript"}
                onChange={onCodeChange}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}