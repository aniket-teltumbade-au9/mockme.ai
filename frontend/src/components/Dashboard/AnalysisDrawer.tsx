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
    (value ?? 0) >= 8 ? "bg-emerald-400" : (value ?? 0) >= 5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="mb-2">
      <div
        className="flex justify-between text-[0.75rem] text-foreground-muted mb-1"
      >
        <span>{label}</span>
        <span className={`${color.replace('bg-', 'text-')} font-bold`}>{value ?? "—"}/10</span>
      </div>
      <div
        className="h-1.5 bg-white/10 rounded-full overflow-hidden"
      >
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
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
      <div className="fixed inset-0 right-0 z-[100] w-full max-w-[640px] bg-background/95 backdrop-blur-xl border-l border-border p-8 overflow-y-auto shadow-2xl">
        <button className="p-2 hover:bg-secondary rounded-full transition-colors mb-4" onClick={onClose}>
          <X size={24} />
        </button>
        <p className="text-foreground-muted">No analysis available for this interview.</p>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-y-0 right-0 z-[100] w-full max-w-[640px] bg-background-alt border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
    >
      {/* Header */}
      <div 
        className="p-5 border-b border-border flex justify-between items-center bg-white/5 backdrop-blur-md sticky top-0 z-10"
      >
        <div>
          <h2 className="text-xl font-black">Interview Analysis</h2>
          <p className="text-xs text-foreground-muted font-mono">
            Session ID: {interview.sessionId.substring(0, 12)}...
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          aria-label="Close analysis"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex flex-col gap-8">
          {/* Hire Verdict */}
          {analysis.hire_verdict && (
            <section>
              <h3 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wider">Hire Verdict</h3>
              <div className="p-4 rounded-xl bg-white/5 border border-border">
                <span className="text-xl font-black">{analysis.hire_verdict}</span>
              </div>
            </section>
          )}

          {/* Overall Score */}
          {analysis.overall_score && (
            <section>
              <h3 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wider">Overall Score</h3>
              <div className="text-5xl font-black text-primary">{analysis.overall_score}/100</div>
            </section>
          )}

          {/* Communication Assessment */}
          {analysis.communication_assessment && (
            <section>
              <h3 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wider">Communication Assessment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <ScoreBar label="Clarity" value={analysis.communication_assessment.clarity} />
                <ScoreBar label="Structure" value={analysis.communication_assessment.structure} />
                <ScoreBar label="Conciseness" value={analysis.communication_assessment.conciseness} />
                <ScoreBar label="Confidence" value={analysis.communication_assessment.confidence} />
              </div>
              {analysis.communication_assessment.summary && (
                <p className="mt-4 text-sm text-foreground-muted leading-relaxed">{analysis.communication_assessment.summary}</p>
              )}
            </section>
          )}

          {/* Tech Dive */}
          {analysis.states?.tech_dive && (
            <section>
              <h3 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wider">Technical Deep Dive</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{analysis.states.tech_dive.summary}</p>
            </section>
          )}

          {/* Coding Round */}
          {analysis.states?.coding_round && (
            <section>
              <h3 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wider">Coding Round</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{analysis.states.coding_round.feedback}</p>
            </section>
          )}

          {/* Before/After Transformation */}
          {analysis.transformations && (
            <section className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-primary uppercase tracking-wider">🎯 Elite Answer Transformation</h3>
              <div className="mb-6">
                <div className="text-xs font-bold text-foreground-muted mb-2 uppercase">Critical Moment:</div>
                <p className="text-sm text-foreground font-italic italic">{analysis.transformations.critical_moment}</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="text-xs font-bold text-red-400 mb-2 uppercase">❌ Your Original Response:</div>
                  <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-sm text-foreground-muted max-h-48 overflow-y-auto leading-relaxed">
                    {analysis.transformations.candidate_original}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-400 mb-2 uppercase">✅ Elite Staff-Level Response:</div>
                  <div className="p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl text-sm text-foreground-muted max-h-48 overflow-y-auto leading-relaxed">
                    {analysis.transformations.elite_response}
                  </div>
                </div>
              </div>

              {analysis.transformations.why_better && (
                <div className="mt-6 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
                  <div className="text-xs font-bold text-blue-400 mb-1 uppercase">Why This Is Better:</div>
                  <p className="text-sm text-foreground-muted leading-relaxed">{analysis.transformations.why_better}</p>
                </div>
              )}
            </section>
          )}

          {/* Behavioral STAR Analysis */}
          {analysis.behavioral_star_analysis && analysis.behavioral_star_analysis.length > 0 && (
            <section className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-purple-400 uppercase tracking-wider">🧠 Behavioral STAR Analysis</h3>
              <div className="flex flex-col gap-8">
                {analysis.behavioral_star_analysis.map((item: BehavioralStarItem, idx: number) => (
                  <div key={idx} className={`pb-6 ${idx < analysis.behavioral_star_analysis.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="text-base font-bold text-foreground mb-4">{item.question}</div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: 'Situation', value: item.scores.situation },
                        { label: 'Task', value: item.scores.task },
                        { label: 'Action', value: item.scores.action },
                        { label: 'Result', value: item.scores.result },
                      ].map((s, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-xs text-foreground-muted">
                          {s.value ? <CheckCircle2 size={14} className="text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-red-400" />}
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-foreground-muted mb-4 leading-relaxed">{item.feedback}</p>
                    
                    {item.tutor_tip && (
                      <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl">
                        <div className="text-xs font-bold text-blue-400 mb-1 uppercase">Tutor Tip:</div>
                        <p className="text-sm text-foreground-muted leading-relaxed">{item.tutor_tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tactical Execution Strategies */}
          {analysis.remediation_plan?.tactical_strategies && analysis.remediation_plan.tactical_strategies.length > 0 && (
            <section className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-blue-400 uppercase tracking-wider">🛠️ Tactical Execution Strategies</h3>
              <p className="text-sm text-foreground-muted mb-6">Step-by-step approach for handling similar problems next time:</p>
              
              {analysis.remediation_plan.tactical_strategies.map((item: TacticalStrategy, idx: number) => (
                <div key={idx} className={`mb-8 pb-8 ${idx < analysis.remediation_plan!.tactical_strategies.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="text-base font-bold text-blue-400 mb-4">{item.gap}</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-foreground-muted mb-1 uppercase">Step 1 — Clarification:</div>
                      <p className="text-sm text-foreground-muted leading-relaxed">{item.strategy.step_1_clarification}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground-muted mb-1 uppercase">Step 2 — Approach:</div>
                      <p className="text-sm text-foreground-muted leading-relaxed">{item.strategy.step_2_approach}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground-muted mb-1 uppercase">Step 3 — Iterate:</div>
                      <p className="text-sm text-foreground-muted leading-relaxed">{item.strategy.step_3_iterate}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground-muted mb-1 uppercase">Step 4 — Pressure Test:</div>
                      <p className="text-sm text-foreground-muted leading-relaxed">{item.strategy.step_4_pressure_test}</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Behavioral Adjustment Tools */}
          {analysis.remediation_plan?.behavioral_tactics && analysis.remediation_plan.behavioral_tactics.length > 0 && (
            <section className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-amber-400 uppercase tracking-wider">🧠 Behavioral Adjustment Tools</h3>
              <p className="text-sm text-foreground-muted mb-6">Specific techniques to improve your communication:</p>

              <div className="flex flex-col gap-4">
                {analysis.remediation_plan.behavioral_tactics.map((tactic: BehavioralTactic, idx: number) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm font-bold text-amber-400 mb-2">{tactic.tactic_name}</div>
                    <p className="text-sm text-foreground-muted mb-3 leading-relaxed">{tactic.description}</p>
                    {tactic.example && (
                      <p className="text-xs text-foreground-muted/60 italic">{tactic.example}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Resources */}
          {analysis.remediation_plan?.resources && analysis.remediation_plan.resources.length > 0 && (
            <section className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-emerald-400 uppercase tracking-wider">📚 Recommended Topics & Resources</h3>
              <div className="flex flex-col gap-4">
                {analysis.remediation_plan.resources.map((resource: Resource, idx: number) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-emerald-400 mb-1">
                          {resource.url ? (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-emerald-400 underline-offset-4">
                              {resource.title} ↗
                            </a>
                          ) : (
                            resource.title
                          )}
                        </div>
                        {resource.author && (
                          <div className="text-xs text-foreground-muted mb-2">by {resource.author}</div>
                        )}
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded uppercase tracking-wider">
                          {resource.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Communication Improvements */}
          {analysis.recommended_communication_improvements && analysis.recommended_communication_improvements.length > 0 && (
            <section className="p-5 bg-pink-500/10 border border-pink-500/20 rounded-2xl">
              <h3 className="text-sm font-bold mb-4 text-pink-400 uppercase tracking-wider">💡 Communication Improvements</h3>
              <div className="flex flex-col gap-3">
                {analysis.recommended_communication_improvements.map((improvement: string, idx: number) => (
                  <div key={idx} className="p-4 bg-white/5 border-l-4 border-pink-500 rounded-r-xl">
                    <div className="text-sm text-foreground-muted leading-relaxed">• {improvement}</div>
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
