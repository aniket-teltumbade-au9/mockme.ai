"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Network,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import {
  ImprovementPlan,
  GapRelationship,
} from "@/types/analysis";

interface HolisticViewTabProps {
  plan: ImprovementPlan;
}

/**
 * Gap relationship card component - shows connection between technical and communication gaps
 */
function GapRelationshipCard({ relationship }: { relationship: GapRelationship }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-white/5 border border-border rounded-lg hover:bg-white/10 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">
              Technical
            </span>
            <span className="text-foreground-muted">{relationship.tech_gap}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-400">
              Communication
            </span>
            <span className="text-foreground-muted">{relationship.comm_gap}</span>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-foreground-muted flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-start gap-3">
            <TrendingUp size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Connection</p>
              <p className="text-sm text-foreground-muted leading-relaxed">{relationship.connection}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Recommended sequence section - shows order to address gaps
 */
function RecommendedSequenceSection({ sequence }: { sequence: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sequence || sequence.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" />
          Recommended Improvement Sequence
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {sequence.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{idx + 1}</span>
              </div>
              <p className="text-sm text-foreground-muted leading-relaxed pt-0.5">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Action checklist section - grouped by timeline
 */
function ActionChecklistSection({
  checklist,
}: {
  checklist: Array<{
    timeline: string;
    items: string[];
  }>;
}) {
  const [expandedTimeline, setExpandedTimeline] = useState<string | null>(checklist[0]?.timeline || null);

  if (!checklist || checklist.length === 0) {
    return null;
  }

  // Map timeline to icon
  const getTimelineIcon = (timeline: string) => {
    if (timeline.toLowerCase().includes("week") && timeline.toLowerCase().includes("this")) {
      return <Clock size={16} className="text-emerald-400" />;
    }
    if (timeline.toLowerCase().includes("week") && timeline.toLowerCase().includes("next")) {
      return <Calendar size={16} className="text-amber-400" />;
    }
    return <TrendingUp size={16} className="text-blue-400" />;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-wider">
        Weekly Action Checklist
      </h3>
      {checklist.map((timelineGroup) => (
        <div key={timelineGroup.timeline} className="p-4 bg-white/5 rounded-lg border border-border">
          <button
            onClick={() =>
              setExpandedTimeline(
                expandedTimeline === timelineGroup.timeline ? null : timelineGroup.timeline
              )
            }
            className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
          >
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              {getTimelineIcon(timelineGroup.timeline)}
              {timelineGroup.timeline}
            </span>
            <ChevronDown
              size={18}
              className={`text-foreground-muted transition-transform ${
                expandedTimeline === timelineGroup.timeline ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedTimeline === timelineGroup.timeline && (
            <div className="mt-3 space-y-2 pl-2">
              {timelineGroup.items && timelineGroup.items.length > 0 ? (
                timelineGroup.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 rounded border-border bg-white/5 text-primary cursor-pointer"
                      disabled
                    />
                    <span className="text-foreground-muted leading-relaxed">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-foreground-muted italic">No items available</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Integrated guidance section
 */
function IntegratedGuidanceSection({ guidance }: { guidance: string }) {
  const [expanded, setExpanded] = useState(true);

  if (!guidance) {
    return null;
  }

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertCircle size={16} className="text-blue-400" />
          Integrated Guidance
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3">
          <p className="text-sm text-foreground-muted leading-relaxed">{guidance}</p>
        </div>
      )}
    </div>
  );
}

/**
 * HolisticViewTab - Main component
 *
 * Displays the comprehensive holistic view of all gaps, showing:
 * - Gap relationships (how technical and communication gaps relate)
 * - Recommended sequence for addressing gaps
 * - Weekly action checklist organized by priority and timeline
 * - Integrated guidance on improvement approach
 *
 * **Validates: Requirements 4.2, 4.3, 6.1, 6.4**
 */
export const HolisticViewTab: React.FC<HolisticViewTabProps> = ({ plan }) => {
  if (!plan.holistic_guidance) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">Holistic guidance is not available for this interview.</p>
      </div>
    );
  }

  const {
    gap_relationships,
    recommended_sequence,
    action_checklist,
    integrated_guidance,
  } = plan.holistic_guidance;

  const hasRelationships = gap_relationships && gap_relationships.length > 0;
  const hasSequence = recommended_sequence && recommended_sequence.length > 0;
  const hasChecklist = action_checklist && action_checklist.length > 0;
  const hasGuidance = integrated_guidance && integrated_guidance.length > 0;

  if (!hasRelationships && !hasSequence && !hasChecklist && !hasGuidance) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">No holistic guidance needed for this interview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integrated Guidance - Display first */}
      {hasGuidance && <IntegratedGuidanceSection guidance={integrated_guidance} />}

      {/* Gap Relationships */}
      {hasRelationships && (
        <div>
          <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Network size={16} className="text-blue-400" />
            Gap Relationships
          </h3>
          <p className="text-sm text-foreground-muted mb-4">
            Your technical and communication gaps are interconnected. Addressing root causes first will have
            cascading benefits:
          </p>
          <div className="space-y-3">
            {gap_relationships.map((relationship, idx) => (
              <GapRelationshipCard key={idx} relationship={relationship} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Sequence */}
      {hasSequence && <RecommendedSequenceSection sequence={recommended_sequence} />}

      {/* Action Checklist */}
      {hasChecklist && <ActionChecklistSection checklist={action_checklist} />}

      {/* Summary */}
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Your Holistic Improvement Plan</p>
            <p className="text-xs text-foreground-muted leading-relaxed">
              This holistic view shows how your gaps interconnect and the optimal sequence for addressing them.
              Start with gaps marked as &quot;This Week&quot; priorities and work through your action checklist systematically.
              Each improvement builds on previous progress and strengthens your overall interview performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolisticViewTab;
