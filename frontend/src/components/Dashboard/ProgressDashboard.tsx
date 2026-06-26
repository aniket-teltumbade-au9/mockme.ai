"use client";
import React, { useState, useEffect } from "react";
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
import { TrendingUp, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import axios from "axios";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { SkillHeatmap } from "./SkillHeatmap"; // Import the new component

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

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--foreground-muted)" }}>
        Loading progress dashboard...
      </div>
    );

  if (error || !progressData)
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--danger)" }}>
        {error || "No data available"}
      </div>
    );

  // Prepare chart data
  const chartData = progressData.sessions.map((session, idx) => ({
    day: `Day ${idx + 1}`,
    score: session.performance_score,
    gapCount: session.gaps.length,
    resolved: session.resolved_gaps.length,
    date: new Date(session.created_at).toLocaleDateString(),
  }));

  // Gap improvement rate
  const improvementRate =
    progressData.total_interviews > 1
      ? Math.round(
          ((progressData.gaps_resolved_count / progressData.total_gaps_identified) * 100) || 0
        )
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
      {/* Header Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard
          icon={<Zap size={24} />}
          label="Total Interviews"
          value={progressData.total_interviews}
          color="#818cf8"
        />
        <StatCard
          icon={<CheckCircle2 size={24} />}
          label="Gaps Resolved"
          value={progressData.gaps_resolved_count}
          color="#10b981"
        />
        <StatCard
          icon={<AlertCircle size={24} />}
          label="Gaps Identified"
          value={progressData.total_gaps_identified}
          color="#f59e0b"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Improvement Rate"
          value={`${improvementRate}%`}
          color="#06b6d4"
        />
      </div>

      {/* Skill Heatmap Section */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Skill Proficiency Heatmap</h3>
        <SkillHeatmap data={heatmapData} />
      </div>

      {/* Performance Score Trend */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Performance Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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
      )}

      {/* Gap Resolution Chart */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Gaps per Session
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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
      )}

      {/* Session Timeline */}
      {progressData.sessions.length > 0 && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Session History
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {progressData.sessions.map((session, idx) => (
              <SessionCard key={session.session_id} session={session} index={idx} />
            ))}
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", marginTop: "2rem" }}>
            Progress Over Time
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <LineChart
              width={500}
              height={300}
              data={progressData.sessions}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="created_at" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="performance_score" stroke="#8884d8" />
            </LineChart>
          </div>
        </div>
      )}

      {/* Empty State */}
      {progressData.sessions.length === 0 && (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            color: "var(--foreground-muted)",
          }}
        >
          <p>No interview sessions yet. Start an interview to begin tracking progress!</p>
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
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}
  >
    <div style={{ color, opacity: 0.8 }}>{icon}</div>
    <div style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>{label}</div>
    <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "white" }}>{value}</div>
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
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "1rem",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr auto",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>Session {index + 1}</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{date}</div>
      </div>

      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>Score</div>
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: session.performance_score >= 70 ? "#10b981" : "#f59e0b",
          }}
        >
          {session.performance_score.toFixed(1)}%
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>Gaps</div>
        <div>
          <div style={{ fontSize: "0.9rem" }}>
            Found: <span style={{ color: "#f59e0b", fontWeight: 600 }}>{session.gaps.length}</span>
          </div>
          <div style={{ fontSize: "0.9rem" }}>
            Resolved: <span style={{ color: "#10b981", fontWeight: 600 }}>{session.resolved_gaps.length}</span>
          </div>
        </div>
      </div>

      {session.hire_verdict && (
        <div
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            background: session.hire_verdict === "HIRE" ? "#10b98124" : "#f5940b24",
            color: session.hire_verdict === "HIRE" ? "#10b981" : "#f59e0b",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {session.hire_verdict}
        </div>
      )}
    </div>
  );
};
