"use client";
import React from "react";
import {
  X,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Star,
  Code,
  MessageSquare,
} from "lucide-react";

interface CommAssessment {
  overall_score?: number;
  clarity?: number;
  structure?: number;
  conciseness?: number;
  active_listening?: number;
  confidence?: number;
  technical_vocabulary?: number;
  strengths?: string[];
  gaps?: string[];
  summary?: string;
}

interface AnalysisData {
  hire_verdict?: string;
  overall_score?: number;
  communication_assessment?: CommAssessment;
  states?: {
    tech_dive?: {
      scores?: {
        conceptual?: number;
        architectural?: number;
        communication?: number;
      };
      strengths?: string[];
      communication_observations?: string[];
    };
    coding_round?: {
      challenge?: string;
      feedback?: string;
      verbalized_approach?: boolean;
      communicated_tradeoffs?: boolean;
    };
  };
  skill_gaps?: string[];
  communication_gaps?: string[];
  recommended_topics?: string[];
  recommended_communication_improvements?: string[];
}

interface AnalysisDrawerProps {
  interview: { sessionId: string; analysis?: AnalysisData };
  onClose: () => void;
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
  const pct = ((value ?? 0) / 10) * 100;
  const color =
    (value ?? 0) >= 8 ? "#10b981" : (value ?? 0) >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#94a3b8",
          marginBottom: "3px",
        }}
      >
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value ?? "—"}/10</span>
      </div>
      <div
        style={{
          height: "5px",
          background: "rgba(255,255,255,0.07)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "3px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

export const AnalysisDrawer: React.FC<AnalysisDrawerProps> = ({
  interview,
  onClose,
}) => {
  if (!interview || !interview.analysis) return null;
  const { analysis } = interview;
  const comm = analysis.communication_assessment;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center flex-shrink-0 bg-slate-900 z-10">
        <div>
          <h2 className="text-xl font-bold">Interview Analysis</h2>
          <p className="text-sm text-slate-400">
            Session: {interview.sessionId.substring(0, 8)}…
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", padding: "0.5rem" }}
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1" style={{ paddingBottom: "3rem" }}>
        {/* Score + Verdict */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div className="glass-panel" style={{ padding: "1rem" }}>
            <p
              style={{
                fontSize: "0.7rem",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.25rem",
              }}
            >
              Overall Score
            </p>
            <div
              style={{ fontSize: "2rem", fontWeight: 900, color: "#818cf8" }}
            >
              {analysis.overall_score ?? "—"}/100
            </div>
          </div>
          <div className="glass-panel" style={{ padding: "1rem" }}>
            <p
              style={{
                fontSize: "0.7rem",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.25rem",
              }}
            >
              Verdict
            </p>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color:
                  analysis.hire_verdict === "Hire"
                    ? "#10b981"
                    : analysis.hire_verdict === "Maybe"
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {analysis.hire_verdict ?? "—"}
            </div>
          </div>
        </div>

        {/* Communication Assessment */}
        {comm && (
          <section>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#67e8f9",
              }}
            >
              <MessageSquare size={20} /> Communication Skills
            </h3>
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    color: "#67e8f9",
                  }}
                >
                  {comm.overall_score ?? "—"}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                  /100 overall
                </span>
              </div>

              <ScoreBar label="Clarity" value={comm.clarity} />
              <ScoreBar label="Structure" value={comm.structure} />
              <ScoreBar label="Conciseness" value={comm.conciseness} />
              <ScoreBar
                label="Active Listening"
                value={comm.active_listening}
              />
              <ScoreBar label="Confidence" value={comm.confidence} />
              <ScoreBar
                label="Technical Vocabulary"
                value={comm.technical_vocabulary}
              />

              {comm.summary && (
                <p
                  style={{
                    marginTop: "1rem",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    lineHeight: 1.6,
                    background: "rgba(103,232,249,0.04)",
                    border: "1px solid rgba(103,232,249,0.1)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                  }}
                >
                  {comm.summary}
                </p>
              )}

              {(comm.strengths?.length ?? 0) > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#10b981",
                      fontWeight: 600,
                      marginBottom: "0.4rem",
                    }}
                  >
                    Strengths
                  </p>
                  <ul
                    style={{
                      fontSize: "0.82rem",
                      color: "#cbd5e1",
                      paddingLeft: "1rem",
                    }}
                  >
                    {comm.strengths!.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(comm.gaps?.length ?? 0) > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#f87171",
                      fontWeight: 600,
                      marginBottom: "0.4rem",
                    }}
                  >
                    Areas to Improve
                  </p>
                  <ul
                    style={{
                      fontSize: "0.82rem",
                      color: "#fca5a5",
                      paddingLeft: "1rem",
                    }}
                  >
                    {comm.gaps!.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Technical Competency */}
        <section>
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "1rem",
              color: "#818cf8",
            }}
          >
            <TrendingUp size={20} /> Technical Competency
          </h3>
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {(["conceptual", "architectural", "communication"] as const).map(
                (k) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                      {analysis.states?.tech_dive?.scores?.[k] ?? "—"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        textTransform: "capitalize",
                      }}
                    >
                      {k}
                    </div>
                  </div>
                ),
              )}
            </div>

            {(analysis.states?.tech_dive?.strengths?.length ?? 0) > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#10b981",
                    fontWeight: 600,
                    marginBottom: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Star size={12} /> Key Strengths
                </p>
                <ul
                  style={{
                    fontSize: "0.82rem",
                    color: "#cbd5e1",
                    paddingLeft: "1rem",
                  }}
                >
                  {analysis.states!.tech_dive!.strengths!.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {(analysis.states?.tech_dive?.communication_observations?.length ??
              0) > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#67e8f9",
                    fontWeight: 600,
                    marginBottom: "0.4rem",
                  }}
                >
                  Communication Observations
                </p>
                <ul
                  style={{
                    fontSize: "0.82rem",
                    color: "#a5f3fc",
                    paddingLeft: "1rem",
                  }}
                >
                  {analysis.states!.tech_dive!.communication_observations!.map(
                    (o, i) => (
                      <li key={i}>{o}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Coding Round */}
        {analysis.states?.coding_round && (
          <section>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#fbbf24",
              }}
            >
              <Code size={20} /> Coding Performance
            </h3>
            <div className="glass-panel" style={{ padding: "1.25rem" }}>
              {analysis.states.coding_round.challenge && (
                <div
                  style={{
                    background: "#020617",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: "1rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "#818cf8",
                      fontWeight: 700,
                      marginBottom: "0.4rem",
                      letterSpacing: "0.08em",
                    }}
                  >
                    CHALLENGE
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#94a3b8",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{analysis.states.coding_round.challenge}&rdquo;
                  </p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  fontSize: "0.8rem",
                }}
              >
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: analysis.states.coding_round.verbalized_approach
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)",
                    color: analysis.states.coding_round.verbalized_approach
                      ? "#10b981"
                      : "#f87171",
                    border: `1px solid ${analysis.states.coding_round.verbalized_approach ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  {analysis.states.coding_round.verbalized_approach ? "✓" : "✗"}{" "}
                  Verbalized approach
                </span>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: analysis.states.coding_round
                      .communicated_tradeoffs
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)",
                    color: analysis.states.coding_round.communicated_tradeoffs
                      ? "#10b981"
                      : "#f87171",
                    border: `1px solid ${analysis.states.coding_round.communicated_tradeoffs ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  {analysis.states.coding_round.communicated_tradeoffs
                    ? "✓"
                    : "✗"}{" "}
                  Communicated trade-offs
                </span>
              </div>

              {analysis.states.coding_round.feedback && (
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      marginBottom: "0.4rem",
                      color: "#94a3b8",
                    }}
                  >
                    Sarah&apos;s Feedback
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#cbd5e1",
                      background: "rgba(255,255,255,0.03)",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      lineHeight: 1.6,
                    }}
                  >
                    {analysis.states.coding_round.feedback}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Skill Gaps */}
        {(analysis.skill_gaps?.length ?? 0) > 0 && (
          <section>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#f87171",
              }}
            >
              <AlertTriangle size={20} /> Technical Gaps
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {analysis.skill_gaps!.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    padding: "0.6rem 0.9rem",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    color: "#fca5a5",
                  }}
                >
                  {gap}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Communication Gaps */}
        {(analysis.communication_gaps?.length ?? 0) > 0 && (
          <section>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#fb923c",
              }}
            >
              <MessageSquare size={20} /> Communication Gaps
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {analysis.communication_gaps!.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(251,146,60,0.05)",
                    border: "1px solid rgba(251,146,60,0.2)",
                    padding: "0.6rem 0.9rem",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    color: "#fdba74",
                  }}
                >
                  {gap}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended Topics */}
        {(analysis.recommended_topics?.length ?? 0) > 0 && (
          <section>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#10b981",
              }}
            >
              <Lightbulb size={20} /> Recommended Prep Topics
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {analysis.recommended_topics!.map((topic, i) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    color: "#6ee7b7",
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Communication Improvements */}
        {(analysis.recommended_communication_improvements?.length ?? 0) > 0 && (
          <section>
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "#67e8f9",
              }}
            >
              <MessageSquare size={20} /> Communication Improvements
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {analysis.recommended_communication_improvements!.map(
                (item, i) => (
                  <span
                    key={i}
                    style={{
                      background: "rgba(103,232,249,0.07)",
                      border: "1px solid rgba(103,232,249,0.2)",
                      padding: "3px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      color: "#a5f3fc",
                    }}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
