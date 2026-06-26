"use client";
import React from "react";
import {
  X,
  CheckCircle2,
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

interface Transformation {
  critical_moment?: string;
  candidate_original?: string;
  elite_response?: string;
  why_better?: string;
}

interface TacticalStrategy {
  gap: string;
  strategy: {
    step_1_clarification: string;
    step_2_approach: string;
    step_3_iterate: string;
    step_4_pressure_test: string;
  };
}

interface BehavioralTactic {
  tactic_name: string;
  description: string;
  example: string;
}

interface Resource {
  title: string;
  author?: string;
  type: string;
  url: string;
}

interface StarScores {
  situation?: boolean;
  task?: boolean;
  action?: boolean;
  result?: boolean;
}

interface BehavioralStarItem {
  question?: string;
  scores: StarScores;
  feedback?: string;
  tutor_tip?: string;
}

interface AnalysisData {
  behavioral_star_analysis: BehavioralStarItem[];
  hire_verdict?: string;
  overall_score?: number;
  communication_assessment?: CommAssessment;
  transformations?: Transformation;
  remediation_plan?: {
    summary: string;
    tactical_strategies: TacticalStrategy[];
    behavioral_tactics: BehavioralTactic[];
    resources: Resource[];
    gaps_addressed: string[];
  };
  states?: {
    tech_dive?: {
      scores?: {
        conceptual?: number;
        architectural?: number;
        communication?: number;
      };
      summary?: number;
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
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        width: '100%',
        maxWidth: '640px',
        background: 'var(--background-alt)',
        borderLeft: '1px solid var(--border)',
        padding: '2rem',
        overflowY: 'auto'
      }}>
        <button className="secondary" onClick={onClose} style={{ marginBottom: '1rem' }}>
          <X size={20} /> Close
        </button>
        <p style={{ color: 'var(--foreground-muted)' }}>No analysis available for this interview.</p>
      </div>
    );
  }

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
          padding: '1.25rem 1.5rem',
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Interview Analysis</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-geist-mono)' }}>
            Session ID: {interview.sessionId.substring(0, 12)}...
          </p>
        </div>
        <button
          onClick={onClose}
          className="secondary"
          style={{ 
            background: "transparent", 
            padding: "0.5rem", 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close analysis"
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ 
        padding: '1.5rem', 
        overflowY: 'auto', 
        flex: 1,
        maxHeight: 'calc(100vh - 120px)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hire Verdict */}
          {analysis.hire_verdict && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Hire Verdict</h3>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{analysis.hire_verdict}</span>
              </div>
            </section>
          )}

          {/* Overall Score */}
          {analysis.overall_score && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Overall Score</h3>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{analysis.overall_score}/100</div>
            </section>
          )}

          {/* Communication Assessment */}
          {analysis.communication_assessment && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Communication Assessment</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <ScoreBar label="Clarity" value={analysis.communication_assessment.clarity} />
                <ScoreBar label="Structure" value={analysis.communication_assessment.structure} />
                <ScoreBar label="Conciseness" value={analysis.communication_assessment.conciseness} />
                <ScoreBar label="Confidence" value={analysis.communication_assessment.confidence} />
              </div>
              {analysis.communication_assessment.summary && (
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>{analysis.communication_assessment.summary}</p>
              )}
            </section>
          )}

          {/* Tech Dive */}
          {analysis.states?.tech_dive && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Technical Deep Dive</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>{analysis.states.tech_dive.summary}</p>
            </section>
          )}

          {/* Coding Round */}
          {analysis.states?.coding_round && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--foreground)' }}>Coding Round</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)' }}>{analysis.states.coding_round.feedback}</p>
            </section>
          )}

          {/* Before/After Transformation */}
          {analysis.transformations && (
            <section style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: '#d8b4fe' }}>🎯 Elite Answer Transformation</h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>Critical Moment:</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', fontStyle: 'italic' }}>{analysis.transformations.critical_moment}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.5rem' }}>❌ Your Original Response:</div>
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    color: 'var(--foreground-muted)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {analysis.transformations.candidate_original}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#86efac', marginBottom: '0.5rem' }}>✅ Elite Staff-Level Response:</div>
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    color: 'var(--foreground-muted)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {analysis.transformations.elite_response}
                  </div>
                </div>
              </div>

              {analysis.transformations.why_better && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.5rem', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.5rem' }}>Why This Is Better:</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>{analysis.transformations.why_better}</p>
                </div>
              )}
            </section>
          )}

          {/* Behavioral STAR Analysis */}
          {analysis.behavioral_star_analysis && analysis.behavioral_star_analysis.length > 0 && (
            <section style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: '#d8b4fe' }}>🧠 Behavioral STAR Analysis</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {analysis.behavioral_star_analysis.map((item: BehavioralStarItem, idx: number) => (
                  <div key={idx} style={{ paddingBottom: '1.5rem', borderBottom: idx < analysis.behavioral_star_analysis.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.75rem' }}>{item.question}</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      {[
                        { label: 'Situation', value: item.scores.situation },
                        { label: 'Task', value: item.scores.task },
                        { label: 'Action', value: item.scores.action },
                        { label: 'Result', value: item.scores.result },
                      ].map((s, sIdx) => (
                        <div key={sIdx} style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {s.value ? <CheckCircle2 size={14} color="#86efac" /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #ef4444' }} />}
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>{item.feedback}</p>
                    
                    {item.tutor_tip && (
                      <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', borderLeft: '3px solid #3b82f6' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.25rem' }}>Tutor Tip:</div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', lineHeight: '1.4' }}>{item.tutor_tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tactical Execution Strategies */}
          {analysis.remediation_plan?.tactical_strategies && analysis.remediation_plan.tactical_strategies.length > 0 && (
            <section style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: '#93c5fd' }}>🛠️ Tactical Execution Strategies</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginBottom: '1rem' }}>Step-by-step approach for handling similar problems next time:</p>
              
              {analysis.remediation_plan.tactical_strategies.map((item: TacticalStrategy, idx: number) => (
                <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: idx < analysis.remediation_plan!.tactical_strategies.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.75rem' }}>{item.gap}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Step 1 — Clarification:</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginLeft: '0.5rem' }}>{item.strategy.step_1_clarification}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Step 2 — Approach:</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginLeft: '0.5rem' }}>{item.strategy.step_2_approach}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Step 3 — Iterate:</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginLeft: '0.5rem' }}>{item.strategy.step_3_iterate}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>Step 4 — Pressure Test:</div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginLeft: '0.5rem' }}>{item.strategy.step_4_pressure_test}</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Behavioral Adjustment Tools */}
          {analysis.remediation_plan?.behavioral_tactics && analysis.remediation_plan.behavioral_tactics.length > 0 && (
            <section style={{ padding: '1rem', background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: '#fdba74' }}>🧠 Behavioral Adjustment Tools</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginBottom: '1rem' }}>Specific techniques to improve your communication:</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysis.remediation_plan.behavioral_tactics.map((tactic: BehavioralTactic, idx: number) => (
                  <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fdba74', marginBottom: '0.5rem' }}>{tactic.tactic_name}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', lineHeight: '1.4', marginBottom: '0.5rem' }}>{tactic.description}</p>
                    {tactic.example && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', lineHeight: '1.3', fontStyle: 'italic', opacity: 0.8 }}>{tactic.example}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Resources */}
          {analysis.remediation_plan?.resources && analysis.remediation_plan.resources.length > 0 && (
            <section style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: '#86efac' }}>📚 Recommended Topics & Resources</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analysis.remediation_plan.resources.map((resource: Resource, idx: number) => (
                  <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem', borderLeft: '2px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#86efac', marginBottom: '0.25rem' }}>
                          {resource.url ? (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color: '#86efac', textDecoration: 'none' }}>
                              {resource.title} ↗
                            </a>
                          ) : (
                            resource.title
                          )}
                        </div>
                        {resource.author && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', marginBottom: '0.25rem' }}>by {resource.author}</div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', opacity: 0.7 }}>
                          <span style={{ 
                            padding: '2px 6px', 
                            background: 'rgba(16, 185, 129, 0.15)', 
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontWeight: 600
                          }}>
                            {resource.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Communication Improvements */}
          {analysis.recommended_communication_improvements && analysis.recommended_communication_improvements.length > 0 && (
            <section style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: '#f472b6' }}>💡 Communication Improvements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analysis.recommended_communication_improvements.map((improvement: string, idx: number) => (
                  <div key={idx} style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem', borderLeft: '2px solid #ec4899' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', lineHeight: '1.4' }}>• {improvement}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};