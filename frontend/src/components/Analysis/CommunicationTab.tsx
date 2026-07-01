"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Zap,
  MessageSquare,
  Mic,
  CheckCircle2,
  Quote,
} from "lucide-react";
import {
  ImprovementPlan,
  CommunicationGap,
  PriorityLevel,
} from "@/types/analysis";

interface CommunicationTabProps {
  plan: ImprovementPlan;
}

/**
 * Severity badge component - visual indicator based on severity level
 */
function SeverityBadge({ severity }: { severity: PriorityLevel }) {
  const badgeConfig = {
    [PriorityLevel.Critical]: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      label: "Critical",
    },
    [PriorityLevel.High]: {
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      label: "High",
    },
    [PriorityLevel.Medium]: {
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      label: "Medium",
    },
    [PriorityLevel.Low]: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      label: "Low",
    },
  };

  const config = badgeConfig[severity];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bg} border ${config.border}`}>
      <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
    </div>
  );
}

/**
 * Improvement tips section component
 */
function ImprovementTipsSection({ tips }: { tips: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap size={16} className="text-emerald-400" />
          Improvement Tips ({tips.length})
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <span className="text-emerald-400 font-bold flex-shrink-0 mt-0.5">
                {idx + 1}.
              </span>
              <p className="text-foreground-muted leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Before/after comparison section component
 */
function BeforeAfterSection({
  candidateResponse,
  improvedResponse,
}: {
  candidateResponse: string;
  improvedResponse: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          Before & After Example
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Before */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Quote size={14} className="text-red-400/60" />
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Your Response</p>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-foreground-muted leading-relaxed italic">
              &quot;{candidateResponse}&quot;
            </div>
          </div>

          {/* After */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Quote size={14} className="text-emerald-400/60" />
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Improved Response</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-sm text-foreground-muted leading-relaxed italic">
              &quot;{improvedResponse}&quot;
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Practice prompts section component
 */
function PracticePromptsSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          Practice
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-foreground-muted">
            Practice addressing this communication gap with a mock question:
          </p>
          <button className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <MessageSquare size={16} />
            Generate Practice Prompt
          </button>
          <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <Mic size={16} />
            Record Your Response
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Related tactic section component
 */
function RelatedTacticSection({
  tactic,
}: {
  tactic: {
    tactic_name: string;
    description: string;
    example: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          Related Tactic: {tactic.tactic_name}
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-foreground-muted leading-relaxed">{tactic.description}</p>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Example</p>
            <p className="text-foreground-muted text-xs leading-relaxed">{tactic.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual communication gap card component
 */
function CommunicationGapCard({ gap }: { gap: CommunicationGap }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-white/5 border border-border rounded-lg hover:bg-white/10 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={gap.severity} />
            <h3 className="text-base font-bold text-foreground">{gap.category}</h3>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">{gap.description}</p>
        </div>
        <ChevronDown
          size={20}
          className={`text-foreground-muted flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
          {/* Improvement Tips */}
          {gap.improvement_tips && gap.improvement_tips.length > 0 && (
            <ImprovementTipsSection tips={gap.improvement_tips} />
          )}

          {/* Before/After */}
          <BeforeAfterSection
            candidateResponse={gap.candidate_response}
            improvedResponse={gap.sample_improved_response}
          />

          {/* Practice */}
          <PracticePromptsSection />

          {/* Related Tactic */}
          {gap.related_tactic && <RelatedTacticSection tactic={gap.related_tactic} />}
        </div>
      )}
    </div>
  );
}

/**
 * Communication category badge component
 */
function CategoryScoreBadge({
  category,
  score,
}: {
  category: string;
  score: number;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-red-400 bg-red-500/10 border-red-500/30";
  };

  return (
    <div className={`p-3 rounded-lg border ${getScoreColor(score)} text-center`}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1">{category}</p>
      <p className="text-lg font-bold">{score}/100</p>
    </div>
  );
}

/**
 * CommunicationTab - Main component
 *
 * Displays communication gaps categorized by type (Clarity, Structure, Conciseness,
 * Active Listening, Confidence, Technical Vocabulary) with improvement tips,
 * before/after examples, practice prompts, and recording links.
 *
 * **Validates: Requirements 3.3, 6.1, 6.4**
 */
export const CommunicationTab: React.FC<CommunicationTabProps> = ({ plan }) => {
  if (
    !plan.communication_analysis ||
    !plan.communication_analysis.gaps ||
    plan.communication_analysis.gaps.length === 0
  ) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">No communication gaps were identified in this interview.</p>
        <p className="text-sm text-foreground-muted mt-2">Excellent communication skills!</p>
      </div>
    );
  }

  const gaps = plan.communication_analysis.gaps;
  const categoryScores = plan.communication_analysis.category_scores || {};

  // Group gaps by category for better organization
  const gapsByCategory: Record<string, CommunicationGap[]> = {};
  gaps.forEach((gap) => {
    if (!gapsByCategory[gap.category]) {
      gapsByCategory[gap.category] = [];
    }
    gapsByCategory[gap.category].push(gap);
  });

  const categoryOrder = [
    "Clarity",
    "Structure",
    "Conciseness",
    "Active Listening",
    "Confidence",
    "Technical Vocabulary",
  ];

  // Sort gaps by severity within each category
  const sortedCategories = categoryOrder.filter((cat) => gapsByCategory[cat]);
  const gapsToDisplay = sortedCategories.flatMap((cat) =>
    gapsByCategory[cat].sort((a, b) => {
      const severityOrder = {
        Critical: 0,
        High: 1,
        Medium: 2,
        Low: 3,
      };
      return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    })
  );

  return (
    <div className="space-y-6">
      {/* Communication Scores - Grid of category scores */}
      {Object.keys(categoryScores).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-wider mb-3">
            Communication Scores by Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categoryOrder.map((category) => {
              const key = category.toLowerCase().replace(/\s+/g, "_");
              const score = categoryScores[key as keyof typeof categoryScores];
              if (score === undefined) return null;

              return (
                <CategoryScoreBadge
                  key={category}
                  category={category}
                  score={score}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/5 rounded-lg border border-border">
        <div>
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-1">Total Gaps</p>
          <p className="text-2xl font-bold text-foreground">{gaps.length}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-400 uppercase mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-400">
            {gaps.filter((g) => g.severity === PriorityLevel.Critical).length}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-orange-400 uppercase mb-1">High</p>
          <p className="text-2xl font-bold text-orange-400">
            {gaps.filter((g) => g.severity === PriorityLevel.High).length}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase mb-1">Medium+Low</p>
          <p className="text-2xl font-bold text-yellow-400">
            {gaps.filter((g) => g.severity === PriorityLevel.Medium || g.severity === PriorityLevel.Low).length}
          </p>
        </div>
      </div>

      {/* Communication Gap Cards */}
      <div className="space-y-4">
        {gapsToDisplay.map((gap, idx) => (
          <CommunicationGapCard key={`${gap.category}-${idx}`} gap={gap} />
        ))}
      </div>
    </div>
  );
};

export default CommunicationTab;
