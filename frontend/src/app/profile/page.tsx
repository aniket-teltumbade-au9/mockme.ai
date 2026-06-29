"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, TrendingUp, Award, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE, getDropboxAccessToken } from "@/utils/apiConfig";

interface ConnectionStatus {
  dropbox: { connected: boolean; email?: string; name?: string };
  google: { connected: boolean; email?: string; name?: string };
}

export default function ProfilePage() {
  const { userId, isInitialized, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [connections, setConnections] = useState<ConnectionStatus>({
    dropbox: { connected: false },
    google: { connected: false }
  });

  useEffect(() => {
    if (!isInitialized) return;
    
    const fetchProfileData = async () => {
      try {
        const token = getDropboxAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch progress and connection data in parallel
        const [progressRes, heatmapRes, dropboxStatusRes, googleStatusRes] = await Promise.all([
          axios.get(`${API_BASE}/user/progress/detailed`, { headers }),
          axios.get(`${API_BASE}/user/progress/heatmap`, { headers }),
          axios.get(`${API_BASE}/dropbox/status`, { headers }).catch(() => ({ data: { connected: false } })),
          axios.get(`${API_BASE}/google/status`, { headers }).catch(() => ({ data: { connected: false } }))
        ]);
        
        setProgressData(progressRes.data);
        setHeatmapData(heatmapRes.data.data);
        setConnections({
          dropbox: dropboxStatusRes.data,
          google: googleStatusRes.data
        });
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [userId, isInitialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin mb-4 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
          <p className="text-foreground-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-effect max-w-2xl w-full p-8 md:p-12 text-center rounded-xl relative">
        <div className="mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary-glow ring-4 ring-primary/20">
            <User size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2 text-foreground">User Profile</h2>
          <p className="text-foreground-muted text-sm font-mono bg-secondary/50 inline-block px-3 py-1 rounded-full border border-border">
            ID: {userId}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Cloud Storage Status */}
          <div className="bg-white/5 rounded-xl p-5 text-left border border-border transition-all hover:border-border-bright">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck size={20} className="text-accent" />
              <span className="font-bold text-sm">Cloud Storage</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Dropbox</span>
                <div className="flex items-center gap-2">
                  {connections.dropbox.connected ? (
                    <>
                      <span className="text-[10px] text-emerald-400 font-semibold">Connected</span>
                      <button 
                        onClick={() => window.location.href = `${API_BASE}/dropbox/disconnect`}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => window.location.href = `${API_BASE}/dropbox/auth-url`}
                      className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Google Drive</span>
                <div className="flex items-center gap-2">
                  {connections.google.connected ? (
                    <>
                      <span className="text-[10px] text-emerald-400 font-semibold">Connected</span>
                      <button 
                        onClick={() => window.location.href = `${API_BASE}/google/disconnect`}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => window.location.href = `${API_BASE}/google/auth-url`}
                      className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-foreground-muted mt-3 leading-relaxed">
              Link your cloud accounts to automatically vault your recordings.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/5 rounded-xl p-5 text-left border border-border transition-all hover:border-border-bright">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={20} className="text-primary" />
              <span className="font-bold text-sm">Total Interviews</span>
            </div>
            <p className="text-2xl font-black text-white">{progressData?.total_interviews || 0}</p>
            <p className="text-[10px] text-foreground-muted mt-1">Keep practicing to improve!</p>
          </div>
        </div>

        {/* Recent Performance */}
        {progressData?.sessions?.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Activity size={18} className="text-primary" />
              <h3 className="font-bold text-lg text-foreground">Recent Performance</h3>
            </div>
            <div className="space-y-3">
              {progressData.sessions.slice(0, 3).map((session: any) => (
                <div key={session.session_id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-border">
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">{new Date(session.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-foreground-muted">{session.gaps.length} gaps identified</p>
                  </div>
                  <div className={`text-sm font-black ${session.performance_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {session.performance_score.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Overview (Simplified) */}
        {heatmapData.length > 0 && (
          <div className="mb-8 text-left">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Award size={18} className="text-primary" />
              <h3 className="font-bold text-lg text-foreground">Skill Strengths</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {heatmapData.slice(0, 4).map((skill: any) => (
                <div key={skill.category} className="bg-white/5 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-foreground-muted truncate">{skill.category}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-sm font-bold text-white">{skill.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={() => {
            logout();
            router.push('/');
          }} 
          className="w-full py-4 rounded-xl bg-secondary hover:bg-danger/20 text-danger-hover border border-danger/20 flex items-center justify-center gap-3 font-bold transition-all hover:scale-[1.02] active:scale-95"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
