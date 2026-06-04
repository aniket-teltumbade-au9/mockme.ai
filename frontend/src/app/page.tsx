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
  Cloud,
  Send,
} from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { useInterviewRecorder } from "@/hooks/useInterviewRecorder";
import { InterviewHistoryCard } from "@/components/Dashboard/InterviewHistoryCard";
import { AudioPlayerModal } from "@/components/Dashboard/AudioPlayerModal";
import { AnalysisDrawer } from "@/components/Dashboard/AnalysisDrawer";
import { PreflightWizard } from "@/components/PreflightWizard";
import { LiveTranscript, VoiceSelector, TTS_VOICES, TTSVoice } from "@/components/InterviewOverlays";

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

interface UserProgress {
  total_interviews: number;
  skill_gaps: string[];
}

interface InterviewRecord {
  sessionId: string;
  created_at: string;
  analysis?: { hire_verdict?: string };
  dropbox_audio_url?: string;
}

interface DropboxStatus {
  connected: boolean;
  email?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function InterviewPage() {
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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Pre-flight wizard
  const [showPreflight, setShowPreflight] = useState(false);
  const [pendingJd, setPendingJd] = useState<string | null>(null);

  // Live transcript (last thing Sarah said)
  const [lastSarahText, setLastSarahText] = useState<string | null>(null);

  // Voice selection — controls backend TTS accent
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>(TTS_VOICES[0]);

  // Code submission state
  const [codeSyncState, setCodeSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  const latestCodeRef = useRef<string>("");

  const {
    startRecording: startFullSessionRecording,
    stopRecording: stopFullSessionRecording,
    playInterviewerAudio,
  } = useInterviewRecorder();

  const [jd, setJd] = useState("");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showJDScreen, setShowJDScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewRecord[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRecord | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [dropboxStatus, setDropboxStatus] = useState<DropboxStatus | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/user/progress`);
      setUserProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch progress", err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/interviews/history`);
      setInterviewHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, []);

  const fetchDropboxStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/dropbox/status`);
      setDropboxStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch Dropbox status", err);
    }
  }, []);

  const connectDropbox = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dropbox/auth-url`);
      localStorage.setItem("dropbox_code_verifier", res.data.code_verifier);
      window.location.href = res.data.auth_url;
    } catch {
      alert("Failed to initiate Dropbox connection.");
    }
  };

  // Called when user clicks "Start Daily Practice" — show preflight wizard
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
      const res = await axios.post(`${API_BASE}/session/start`, { jd: pendingJd });
      if (res.data.error) {
        setErrorMsg(res.data.message);
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
    try {
      const res = await fetch(`${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=${selectedVoice.lang}`);

      if (res.status === 204 || !res.ok) {
        // TTS failed or returned nothing — fall back to SpeechSynthesis so
        // the interview is never silently broken
        fallbackSpeechSynthesis(text);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      await playInterviewerAudio(arrayBuffer);
    } catch (err) {
      console.error('TTS fetch failed, falling back to SpeechSynthesis:', err);
      fallbackSpeechSynthesis(text);
      return;
    }

    setIsSpeaking(false);
    if (uiConfigRef.current?.currentState !== 'STATE_3') startRecording();
  };

  /** Emergency fallback — audio won't be captured in the recording */
  const fallbackSpeechSynthesis = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          (v.name.includes('Google') || v.name.includes('Aria') || v.name.includes('Samantha')) &&
          v.lang.startsWith('en'),
      ) || voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (uiConfigRef.current?.currentState !== 'STATE_3') startRecording();
    };
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(mediaStream);
      setMediaRecorder(recorder);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        sendAudioResponse(audioBlob);
        mediaStream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFinalization = async (sid: string) => {
    setIsFinalizing(true);
    try {
      const fullAudioBlob = await stopFullSessionRecording();
      const formData = new FormData();
      formData.append("audio", fullAudioBlob, "session_audio.webm");
      await axios.post(`${API_BASE}/interviews/${sid}/finalize`, formData);
      
      // Poll for status
      let finalized = false;
      while (!finalized) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const res = await axios.get(`${API_BASE}/interviews/${sid}/status`);
        finalized = res.data.finalized;
        if (res.data.error) {
            console.error("Finalization error:", res.data.error);
            alert("Finalization failed: " + res.data.error);
            break;
        }
      }
      
      await fetchProgress();
      await fetchHistory();
    } catch (err) {
      console.error("Finalization failed", err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const sendAudioResponse = async (blob: Blob) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("sessionId", currentSessionId);
    formData.append("file", blob, "recording.webm");
    try {
      const res = await axios.post(`${API_BASE}/interview/respond-audio`, formData);
      setUiConfigSynced(res.data.uiConfig);
      playAudio(res.data.uiConfig?.voice_script || "I understand.");

      if (res.data.uiConfig?.currentState === "STATE_3") {
        handleFinalization(currentSessionId);
      }
    } catch (err) {
      console.error("Error sending audio", err);
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
      await axios.post(`${API_BASE}/interview/respond-code`, null, {
        params: { sessionId: sessionIdRef.current, code },
      });
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
    (async () => {
      await fetchProgress();
      await fetchHistory();
      await fetchDropboxStatus();
    })();
  }, [fetchProgress, fetchHistory, fetchDropboxStatus]);

  if (!sessionId) {
    return (
      <div className="container layout-conversational">
        {!showJDScreen ? (
          <div
            className="glass-panel text-center"
            style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h1 style={{
                fontSize: "2rem",
                background: "linear-gradient(to right, #818cf8, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 800,
              }}>
                MockMe.AI
              </h1>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={connectDropbox}
                  className="secondary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}
                >
                  <Cloud size={16} color={dropboxStatus?.connected ? "#10b981" : "#94a3b8"} />
                  {dropboxStatus?.connected ? "Cloud Connected" : "Connect Dropbox"}
                </button>
              </div>
            </div>

            {errorMsg && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{errorMsg}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", textAlign: "left", marginBottom: "2.5rem" }}>
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", marginBottom: "1rem", color: "#94a3b8" }}>
                  <BarChart3 size={20} color="var(--primary)" /> PERFORMANCE
                </h2>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>{userProgress?.total_interviews || 0}</span>
                  <span style={{ color: "#64748b" }}>Sessions</span>
                </div>
              </div>
              <div className="glass-panel" style={{ padding: "1.5rem" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", marginBottom: "1rem", color: "#94a3b8" }}>
                  <History size={20} color="var(--accent)" /> RECENT GAPS
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                  {(userProgress?.skill_gaps?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProgress!.skill_gaps.slice(0, 5).map((g, i) => (
                        <span key={i} style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", padding: "2px 8px", borderRadius: "4px" }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "No gaps detected yet. Start an interview!"
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "left", marginBottom: "2.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Session History</h3>
              <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
                {interviewHistory.length > 0 ? (
                  interviewHistory.map((inv) => (
                    <InterviewHistoryCard
                      key={inv.sessionId}
                      interview={inv}
                      onPlayAudio={(i) => { setSelectedInterview(i); setShowAudioPlayer(true); }}
                      onViewAnalysis={(i) => { setSelectedInterview(i); setShowAnalysis(true); }}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500 italic">No previous sessions found.</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowJDScreen(true)}
              className="mic-btn"
              style={{ margin: "0 auto", width: "240px", borderRadius: "12px", height: "60px" }}
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
                width: "100%", height: "200px", background: "var(--secondary)",
                border: "1px solid var(--border)", borderRadius: "12px",
                padding: "1rem", color: "white", marginBottom: "1.5rem",
              }}
            />
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setShowJDScreen(false)} className="secondary" style={{ flex: 1 }}>
                Back
              </button>
              <button onClick={requestStartInterview} disabled={isLoading} style={{ flex: 2 }}>
                {isLoading ? <Loader2 className="animate-spin" style={{ margin: "0 auto" }} /> : "Begin Interview"}
              </button>
            </div>
          </div>
        )}

        {showPreflight && (
          <PreflightWizard
            onComplete={handlePreflightComplete}
            onCancel={() => { setShowPreflight(false); setPendingJd(null); }}
          />
        )}

        {showAudioPlayer && selectedInterview?.dropbox_audio_url && (
          <AudioPlayerModal audioUrl={selectedInterview.dropbox_audio_url} onClose={() => setShowAudioPlayer(false)} />
        )}
        {showAnalysis && selectedInterview && (
          <AnalysisDrawer interview={selectedInterview} onClose={() => setShowAnalysis(false)} />
        )}
      </div>
    );
  }

  const isSplit = uiConfig?.showCodeWorkspace;

  return (
    <div className="container">
      <header className="header">
        <div className="logo" style={{ fontWeight: 800, letterSpacing: "1px" }}>MOCKME.AI</div>
        <div className="progress-container">
          <div className="progress-bar-outer">
            <div className="progress-bar-inner" style={{ width: `${uiConfig?.progress || 0}%` }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Voice selector in header during interview */}
          <VoiceSelector selectedVoice={selectedVoice} onSelect={setSelectedVoice} />
          <div className="state-badge" style={{ background: "var(--secondary)", padding: "4px 12px", borderRadius: "12px", fontSize: "0.7rem" }}>
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
            }}
          >
            <div className="interviewer-container">
              <div className={`avatar-pulse ${isSpeaking ? "speaking" : ""}`} />
              <div className="avatar-core"><User size={48} /></div>
            </div>
            <div style={{ textAlign: "center", margin: "1rem 0" }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Sarah</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Interviewer (EM)</p>
            </div>

            <div className="controls">
              {uiConfig?.currentState === "STATE_3" ? (
                <div style={{ textAlign: "center" }}>
                  {isFinalizing ? (
                    <>
                      <Loader2 className="animate-spin" size={48} style={{ margin: "0 auto 1rem" }} />
                      <p>Finalizing Analysis...</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={48} color="var(--accent)" style={{ margin: "0 auto 1rem" }} />
                      <p>Interview Complete</p>
                      <button onClick={() => window.location.reload()} style={{ marginTop: "1rem" }}>
                        Return to Dashboard
                      </button>
                    </>
                  )}
                </div>
              ) : isRecording ? (
                <button onClick={stopRecording} className="mic-btn listening">
                  <MicOff size={32} />
                </button>
              ) : (
                <button disabled={isSpeaking || isLoading} onClick={startRecording} className="mic-btn">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Mic size={32} />}
                </button>
              )}
            </div>

            {/* Live transcript of last Sarah utterance */}
            <LiveTranscript text={isSpeaking ? lastSarahText : null} />
          </div>

          {/* Right panel — code workspace */}
          {isSplit && (
            <div className="right-panel">
              <div className="workspace-panel">
                <div className="workspace-panel-header" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Terminal size={18} color="#6366f1" />
                    <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>TECHNICAL WORKSPACE</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {codeSyncState === "syncing" && (
                      <span style={{ fontSize: "0.7rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Loader2 size={12} className="animate-spin" /> Syncing…
                      </span>
                    )}
                    {codeSyncState === "synced" && (
                      <span style={{ fontSize: "0.7rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <CheckCircle2 size={12} /> Submitted
                      </span>
                    )}
                    <button
                      onClick={submitCode}
                      disabled={codeSyncState === "syncing"}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px",
                      }}
                    >
                      <Send size={12} /> Submit Code
                    </button>
                  </div>
                </div>
                <CodeEditor
                  code={uiConfig?.editorConfig?.codeContent || ""}
                  language={uiConfig?.editorConfig?.language || "javascript"}
                  onChange={onCodeChange}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
