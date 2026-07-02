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
  AlertTriangle,
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

  const [showPreflight, setShowPreflight] = useState(false);
  const [pendingJd, setPendingJd] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<File | null>(null);

  const [lastSarahText, setLastSarahText] = useState<string | null>(null);

  const [voiceList, setVoiceList] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>({ name: "English (US)", lang_code: "en", flag: "\u{1f1fa}\u{1f1f8}" });

  const [codeSyncState, setCodeSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  const latestCodeRef = useRef<string>("");

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
  const [creditWarning, setCreditWarning] = useState<string | null>(null);
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

  const requestStartInterview = () => {
    if (!jd.trim()) {
      alert("Please provide a Job Description to begin.");
      return;
    }
    setPendingJd(jd);
    setShowPreflight(true);
  };

  const handlePreflightComplete = async (topic: string, isRehearsal: boolean, jd?: string) => {
    setShowPreflight(false);
    const finalJd = jd || pendingJd;
    if (!finalJd) return;
    setIsLoading(true);
    setErrorMsg(null);
    setCreditWarning(null);
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
        if (res.data.message?.includes("credit") || res.data.message?.includes("Credit")) {
          setCreditWarning(res.data.message);
        } else {
          setErrorMsg(res.data.message);
        }
        setIsLoading(false);
        return;
      }
      setSessionIdSynced(res.data.sessionId);
      setUiConfigSynced(res.data.uiConfig);

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

  const stopRecording = () => {
    const mr = turnRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(turnChunksRef.current, { type: "audio/webm" });
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
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
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
      <div className="w-full min-h-screen">

        {sessionExpired && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
            <div className="glass-panel max-w-[400px] text-center">
              <h2 className="mb-4 text-xl font-bold">Session Expired</h2>
              <p className="text-[var(--foreground-muted)] mb-8">
                Your authentication token has expired. Please re-authenticate to continue.
              </p>
              <div className="flex gap-4">
                <button className="secondary flex-1" onClick={logout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="layout-conversational w-full min-h-screen flex items-center justify-center px-4">
          {!showJDScreen ? (
            <div className="glass-panel text-center max-w-[900px] w-full mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex justify-center items-center mb-8">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                  MockMe.AI
                </h1>
              </div>

              {errorMsg && (
                <div className="text-[var(--danger)] mb-4">{errorMsg}</div>
              )}

              <div className="grid grid-cols-2 gap-6 text-left mb-12">
                <div className="glass-panel p-8 bg-white/[0.02]">
                  <h2 className="flex items-center gap-2.5 text-sm font-bold mb-5 text-[var(--foreground-muted)] uppercase tracking-wide">
                    <BarChart3 size={18} className="text-[var(--primary)]" /> Performance
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-[var(--foreground)]">
                      {userProgress?.total_interviews || 0}
                    </span>
                    <span className="text-[var(--foreground-muted)] font-medium">
                      Sessions
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-8 bg-white/[0.02]">
                  <h2 className="flex items-center gap-2.5 text-sm font-bold mb-5 text-[var(--foreground-muted)] uppercase tracking-wide">
                    <History size={18} className="text-[var(--accent)]" /> Recent Gaps
                  </h2>
                  <div className="text-sm text-[var(--foreground-muted)]">
                    {(userProgress?.skill_gaps?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userProgress!.skill_gaps.slice(0, 3).map((g, i) => (
                          <span
                            key={i}
                            className="bg-red-500/[0.08] text-red-300 px-2.5 py-1 rounded-lg border border-red-500/10 font-medium"
                          >
                            {g}
                          </span>
                        ))}
                        {userProgress!.skill_gaps.length > 3 && (
                          <span className="px-2.5 py-1 text-[var(--foreground-muted)]">
                            +{userProgress!.skill_gaps.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="italic opacity-70">
                        No gaps detected yet. Start an interview!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left mb-12">
                <div className="flex items-center justify-between mb-6 border-b border-[var(--border)]">
                  <h3 className="text-xl font-extrabold">Performance & History</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDashboardTab("history")}
                      className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                        dashboardTab === "history"
                          ? "bg-indigo-400/20 border-indigo-400 text-indigo-400 font-semibold"
                          : "bg-transparent border-transparent text-[var(--foreground-muted)] font-normal"
                      }`}
                    >
                      History
                    </button>
                    <button
                      onClick={() => setDashboardTab("progress")}
                      className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                        dashboardTab === "progress"
                          ? "bg-indigo-400/20 border-indigo-400 text-indigo-400 font-semibold"
                          : "bg-transparent border-transparent text-[var(--foreground-muted)] font-normal"
                      }`}
                    >
                      Progress & Analytics
                    </button>
                  </div>
                </div>

                {dashboardTab === "history" ? (
                  <div>
                    <div className="text-xs text-[var(--foreground-muted)] font-medium mb-4">
                      {interviewHistory.length} Recorded Sessions
                    </div>
                    <div className="max-h-[400px] overflow-y-auto pr-3 flex flex-col gap-2">
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
                              setSessionIdSynced(_newSessionId);
                              setShowJDScreen(false);
                              fetchHistory();
                            }}
                          />
                        ))
                      ) : (
                        <div className="text-center p-12 bg-white/[0.02] rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] text-[var(--foreground-muted)] italic">
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
                className="mic-btn mx-auto w-[280px] h-16 rounded-[var(--radius-lg)] text-base font-bold tracking-wide shadow-[0_20px_40px_-10px_var(--primary-glow)]"
              >
                Start Daily Practice
              </button>
            </div>
          ) : (
            <div className="glass-panel max-w-[600px] w-[90%]">
              <h2 className="mb-6 text-xl font-bold">Interview Setup</h2>

              {creditWarning && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300">
                  <AlertTriangle size={20} className="flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{creditWarning}</p>
                  </div>
                </div>
              )}

              <JDSelector value={jd} onChange={setJd} />

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground-muted)]">
                  Resume (PDF/Docx)
                </label>
                <input
                  type="file"
                  onChange={(e) => setPendingResume(e.target.files?.[0] || null)}
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-white text-sm"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground-muted)]">
                  Interview Persona
                </label>
                <select
                  value={selectedPersona.id}
                  onChange={(e) => setSelectedPersona(PERSONAS.find(p => p.id === e.target.value) || PERSONAS[0])}
                  className="w-full bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-white text-sm"
                >
                  {PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowJDScreen(false)}
                  className="secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={requestStartInterview}
                  disabled={isLoading || !!creditWarning}
                  className={`flex-[2] ${creditWarning ? "opacity-50 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mx-auto" />
                  ) : (
                    "Begin Interview"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>{/* end layout-conversational */}

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

      </div>
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
            <div className="bg-[var(--secondary)] px-3 py-1 rounded-xl text-xs">
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