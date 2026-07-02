"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  BookOpen,
  Zap,
  Target,
  CheckCircle2,
} from "lucide-react";
import {
  ImprovementPlan,
  PrioritizedGap,
  PriorityLevel,
  TopicInfo,
  ResolutionPath,
  ResolutionStep,
  StudyResource,
} from "@/types/analysis";

interface TechnicalAnalysisTabProps {
  plan: ImprovementPlan;
}

/**
 * Priority badge icon component - visual indicator based on priority level
 */
function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const badgeConfig = {
    [PriorityLevel.Critical]: {
      icon: AlertOctagon,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      label: "Critical",
    },
    [PriorityLevel.High]: {
      icon: AlertCircle,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      label: "High",
    },
    [PriorityLevel.Medium]: {
      icon: AlertTriangle,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      label: "Medium",
    },
    [PriorityLevel.Low]: {
      icon: Info,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      label: "Low",
    },
  };

  const config = badgeConfig[priority];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bg} border ${config.border}`}>
      <Icon size={14} className={config.color} />
      <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
    </div>
  );
}

/**
 * Topic info expandable section component
 */
function TopicInfoSection({ topicInfo }: { topicInfo: TopicInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen size={16} className="text-blue-400" />
          Topic Information
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 text-sm">
          {/* Concept */}
          <div>
            <h5 className="font-semibold text-foreground-muted uppercase text-xs mb-1">Core Concept</h5>
            <p className="text-foreground-muted leading-relaxed">{topicInfo.concept}</p>
          </div>

          {/* Sub-topics */}
          {topicInfo.subtopics && topicInfo.subtopics.length > 0 && (
            <div>
              <h5 className="font-semibold text-foreground-muted uppercase text-xs mb-2">Sub-Topics to Focus On</h5>
              <ul className="space-y-1">
                {topicInfo.subtopics.map((subtopic, idx) => (
                  <li key={idx} className="text-foreground-muted flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{subtopic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competencies */}
          {topicInfo.competencies && topicInfo.competencies.length > 0 && (
            <div>
              <h5 className="font-semibold text-foreground-muted uppercase text-xs mb-2">Key Competencies Required</h5>
              <ul className="space-y-1">
                {topicInfo.competencies.map((competency, idx) => (
                  <li key={idx} className="text-foreground-muted flex items-start gap-2">
                    <Zap size={12} className="text-emerald-400 mt-1 flex-shrink-0" />
                    <span>{competency}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pitfalls */}
          {topicInfo.pitfalls && topicInfo.pitfalls.length > 0 && (
            <div>
              <h5 className="font-semibold text-foreground-muted uppercase text-xs mb-2">Common Pitfalls to Avoid</h5>
              <ul className="space-y-1">
                {topicInfo.pitfalls.map((pitfall, idx) => (
                  <li key={idx} className="text-foreground-muted flex items-start gap-2">
                    <span className="text-red-400 mt-1">⚠</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Resolution path expandable section component
 */
function ResolutionPathSection({
  resolutionPath,
  resources,
}: {
  resolutionPath: ResolutionPath;
  resources: StudyResource[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target size={16} className="text-emerald-400" />
          Resolution Path ({resolutionPath.estimated_total_time})
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Steps */}
          {resolutionPath.steps.map((step) => (
            <div key={step.step_number} className="p-3 bg-white/5 rounded border border-border/50">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{step.step_number}</span>
                </div>
                <div className="flex-1">
                  <h6 className="font-semibold text-foreground">{step.title}</h6>
                  <p className="text-xs text-emerald-400">{step.time_estimate}</p>
                </div>
              </div>

              <p className="text-sm text-foreground-muted mb-3 ml-10 leading-relaxed">{step.description}</p>

              {/* Activities */}
              {step.activities && step.activities.length > 0 && (
                <div className="ml-10 mb-3">
                  <p className="text-xs font-semibold text-foreground-muted uppercase mb-2">Activities</p>
                  <ul className="space-y-1">
                    {step.activities.map((activity, idx) => (
                      <li key={idx} className="text-sm text-foreground-muted flex items-start gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400 mt-1 flex-shrink-0" />
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Resources list expandable section component
 */
function ResourcesSection({ resources, gapCategory }: { resources: StudyResource[]; gapCategory: string }) {
  const [expanded, setExpanded] = useState(false);

  // Filter resources that apply to this gap category
  const relevantResources = resources.filter((r) =>
    r.categories.some((cat) => cat.toLowerCase() === gapCategory.toLowerCase())
  );

  if (relevantResources.length === 0) {
    return (
      <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
        <p className="text-sm text-yellow-400/80">
          <span className="font-semibold">[Coverage Gap]</span> No resources available for this topic. Consider
          consulting community forums or requesting guidance from a mentor.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen size={16} className="text-emerald-400" />
          Related Resources ({relevantResources.length})
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {relevantResources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-white/5 border border-border/50 rounded hover:bg-white/10 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {resource.title}
                  </p>
                  {resource.author && <p className="text-xs text-foreground-muted mt-0.5">by {resource.author}</p>}
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-primary/20 text-primary rounded uppercase tracking-wider">
                    {resource.type}
                  </span>
                </div>
                <span className="text-primary group-hover:scale-110 transition-transform flex-shrink-0">↗</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual gap card component
 */
function GapCard({
  gap,
  topicInfo,
  resolutionPath,
  allResources,
}: {
  gap: PrioritizedGap;
  topicInfo?: TopicInfo;
  resolutionPath?: ResolutionPath;
  allResources: StudyResource[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-white/5 border border-border rounded-lg hover:bg-white/10 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <PriorityBadge priority={gap.priority} />
            <h3 className="text-base font-bold text-foreground">{gap.category}</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
            <span>Appeared {gap.frequency}x</span>
            <span>•</span>
            <span>Impact: {gap.impact_score}/100</span>
            <span>•</span>
            <span className="capitalize">{gap.detected_in}</span>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-foreground-muted flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {/* Topic Info Section */}
          {topicInfo && <TopicInfoSection topicInfo={topicInfo} />}

          {/* Resolution Path Section */}
          {resolutionPath && <ResolutionPathSection resolutionPath={resolutionPath} resources={allResources} />}

          {/* Resources Section */}
          <ResourcesSection resources={allResources} gapCategory={gap.category} />
        </div>
      )}
    </div>
  );
}

/**
 * TechnicalAnalysisTab - Main component
 *
 * Displays technical gaps prioritized by importance with visual indicators,
 * expandable cards showing topic info and resolution paths, and related resources.
 *
 * **Validates: Requirements 1.3, 6.2, 6.3**
 */
export const TechnicalAnalysisTab: React.FC<TechnicalAnalysisTabProps> = ({ plan }) => {
  if (!plan.technical_analysis || !plan.technical_analysis.gaps || plan.technical_analysis.gaps.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">No specific technical gaps were identified in this interview.</p>
        <p className="text-sm text-foreground-muted mt-2">Great technical performance!</p>
      </div>
    );
  }

  const gaps = plan.technical_analysis.gaps;
  const topicInfoMap = plan.technical_analysis.topic_info || {};
  const resolutionPathsMap = new Map(plan.technical_analysis.resolution_paths?.map((p) => [p.gap_category, p]) || []);
  const allResources = plan.resources_analysis?.all_resources || [];

  // Group gaps by priority for better visual organization
  const gapsByPriority = {
    [PriorityLevel.Critical]: gaps.filter((g) => g.priority === PriorityLevel.Critical),
    [PriorityLevel.High]: gaps.filter((g) => g.priority === PriorityLevel.High),
    [PriorityLevel.Medium]: gaps.filter((g) => g.priority === PriorityLevel.Medium),
    [PriorityLevel.Low]: gaps.filter((g) => g.priority === PriorityLevel.Low),
  };

  const priorityOrder = [PriorityLevel.Critical, PriorityLevel.High, PriorityLevel.Medium, PriorityLevel.Low];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/5 rounded-lg border border-border">
        <div>
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-1">Total Gaps</p>
          <p className="text-2xl font-bold text-foreground">{gaps.length}</p>
        </div>
        {gapsByPriority[PriorityLevel.Critical].length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-400 uppercase mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-400">{gapsByPriority[PriorityLevel.Critical].length}</p>
          </div>
        )}
        {gapsByPriority[PriorityLevel.High].length > 0 && (
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase mb-1">High</p>
            <p className="text-2xl font-bold text-orange-400">{gapsByPriority[PriorityLevel.High].length}</p>
          </div>
        )}
        {gapsByPriority[PriorityLevel.Medium].length > 0 && (
          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase mb-1">Medium</p>
            <p className="text-2xl font-bold text-yellow-400">{gapsByPriority[PriorityLevel.Medium].length}</p>
          </div>
        )}
      </div>

      {/* Gaps grouped by priority */}
      {priorityOrder.map((priority) => {
        const priorityGaps = gapsByPriority[priority];
        if (priorityGaps.length === 0) return null;

        const priorityLabels = {
          [PriorityLevel.Critical]: "Critical Gaps",
          [PriorityLevel.High]: "High Priority Gaps",
          [PriorityLevel.Medium]: "Medium Priority Gaps",
          [PriorityLevel.Low]: "Low Priority Gaps",
        };

        return (
          <div key={priority}>
            <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-wider mb-3">
              {priorityLabels[priority]} ({priorityGaps.length})
            </h3>
            <div className="space-y-3">
              {priorityGaps.map((gap) => (
                <GapCard
                  key={gap.category}
                  gap={gap}
                  topicInfo={topicInfoMap[gap.category]}
                  resolutionPath={resolutionPathsMap.get(gap.category)}
                  allResources={allResources}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
