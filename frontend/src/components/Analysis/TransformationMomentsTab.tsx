"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  ImprovementPlan,
} from "@/types/analysis";

interface TransformationMomentsTabProps {
  plan: ImprovementPlan;
}

/**
 * Key differences highlight component
 */
function KeyDifferencesSection({ whyBetter }: { whyBetter: string }) {
  const [expanded, setExpanded] = useState(true);

  // Parse the why_better text to find key points
  // Look for bullet points, numbered items, or key phrases
  const paragraphs = whyBetter.split("\n").filter((p) => p.trim().length > 0);

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-white/5 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-amber-400" />
          Key Differences &amp; Why It&apos;s Better
        </span>
        <ChevronDown
          size={18}
          className={`text-foreground-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {paragraphs.map((para, idx) => {
            // Check if it's a numbered or bulleted item
            const isItem =
              /^[\d\-•*]\s*/.test(para) || /^[a-z]\)\s*/.test(para);

            return (
              <div key={idx} className="flex gap-3 text-sm">
                {isItem && (
                  <span className="text-amber-400 font-bold flex-shrink-0 mt-0.5">
                    {para.match(/^[\d\-•*a-z)]+/)?.[0] || "•"}
                  </span>
                )}
                <p className="text-foreground-muted leading-relaxed">
                  {para.replace(/^[\d\-•*a-z)]\s*/, "")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Candidate response section - before/below the expert response
 */
function CandidateResponseSection({ response }: { response: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-red-500/15 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-red-400 flex items-center gap-2">
          <AlertCircle size={16} />
          Your Response
        </span>
        <ChevronDown
          size={18}
          className={`text-red-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3">
          <div className="p-3 bg-red-500/5 rounded border border-red-500/20 text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">
            &quot;{response}&quot;
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Elite response section - the expert-level answer
 */
function EliteResponseSection({ response }: { response: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-emerald-500/15 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
          <Sparkles size={16} />
          Elite-Level Response
        </span>
        <ChevronDown
          size={18}
          className={`text-emerald-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3">
          <div className="p-3 bg-emerald-500/5 rounded border border-emerald-500/20 text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">
            &quot;{response}&quot;
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Critical moment context section
 */
function CriticalMomentContext({ context }: { context: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-blue-500/15 p-2 -m-2 rounded transition-colors"
      >
        <span className="text-sm font-semibold text-blue-400 flex items-center gap-2">
          <AlertCircle size={16} />
          Critical Moment
        </span>
        <ChevronDown
          size={18}
          className={`text-blue-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-3">
          <p className="text-sm text-foreground-muted leading-relaxed">{context}</p>
        </div>
      )}
    </div>
  );
}

/**
 * TransformationMomentsTab - Main component
 *
 * Displays one critical moment from the interview where the candidate stumbled,
 * paired with:
 * - The candidate's actual response from the transcript
 * - An elite-level response showing expert-quality answer
 * - Detailed explanation of key differences
 *
 * This helps candidates understand the gap between their performance and
 * expert-level performance in a concrete, actionable way.
 *
 * **Validates: Requirements 6.4, 6.5**
 */
export const TransformationMomentsTab: React.FC<TransformationMomentsTabProps> = ({ plan }) => {
  if (!plan.transformation_analysis) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">
          No critical moments were identified in this interview.
        </p>
        <p className="text-sm text-foreground-muted mt-2">Great performance!</p>
      </div>
    );
  }

  const {
    critical_moment: context,
    candidate_original: candidateResponse,
    elite_response: eliteResponse,
    why_better: whyBetter,
  } = plan.transformation_analysis;

  if (!context || !candidateResponse || !eliteResponse || !whyBetter) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">
          No transformation moments were identified in this interview.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Sparkles size={24} className="text-amber-400" />
          Transformation Moment
        </h2>
        <p className="text-sm text-foreground-muted">
          This is a critical moment from your interview where showing expert-level thinking would have significantly
          improved your performance.
        </p>
      </div>

      {/* Critical Moment Context */}
      <CriticalMomentContext context={context} />

      {/* Response Comparison */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground-muted uppercase tracking-wider">Response Comparison</h3>

        {/* Your Response */}
        <CandidateResponseSection response={candidateResponse} />

        {/* Elite Response */}
        <EliteResponseSection response={eliteResponse} />
      </div>

      {/* Key Differences */}
      <KeyDifferencesSection whyBetter={whyBetter} />

      {/* Learning Points Summary */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Key Takeaway</p>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Focus on the differences outlined above when practicing similar questions. Record yourself answering
              similar problems using the elite-level approach, then compare your responses to identify areas for
              improvement. This deliberate practice will help you internalize expert-level thinking patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Practice Suggestion */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Practice This</p>
            <p className="text-xs text-foreground-muted leading-relaxed mb-3">
              Try answering similar questions using the elite-level framework shown above. Record your practice
              sessions and compare them to the expert response to refine your approach.
            </p>
            <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium text-sm transition-colors">
              Generate Similar Practice Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationMomentsTab;
