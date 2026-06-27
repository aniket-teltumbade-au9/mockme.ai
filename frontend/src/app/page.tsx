"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  BarChart3,
  History,
  CheckCircle2,
  Loader2,
  User,
} from "lucide-react";
import { InterviewHistoryCard } from "@/components/Dashboard/InterviewHistoryCard";
import { AudioPlayerModal } from "@/components/Dashboard/AudioPlayerModal";
import { AnalysisDrawer } from "@/components/Dashboard/AnalysisDrawer";
import { PreflightWizard } from "@/components/PreflightWizard";
import { JDSelector } from "@/components/JDSelector";
import { ProgressDashboard } from "@/components/Dashboard/ProgressDashboard";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import { TutorPanel } from "@/components/Dashboard/TutorPanel";
import { InterviewRecord, UserProgress } from "@/types/interview";


// Augment Window so we don't need `as any`
declare global {
  interface Window {
    currentSessionId?: string;
  }
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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, accessToken, isInitialized, sessionExpired, logout } = useAuth();

  const [pendingJd, setPendingJd] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState<File | null>(null);
  const [storedResumeUrl, setStoredResumeUrl] = useState<string | null>(null);
  const [storedResumeFilename, setStoredResumeFilename] = useState<string | null>(null);

  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [jd, setJd] = useState("");
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showJDScreen, setShowJDScreen] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [interviewHistory, setInterviewHistory] = useState<InterviewRecord[]>([]);

  // --- URL State Management ---
  const tab = searchParams.get("tab") || "history";
  const sessionId = searchParams.get("sessionId");
  const view = searchParams.get("view");
  const msgIndex = searchParams.get("msgIndex");

  const selectedInterview = interviewHistory.find(inv => inv.sessionId === sessionId) || null;

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const closeView = () => updateParams({ view: null, sessionId: null, msgIndex: null });

  // Add this effect near your other useEffects
useEffect(() => {
  if (sessionId) {
    window.currentSessionId = sessionId;
  }
}, [sessionId]);

