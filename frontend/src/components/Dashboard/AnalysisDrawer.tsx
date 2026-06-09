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
  Loader2,
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
  if (!interview) return null;
  const analysis = interview.analysis;
  
  if (!analysis) {
    return (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            width: '100%',
            maxWidth: '600px',
            background: 'var(--background-alt)',
            borderLeft: '1px solid var(--border)',
            boxShadow: '-10px 0 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <h2 style={{ fontSize: '1.5rem' }}>Loading Analysis...</h2>
            <p style={{ color: 'var(--foreground-muted)' }}>The AI is still processing your results.</p>
            <button className="secondary" onClick={onClose} style={{ marginTop: '2rem' }}>Close</button>
        </div>
    )
  }

  const comm = analysis.communication_assessment;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        width: '100%',
        maxWidth: '640px',
        background: 'var(--background-alt)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-10px 0 50px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      {/* Header */}
      <div 
        style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Interview Analysis</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-geist-mono)' }}>
            Session ID: {interview.sessionId.substring(0, 12)}...
          </p>
        </div>
        <button
          onClick={onClose}
          className="secondary"
          style={{ background: "transparent", padding: "0.5rem", borderRadius: '50%', width: '40px', height: '40px' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Score + Verdict */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <div className="glass-panel" style={{ padding: "1.5rem", background: 'rgba(255,255,255,0.02)' }}>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--foreground-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Overall Score
            </p>
            <div
              style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--primary)" }}
            >
              {analysis.overall_score ?? "—"}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/100</span>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: "1.5rem", background: 'rgba(255,255,255,0.02)' }}>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--foreground-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 700,
                marginBottom: "0.5rem",
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
                    ? "var(--accent)"
                    : analysis.hire_verdict === "Maybe"
                      ? "var(--warning)"
                      : "var(--danger)",
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
                gap: "0.6rem",
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                color: "var(--primary)",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <MessageSquare size={20} /> Communication Skills
            </h3>
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                  paddingBottom: "1.25rem",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: 900,
                    color: "var(--foreground)",
                  }}
                >
                  {comm.overall_score ?? "—"}
                </span>
                <span style={{ color: "var(--foreground-muted)", fontSize: "0.9rem", fontWeight: 500 }}>
                  /100 score
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x 1.5rem' }}>
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
              </div>

              {comm.summary && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    fontSize: "0.9rem",
                    color: "var(--foreground-muted)",
                    lineHeight: 1.6,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    fontStyle: 'italic'
                  }}
                >
                  &ldquo;{comm.summary}&rdquo;
                </div>
              )}

              {(comm.strengths?.length ?? 0) > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--accent)",
                      fontWeight: 800,
                      marginBottom: "0.75rem",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Key Strengths
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {comm.strengths!.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                          <span style={{ color: 'var(--accent)' }}>•</span>
                          <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(comm.gaps?.length ?? 0) > 0 && (
                <div style={{ marginTop: "1.25rem" }}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--danger)",
                      fontWeight: 800,
                      marginBottom: "0.75rem",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Areas for Growth
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {comm.gaps!.map((g, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                          <span style={{ color: 'var(--danger)' }}>•</span>
                          <span>{g}</span>
                      </div>
                    ))}
                  </div>
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
              gap: "0.6rem",
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
              color: "var(--primary)",
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <TrendingUp size={20} /> Technical Competency
          </h3>
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem",
                paddingBottom: "1.25rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {(["conceptual", "architectural", "communication"] as const).map(
                (k) => (
                  <div key={k} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.75rem", fontWeight: 900, color: 'var(--foreground)' }}>
                      {analysis.states?.tech_dive?.scores?.[k] ?? "—"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--foreground-muted)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}
                    >
                      {k}
                    </div>
                  </div>
                ),
              )}
            </div>

            {(analysis.states?.tech_dive?.strengths?.length ?? 0) > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--accent)",
                    fontWeight: 800,
                    marginBottom: "0.75rem",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Star size={12} /> Key Technical Strengths
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.states!.tech_dive!.strengths!.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                        <span style={{ color: 'var(--accent)' }}>•</span>
                        <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(analysis.states?.tech_dive?.communication_observations?.length ??
              0) > 0 && (
              <div style={{ marginTop: "1rem", padding: '1rem', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--primary)",
                    fontWeight: 800,
                    marginBottom: "0.5rem",
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Technical Communication
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {analysis.states!.tech_dive!.communication_observations!.map(
                    (o, i) => (
                      <div key={i} style={{ fontSize: '0.82rem', color: 'var(--foreground-muted)' }}>{o}</div>
                    ),
                  )}
                </div>
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
                gap: "0.6rem",
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                color: "var(--warning)",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <Code size={20} /> Coding Performance
            </h3>
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              {analysis.states.coding_round.challenge && (
                <div
                  style={{
                    background: "var(--background)",
                    padding: "1.25rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--primary)",
                      fontWeight: 800,
                      marginBottom: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: 'uppercase'
                    }}
                  >
                    Challenge Overview
                  </p>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--foreground-muted)",
                      lineHeight: 1.5,
                      fontWeight: 500
                    }}
                  >
                    &ldquo;{analysis.states.coding_round.challenge}&rdquo;
                  </p>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: analysis.states.coding_round.verbalized_approach
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(239, 68, 68, 0.08)",
                    color: analysis.states.coding_round.verbalized_approach
                      ? "var(--accent)"
                      : "var(--danger)",
                    border: `1px solid ${analysis.states.coding_round.verbalized_approach ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {analysis.states.coding_round.verbalized_approach ? "✓" : "✗"}{" "}
                  Verbalized approach
                </div>
                <div
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: analysis.states.coding_round.communicated_tradeoffs
                      ? "rgba(16, 185, 129, 0.08)"
                      : "rgba(239, 68, 68, 0.08)",
                    color: analysis.states.coding_round.communicated_tradeoffs
                      ? "var(--accent)"
                      : "var(--danger)",
                    border: `1px solid ${analysis.states.coding_round.communicated_tradeoffs ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {analysis.states.coding_round.communicated_tradeoffs ? "✓" : "✗"}{" "}
                  Communicated trade-offs
                </div>
              </div>

              {analysis.states.coding_round.feedback && (
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      marginBottom: "0.5rem",
                      color: "var(--foreground-muted)",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Evaluator Feedback
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--foreground)",
                      background: "rgba(255,255,255,0.02)",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
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
                gap: "0.6rem",
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                color: "var(--danger)",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <AlertTriangle size={20} /> Identified Gaps
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {analysis.skill_gaps!.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(239, 68, 68, 0.03)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    padding: "0.85rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    color: "var(--foreground)",
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: 'var(--danger)', fontWeight: 900 }}>•</span>
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
                gap: "0.6rem",
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                color: "var(--warning)",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <MessageSquare size={20} /> Communication Gaps
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {analysis.communication_gaps!.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(245, 158, 11, 0.03)",
                    border: "1px solid rgba(245, 158, 11, 0.15)",
                    padding: "0.85rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    color: "var(--foreground)",
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ color: 'var(--warning)', fontWeight: 900 }}>•</span>
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
                gap: "0.6rem",
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                color: "var(--accent)",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <Lightbulb size={20} /> Recommended Topics
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {analysis.recommended_topics!.map((topic, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    color: "var(--accent)",
                    fontWeight: 700
                  }}
                >
                  {topic}
                </div>
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
                gap: "0.6rem",
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "1.25rem",
                color: "var(--primary)",
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <MessageSquare size={20} /> Improvements
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {analysis.recommended_communication_improvements!.map(
                (item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      color: "var(--primary)",
                      fontWeight: 700
                    }}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
