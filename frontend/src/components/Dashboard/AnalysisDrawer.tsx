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
            margin: '1rem'
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
        {/* Content would go here - keeping existing structure but with mobile fixes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hire Verdict */}
          {analysis.hire_verdict && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>
                Hire Verdict
              </h3>
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: analysis.hire_verdict === 'Hire' 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : analysis.hire_verdict === 'No Hire'
                  ? 'rgba(239, 68, 68, 0.08)' 
                  : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${analysis.hire_verdict === 'Hire' 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : analysis.hire_verdict === 'No Hire'
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(245, 158, 11, 0.2)'}`
              }}>
                <p style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 800,
                  color: analysis.hire_verdict === 'Hire' 
                    ? '#10b981' 
                    : analysis.hire_verdict === 'No Hire'
                    ? '#ef4444' 
                    : '#f59e0b'
                }}>
                  {analysis.hire_verdict}
                </p>
              </div>
            </section>
          )}

          {/* Overall Score */}
          {analysis.overall_score && (
            <section>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>
                Overall Score
              </h3>
              <div style={{ position: 'relative', paddingTop: '0.5rem' }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    strokeDasharray={`${analysis.overall_score * 3.6} 283`}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    {analysis.overall_score}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)' }}>out of 10</div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
