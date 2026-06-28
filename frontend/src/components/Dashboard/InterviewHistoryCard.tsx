"use client";
import React, { useState } from 'react';
import { Play, FileText, ChevronRight, Loader2, RotateCcw, TrendingUp } from 'lucide-react';
import { RetryModal } from './RetryModal';
import { InterviewRecord } from '@/types/interview';
import { IconButton } from '../elements/icon-button';
import { TextButton } from '../elements/text-button';

interface InterviewHistoryCardProps {
  interview: InterviewRecord;
  onViewAnalysis: (interview: InterviewRecord) => void;
  onPlayAudio: (interview: InterviewRecord) => void;
  onViewTranscript: (interview: InterviewRecord) => void;
  onRetryFinalize?: (interview: InterviewRecord) => void;
  onRetryStarted?: (newSessionId: string, focusGaps: string[]) => void;
}
type Verdict = 'Hire' | 'No Hire' | 'Maybe' | 'Processing' | 'Failed';
 
const VERDICT_STYLES: Record<Verdict, {
  bar: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  dot: string;
}> = {
  'Hire':       { bar: 'bg-emerald-500', pillBg: 'bg-emerald-500/10', pillBorder: 'border-emerald-500/30', pillText: 'text-emerald-400', dot: 'bg-emerald-500' },
  'No Hire':    { bar: 'bg-red-500',     pillBg: 'bg-red-500/10',     pillBorder: 'border-red-500/30',     pillText: 'text-red-400',     dot: 'bg-red-500'     },
  'Maybe':      { bar: 'bg-amber-400',   pillBg: 'bg-amber-400/10',   pillBorder: 'border-amber-400/30',   pillText: 'text-amber-400',   dot: 'bg-amber-400'   },
  'Processing': { bar: 'bg-primary',     pillBg: 'bg-primary/10',     pillBorder: 'border-primary/30',     pillText: 'text-primary',     dot: 'bg-primary'     },
  'Failed':     { bar: 'bg-red-500',     pillBg: 'bg-red-500/10',     pillBorder: 'border-red-500/30',     pillText: 'text-red-400',     dot: 'bg-red-500'     },
};
export const InterviewHistoryCard: React.FC<InterviewHistoryCardProps> = ({ 
  interview, 
  onViewAnalysis, 
  onPlayAudio,
  onViewTranscript,
  onRetryFinalize,
  onRetryStarted
}) => {
  const [showRetryModal, setShowRetryModal] = useState(false);

  const dateObj = new Date(interview.created_at);
  const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isFinished = interview.finalized === true && !!interview.analysis?.hire_verdict;
  const isPending = !isFinished && !interview.finalization_error;
  const hasError = !!interview.finalization_error || (!isFinished && !isPending);

 const verdict: Verdict = isFinished
    ? (interview.analysis!.hire_verdict as Verdict)
    : hasError ? 'Failed' : 'Processing';

  const detectedGaps = interview.analysis?.skill_gaps || [];
  const hasGaps = detectedGaps.length > 0;
  
  const s = VERDICT_STYLES[verdict] ?? VERDICT_STYLES['Processing'];

  return (
    <>
      {/* Card Wrapper with enhanced polish & shadow lift on hover */}
      <div className="flex rounded-xl border border-white/[0.06] overflow-hidden mb-3 hover:border-white/[0.15] hover:shadow-lg hover:shadow-black/20 transition-all duration-200 bg-gradient-to-r from-neutral-900/90 to-neutral-900/50 backdrop-blur-md group">
 
        {/* Verdict visual indicator bar */}
        <div className={`w-[4px] shrink-0 self-stretch ${s.bar} opacity-80 group-hover:opacity-100 transition-opacity`} />
 
        {/* Main Content Body */}
        <div className="flex items-center gap-6 flex-1 px-5 py-4 min-w-0">
 
          {/* Refined Date & Time Layout */}
          <div className="shrink-0 w-28 flex flex-col gap-0.5">
            <p className="text-xs font-bold text-slate-200 tracking-wide uppercase">{date}</p>
            <p className="text-[11px] text-slate-400/80 font-medium tracking-normal">{time}</p>
          </div>
 
          {/* Verdict Badge with a cleaner pill profile */}
          <div className={`
            shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border
            text-[10px] font-extrabold uppercase tracking-widest
            ${s.pillBg} ${s.pillBorder} ${s.pillText} backdrop-blur-sm
          `}>
            {isPending
              ? <Loader2 size={10} className="animate-spin" />
              : <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shadow-sm animate-pulse`} />
            }
            {verdict}
          </div>
 
          {/* Skill Gaps or Status Micro-Copy */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0 px-2">
            {isFinished && hasGaps && detectedGaps.map((gap) => (
              <span
                key={gap}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:border-white/[0.15] transition-colors whitespace-nowrap shadow-inner"
              >
                {gap}
              </span>
            ))}
            {isPending && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 italic font-medium">
                <Loader2 size={12} className="animate-spin text-primary" />
                <span>Syncing analysis…</span>
              </div>
            )}
            {isFinished && !hasGaps && (
              <span className="text-[11px] text-slate-500 italic font-medium">No performance gaps detected</span>
            )}
          </div>
 
          {/* Action Row — Structured Clean Interactive Controls */}
          <div className="shrink-0 flex items-center gap-2">
            {interview.dropbox_audio_url && isFinished && (
              <IconButton 
                onClick={() => onPlayAudio(interview)} 
                title="Play recording"
              >
                <Play size={13} fill="currentColor" />
              </IconButton>
            )}
 
            {isFinished && (
              <IconButton 
                onClick={() => onViewTranscript(interview)} 
                title="View transcript"
              >
                <FileText size={13} />
              </IconButton>
            )}
 
            {hasGaps && isFinished && (
              <TextButton 
                onClick={() => setShowRetryModal(true)}
              >
                <RotateCcw size={11} className="text-slate-400" />
                Retry
              </TextButton>
            )}
 
            {!interview.dropbox_audio_url && onRetryFinalize && (
              <TextButton 
                onClick={() => onRetryFinalize(interview)}
              >
                Retry upload
              </TextButton>
            )}
 
            <TextButton 
              onClick={() => console.log('progress')}
            >
              <TrendingUp size={11} className="text-slate-400" />
              Progress
            </TextButton>
 
            {isFinished ? (
              <button
                onClick={() => onViewAnalysis(interview)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-primary/10 active:scale-[0.98]"
              >
                Analysis
                <ChevronRight size={13} className="ml-0.5 opacity-90" />
              </button>
            ) : (
              /* Balanced spacer layout rule integrity */
              <div className="w-[86px]" />
            )}
          </div>
        </div>
      </div>
 
      {showRetryModal && hasGaps && (
        <RetryModal
          sessionId={interview.sessionId}
          gaps={detectedGaps}
          onClose={() => setShowRetryModal(false)}
          onRetryStarted={(newSessionId, focusGaps) => {
            onRetryStarted?.(newSessionId, focusGaps);
          }}
        />
      )}
    </>
  );;
};

