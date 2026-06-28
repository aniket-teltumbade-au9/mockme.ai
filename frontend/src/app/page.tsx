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
  Sparkles,
  ChevronRight,
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

  useEffect(() => {
    if (sessionId) {
      window.currentSessionId = sessionId;
    }
  }, [sessionId]);

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

  if (!isInitialized) return <div className="h-screen flex items-center justify-center bg-neutral-950 text-slate-200"><Loader2 className="animate-spin text-primary" /></div>;
  if (!userId || !accessToken) return <LoginScreen />;

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
    <div className="min-h-screen w-full bg-[#0a0a0c] text-slate-100 selection:bg-primary/30 antialiased">
      {sessionExpired && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[10000] flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 max-w-[400px] w-full p-8 text-center rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 tracking-tight text-white">Session Expired</h2>
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-semibold active:scale-[0.98]" onClick={logout}>Logout</button>
          </div>
        </div>
      )}

      <div className="w-full mx-auto max-w-7xl px-4 py-8">
        <header className="flex items-center justify-between mb-12 border-b border-white/[0.04] pb-6">
          <h1 
            className="text-2xl font-black bg-gradient-to-r from-primary via-purple-400 to-indigo-400 bg-clip-text text-transparent cursor-pointer hover:opacity-90 transition-opacity tracking-tight" 
            onClick={() => router.push("/")}
          >
            MockMe.AI
          </h1>
          <button 
            onClick={() => router.push("/profile")} 
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 rounded-full text-sm font-semibold transition-all border border-white/[0.06] hover:border-white/[0.12] active:scale-95"
          >
            <User size={15} className="text-slate-400" /> Profile
          </button>
        </header>

        {!showJDScreen ? (
          <div className="space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/40 border border-white/[0.05] shadow-xl p-6 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-4 text-primary">
                  <BarChart3 size={18} />
                  <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Performance</h2>
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-5xl font-black tracking-tight text-white">{userProgress?.total_interviews || 0}</span>
                  <span className="text-slate-400 text-sm font-medium">Sessions completed</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/40 border border-white/[0.05] shadow-xl p-6 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-4 text-purple-400">
                  <History size={18} />
                  <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Recent Skill Gaps</h2>
                </div>
                <div className="flex flex-wrap gap-2 items-center min-h-[48px]">
                  {(userProgress?.skill_gaps?.length ?? 0) > 0 ? (
                    <>
                      {userProgress!.skill_gaps?.slice(0, 3)?.map((g, i) => (
                        <span key={i} className="px-3 py-1 bg-white/[0.04] text-slate-200 text-xs font-medium rounded-lg border border-white/[0.08] shadow-sm">
                          {g}
                        </span>
                      ))}
                      {(userProgress?.skill_gaps?.length ?? 0) > 3 && (
                        <span className="text-xs text-slate-400 font-semibold pl-1">+{userProgress!.skill_gaps.length - 3} more</span>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400/70 italic font-medium">No gaps detected yet. Start an interview!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
              <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-base font-bold text-white tracking-wide">Dashboard</h3>
                <div className="flex p-1 bg-black/30 rounded-xl border border-white/[0.04]">
                  <button 
                    onClick={() => updateParams({ tab: "history" })} 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${tab === "history" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    History
                  </button>
                  <button 
                    onClick={() => updateParams({ tab: "progress" })} 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${tab === "progress" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Analytics
                  </button>
                </div>
              </div>

              <div className="p-6">
                {tab === "history" ? (
                  <div className="space-y-4">
                    {interviewHistory.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                        {interviewHistory.map((inv) => (
                          <InterviewHistoryCard
                            key={inv.sessionId}
                            interview={inv}
                            onPlayAudio={(i) => updateParams({ sessionId: i.sessionId, view: "audio" })}
                            onViewAnalysis={(i) => updateParams({ sessionId: i.sessionId, view: "analysis" })}
                            onViewTranscript={(i) => updateParams({ sessionId: i.sessionId, view: "transcript" })}
                            onRetryFinalize={handleRetryAftersave}
                            onRetryStarted={(_newSessionId) => router.push(`/interview/${_newSessionId}`)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.08]">
                        <p className="text-slate-400/80 italic text-sm font-medium">No previous sessions found.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ProgressDashboard />
                )}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button 
                onClick={() => setShowJDScreen(true)} 
                className="group relative px-10 py-4 bg-primary hover:bg-primary-hover text-white rounded-full font-extrabold text-base transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-3 shadow-lg shadow-primary/20"
              >
                <Sparkles size={18} className="text-white group-hover:scale-110 transition-transform" />
                Start Daily Practice
              </button>
            </div>
          </div>
        ) : (
          /* Interview Setup Screen */
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setShowJDScreen(false)} 
                className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-full transition-all border border-white/[0.06] active:scale-95"
              >
                <ChevronRight className="rotate-180 text-slate-300" size={18} />
              </button>
              <h2 className="text-2xl font-black tracking-tight text-white">Interview Setup</h2>
            </div>

            <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/[0.06] shadow-2xl p-8 rounded-2xl space-y-8">
              {errorMsg && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold tracking-wide">{errorMsg}</div>}

              <JDSelector value={jd} onChange={setJd} />

              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">Resume (PDF / Docx)</label>
                {(pendingResume || storedResumeFilename) ? (
                  <div className="flex items-center gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span className="flex-1 truncate text-sm text-slate-200 font-medium">{pendingResume ? pendingResume.name : `${storedResumeFilename}`}</span>
                    <button onClick={() => setPendingResume(null)} className="text-xs text-primary hover:underline font-semibold tracking-wide">Change</button>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={(e) => setPendingResume(e.target.files?.[0] || null)} 
                    className="w-full bg-white/[0.01] border border-white/[0.06] rounded-xl p-3 text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wide file:bg-white/[0.06] file:text-white hover:file:bg-white/[0.12] file:transition-colors hover:bg-white/[0.03] transition-colors"
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400">Interview Persona</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all ${
                        selectedPersona.id === p.id 
                          ? "bg-primary/10 border-primary text-primary shadow-inner" 
                          : "bg-white/[0.01] border-white/[0.06] text-slate-400 hover:border-white/[0.15] hover:text-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/[0.04]">
                <button 
                  onClick={() => setShowJDScreen(false)} 
                  className="flex-1 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 rounded-xl font-bold text-sm transition-all border border-white/[0.04] active:scale-[0.98]"
                >
                  Back
                </button>
                <button 
                  onClick={requestStartInterview} 
                  disabled={isLoading} 
                  className="flex-[2] py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Begin Interview"}
                </button>
              </div>
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
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-neutral-950/95 backdrop-blur-2xl border-l border-white/[0.08] p-8 overflow-y-auto shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-4">
            <h2 className="text-xl font-extrabold tracking-tight text-white">Transcript Analysis</h2>
            <button className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-full transition-colors" onClick={closeView}>
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="space-y-4">
            {selectedInterview.history?.map((msg, index) => (
              <div 
                key={index} 
                onClick={() => { if (msg.role === 'assistant' || (msg.role === 'user' && index > 0 && selectedInterview.history![index-1].role === 'assistant')) { setTutorSession(selectedInterview.sessionId, index); } }} 
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  msg.role === 'assistant' 
                    ? 'bg-primary/5 border-primary/20 text-slate-100' 
                    : 'bg-white/[0.01] border-white/[0.05] text-slate-400 hover:text-slate-300'
                } hover:border-white/[0.15] hover:shadow-md active:scale-[0.995]`}
              >
                <strong className={`block mb-1.5 text-[10px] font-extrabold uppercase tracking-widest ${msg.role === 'assistant' ? 'text-primary' : 'text-slate-400'}`}>
                  {msg.role === 'assistant' ? 'Sarah (AI Interviewer)' : 'You'}
                </strong>
                <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {view === "tutor" && selectedTutorSession && <TutorPanel question={selectedTutorSession.question} userAnswer={selectedTutorSession.answer} onClose={closeView} />}
    </div>
  );
}