// Then simplify setTutorSession — no window mutation needed here
const setTutorSession = (id: string, index: number) => {
  updateParams({ sessionId: id, view: "tutor", msgIndex: index.toString() });
};

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
    try {
      const formData = new FormData();
      formData.append("jd", finalJd);
      if (topic) formData.append("topic", topic);
      formData.append("is_rehearsal", isRehearsal.toString());
      if (selectedPersona.id) formData.append("persona", selectedPersona.id);
      if (pendingResume) formData.append("resume", pendingResume);

      const res = await axios.post(`${API_BASE}/session/start`, formData, { 
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } 
      });
      if (res.data.error) {
        setErrorMsg(res.data.message);
        setIsLoading(false);
        return;
      }
      
      router.push(`/interview/${res.data.sessionId}`);
    } catch (err) {
      console.error("Failed to start interview", err);
      setErrorMsg("Connection error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized || !userId || !accessToken) return;
    (async () => {
      await fetchProgress();
      await fetchHistory();
      try {
        const res = await axios.get(`${API_BASE}/user/resume`, { headers: authHeaders() });
        setStoredResumeUrl(res.data.resume_url);
        setStoredResumeFilename(res.data.resume_filename);
      } catch (err) {
        console.error("Failed to fetch stored resume", err);
      }
    })();
  }, [fetchProgress, fetchHistory, accessToken, isInitialized, userId]);

  if (!isInitialized) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white" }}>Loading...</div>;
  if (!userId || !accessToken) return <LoginScreen />;

  // Derive tutor session data from URL params
  const selectedTutorSession = (sessionId && msgIndex && selectedInterview?.history) ? (() => {
    const idx = parseInt(msgIndex);
    const msg = selectedInterview.history![idx];
    if (!msg) return null;
    return {
      question: (idx > 0 && selectedInterview.history![idx - 1]?.role === 'assistant') 
        ? selectedInterview.history![idx - 1].content 
        : msg.content,
      answer: msg.content,
      isAssistant: msg.role === 'assistant'
    };
  })() : null;

  return (
    <div className="container">
      {sessionExpired && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(2, 6, 23, 0.9)", backdropFilter: "blur(12px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-panel" style={{ maxWidth: "400px", textAlign: "center" }}>
            <h2 style={{ marginBottom: "1rem" }}>Session Expired</h2>
            <button className="secondary" style={{ flex: 1 }} onClick={logout}>Logout</button>
          </div>
        </div>
      )}

      <div className="layout-conversational" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <header style={{ width: "100%", maxWidth: "900px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", padding: "0 1rem" }}>
          <h1 style={{ fontSize: "1.5rem", background: "linear-gradient(to right, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, cursor: "pointer" }} onClick={() => router.push("/")}>MockMe.AI</h1>
          <button 
            onClick={() => router.push("/profile")} 
            className="secondary" 
            style={{ padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}
          >
            <User size={16} /> Profile
          </button>
        </header>

        {!showJDScreen ? (
          <div className="glass-panel text-center" style={{ maxWidth: "900px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            {errorMsg && <div style={{ color: "var(--danger)", marginBottom: "1rem" }}>{errorMsg}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", textAlign: "left", marginBottom: "3rem" }}>
              <div className="glass-panel" style={{ padding: "2rem", background: "rgba(255,255,255,0.02)" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}><BarChart3 size={18} color="var(--primary)" /> Performance</h2>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}><span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--foreground)" }}>{userProgress?.total_interviews || 0}</span><span style={{ color: "var(--foreground-muted)", fontWeight: 500 }}>Sessions</span></div>
              </div>
              <div className="glass-panel" style={{ padding: "2rem", background: "rgba(255,255,255,0.02)" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}><History size={18} color="var(--accent)" /> Recent Gaps</h2>
                <div style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>
                  {(userProgress?.skill_gaps?.length ?? 0) > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {userProgress!.skill_gaps.slice(0, 3).map((g, i) => <span key={i} style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.1)", fontWeight: 500 }}>{g}</span>)}
                      {userProgress!.skill_gaps.length > 3 && <span style={{ padding: "4px 10px", color: "var(--foreground-muted)" }}>+{userProgress!.skill_gaps.length - 3} more</span>}
                    </div>
                  ) : <p style={{ fontStyle: "italic", opacity: 0.7 }}>No gaps detected yet. Start an interview!</p>}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "left", marginBottom: "3rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Performance & History</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => updateParams({ tab: "history" })} style={{ padding: "0.5rem 1rem", background: tab === "history" ? "rgba(129, 140, 248, 0.2)" : "transparent", border: tab === "history" ? "1px solid #818cf8" : "1px solid transparent", borderRadius: "8px", color: tab === "history" ? "#818cf8" : "var(--foreground-muted)", cursor: "pointer", fontSize: "0.9rem", fontWeight: tab === "history" ? 600 : 400, transition: "all 0.2s" }}>History</button>
                  <button onClick={() => updateParams({ tab: "progress" })} style={{ padding: "0.5rem 1rem", background: tab === "progress" ? "rgba(129, 140, 248, 0.2)" : "transparent", border: tab === "progress" ? "1px solid #818cf8" : "1px solid transparent", borderRadius: "8px", color: tab === "progress" ? "#818cf8" : "var(--foreground-muted)", cursor: "pointer", fontSize: "0.9rem", fontWeight: tab === "progress" ? 600 : 400, transition: "all 0.2s" }}>Progress & Analytics</button>
                </div>
              </div>

              {tab === "history" ? (
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--foreground-muted)", fontWeight: 500, marginBottom: "1rem" }}>{interviewHistory.length} Recorded Sessions</div>
                  <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {interviewHistory.length > 0 ? (
                      interviewHistory.map((inv) => (
                        <InterviewHistoryCard
                          key={inv.sessionId}
                          interview={inv}
                          onPlayAudio={(i) => updateParams({ sessionId: i.sessionId, view: "audio" })}
                          onViewAnalysis={(i) => updateParams({ sessionId: i.sessionId, view: "analysis" })}
                          onViewTranscript={(i) => updateParams({ sessionId: i.sessionId, view: "transcript" })}
                          onRetryFinalize={handleRetryAftersave}
                          onRetryStarted={(_newSessionId) => router.push(`/interview/${_newSessionId}`)}
                        />
                      ))
                    ) : <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)", color: "var(--foreground-muted)", fontStyle: "italic" }}>No previous sessions found.</div>}
                  </div>
                </div>
              ) : <ProgressDashboard />}
            </div>

            <button onClick={() => setShowJDScreen(true)} className="mic-btn" style={{ margin: "0 auto", width: "280px", borderRadius: "var(--radius-lg)", height: "64px", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.02em", boxShadow: "0 20px 40px -10px var(--primary-glow)" }}>Start Daily Practice</button>
          </div>
        ) : (
          <div className="glass-panel" style={{ maxWidth: "600px", width: "90%" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Interview Setup</h2>
            <JDSelector value={jd} onChange={setJd} />
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--foreground-muted)" }}>Resume (PDF/Docx)</label>
              {(pendingResume || storedResumeFilename) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem 1rem", color: "white", fontSize: "0.9rem" }}>
                  <CheckCircle2 size={20} color="var(--accent)" />
                  <span style={{ flex: 1 }}>{pendingResume ? <span>{pendingResume.name}</span> : <span>Resume Loaded: {storedResumeFilename} ✅</span>}</span>
                  <button onClick={() => setPendingResume(null)} className="secondary" style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.8rem', minHeight: 'auto', lineHeight: '1' }}>Change</button>
                </div>
              ) : <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPendingResume(e.target.files?.[0] || null)} style={{ width: "100%", background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem 1rem", color: "white", fontSize: "0.9rem" }} />}
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--foreground-muted)" }}>Interview Persona</label>
              <select value={selectedPersona.id} onChange={(e) => setSelectedPersona(PERSONAS.find(p => p.id === e.target.value) || PERSONAS[0])} style={{ width: "100%", background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.75rem 1rem", color: "white", fontSize: "0.9rem" }}>
                {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setShowJDScreen(false)} className="secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={requestStartInterview} disabled={isLoading} style={{ flex: 2 }}>{isLoading ? <Loader2 className="animate-spin" style={{ margin: "0 auto" }} /> : "Begin Interview"}</button>
            </div>
          </div>
        )}
      </div>

      {showPreflight && userId && (
        <PreflightWizard
          userId={userId}
          onComplete={handlePreflightComplete}
          onCancel={() => { setShowPreflight(false); setPendingJd(null); }}
        />
      )}
      {view === "audio" && selectedInterview?.dropbox_audio_url && <AudioPlayerModal audioUrl={selectedInterview.dropbox_audio_url} onClose={closeView} />}
      {view === "analysis" && selectedInterview && <AnalysisDrawer interview={selectedInterview} onClose={closeView} />}
      
      {view === "transcript" && selectedInterview && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100, width: '100%', maxWidth: '640px', background: 'var(--background-alt)', borderLeft: '1px solid var(--border)', padding: '2rem', overflowY: 'auto' }}>
          <button className="secondary" onClick={closeView} style={{ marginBottom: '1rem' }}>Close</button>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Transcript</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedInterview.history?.map((msg, index) => (
              <div key={index} onClick={() => { if (msg.role === 'assistant' || (msg.role === 'user' && index > 0 && selectedInterview.history![index-1].role === 'assistant')) { setTutorSession(selectedInterview.sessionId, index); } }} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: msg.role === 'assistant' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)', cursor: 'pointer', transition: 'background 0.2s ease' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: msg.role === 'assistant' ? 'var(--primary)' : 'var(--foreground)' }}>{msg.role === 'assistant' ? 'Sarah' : 'You'}</strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {view === "tutor" && selectedTutorSession && <TutorPanel question={selectedTutorSession.question} userAnswer={selectedTutorSession.answer} onClose={closeView} />}
    </div>
  );
}
