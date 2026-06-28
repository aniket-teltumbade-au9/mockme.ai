"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, CheckCircle2, AlertCircle, Zap, Loader2 } from "lucide-react";
import axios from "axios";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { SkillHeatmap } from "./SkillHeatmap";

interface SessionData {
  session_id: string;
  created_at: string;
  gaps: string[];
  resolved_gaps: string[];
  performance_score: number;
  hire_verdict?: string;
}

interface ProgressData {
  total_interviews: number;
  sessions: SessionData[];
  average_performance_score: number;
  gaps_resolved_count: number;
  total_gaps_identified: number;
}

export const ProgressDashboard: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ category: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const [res, heatmapRes] = await Promise.all([
          axios.get(`${API_BASE}/user/progress/detailed`, { headers: authHeaders() }),
          axios.get(`${API_BASE}/user/progress/heatmap`, { headers: authHeaders() })
        ]);
        
        setProgressData(res.data);
        setHeatmapData(heatmapRes.data.data);
        setError(null);
      } catch (err) {
        setError("Failed to load progress data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const chartData = useMemo(() => {
    if (!progressData) return [];
    return progressData.sessions.map((session, idx) => ({
      day: `Day ${idx + 1}`,
      score: session.performance_score,
      gapCount: session.gaps.length,
      resolved: session.resolved_gaps.length,
      date: new Date(session.created_at).toLocaleDateString(),
    }));
  }, [progressData]);

  const improvementRate = useMemo(() => {
    if (!progressData || progressData.total_interviews <= 1) return 0;
    return Math.round(
      ((progressData.gaps_resolved_count / progressData.total_gaps_identified) * 100) || 0
    );
  }, [progressData]);

  if (loading)
    return (
      <div className="p-8 text-center text-foreground-muted">
        <Loader2 className="animate-spin mx-auto mb-2" />
        Loading progress dashboard...
      </div>
    );

  if (error || !progressData)
    return (
      <div className="p-8 text-center text-danger">
        {error || "No data available"}
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap size={24} />}
          label="Total Interviews"
          value={progressData.total_interviews}
          color="text-indigo-400"
        />
        <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Gaps Resolved"
          value={progressData.gaps_resolved_count}
          color="text-emerald-400"
        />
        <StatCard
          icon={<AlertCircle size={24} />}
          label="Gaps Identified"
          value={progressData.total_gaps_identified}
          color="text-amber-400"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Improvement Rate"
          value={`${improvementRate}%`}
          color="text-cyan-400"
        />
      </div>

      {/* Skill Heatmap Section */}
      <div className="bg-white/5 border border-border rounded-xl p-6">
        <h3 className="text-base font-semibold mb-4">Skill Proficiency Heatmap</h3>
        <div className="min-h-[300px]">
          <SkillHeatmap data={heatmapData} />
        </div>
      </div>

      {/* Performance Score Trend */}
      {chartData.length > 0 && (
        <div className="bg-white/5 border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Performance Score Trend</h3>
          <div className="h-[300px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#818cf8"
                  strokeWidth={2}
                  name="Performance Score"
                  dot={{ fill: "#818cf8", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gap Resolution Chart */}
      {chartData.length > 0 && (
        <div className="bg-white/5 border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Gaps per Session</h3>
          <div className="h-[300px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="gapCount" fill="#f59e0b" name="Gaps Found" />
                <Bar dataKey="resolved" fill="#10b981" name="Gaps Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session Timeline */}
      {progressData.sessions.length > 0 && (
        <div className="bg-white/5 border border-border rounded-xl p-6 space-y-6">
          <h3 className="text-base font-semibold">Session History</h3>
          <div className="flex flex-col gap-3">
            {progressData.sessions.map((session, idx) => (
              <SessionCard key={session.session_id} session={session} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {progressData.sessions.length === 0 && (
        <div className="py-12 text-center bg-white/5 rounded-xl border border-dashed border-border">
          <p className="text-foreground-muted">No interview sessions yet. Start an interview to begin tracking progress!</p>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div className="bg-white/5 border border-border rounded-xl p-6 flex flex-col gap-3">
    <div className={`${color} opacity-80`}>{icon}</div>
    <div className="text-sm text-foreground-muted">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

interface SessionCardProps {
  session: SessionData;
  index: number;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, index }) => {
  const date = new Date(session.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white/5 border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
      <div className="text-sm">
        <div className="text-foreground-muted">Session {index + 1}</div>
        <div className="font-medium">{date}</div>
      </div>

      <div className="text-sm">
        <div className="text-foreground-muted">Score</div>
        <div className={`text-lg font-semibold ${session.performance_score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
          {session.performance_score.toFixed(1)}%
        </div>
      </div>

      <div className="text-sm">
        <div className="text-foreground-muted">Gaps</div>
        <div className="space-y-0.5">
          <div className="flex justify-between sm:block">
            <span>Found:</span>
            <span className="font-semibold text-amber-400 sm:inline">{session.gaps.length}</span>
          </div>
          <div className="flex justify-between sm:block">
            <span>Resolved:</span>
            <span className="font-semibold text-emerald-400 sm:inline">{session.resolved_gaps.length}</span>
          </div>
        </div>
      </div>

      {session.hire_verdict && (
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold text-center ${
            session.hire_verdict === "HIRE" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {session.hire_verdict}
        </div>
      )}
    </div>
  );
};
