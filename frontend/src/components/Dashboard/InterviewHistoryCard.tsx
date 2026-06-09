"use client";
import React from 'react';
import { Calendar, Clock, Play, FileText, ChevronRight, Loader2 } from 'lucide-react';

interface InterviewAnalysis {
  hire_verdict?: string;
}

interface Interview {
  sessionId: string;
  created_at: string;
  analysis?: InterviewAnalysis;
  dropbox_audio_url?: string;
  finalized?: boolean;
  finalization_error?: string;
}

interface InterviewHistoryCardProps {
  interview: Interview;
  onViewAnalysis: (interview: Interview) => void;
  onPlayAudio: (interview: Interview) => void;
  onRetryFinalize?: (interview: Interview) => void;
}

export const InterviewHistoryCard: React.FC<InterviewHistoryCardProps> = ({ 
  interview, 
  onViewAnalysis, 
  onPlayAudio,
  onRetryFinalize 
}) => {
  const dateObj = new Date(interview.created_at);
  const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const isFinished = interview.finalized === true && !!interview.analysis?.hire_verdict;
  const isPending = !isFinished && !interview.finalization_error;
  const hasError = !!interview.finalization_error || (!isFinished && !isPending);
  
  const verdict = isFinished 
    ? interview.analysis!.hire_verdict 
    : (hasError ? 'Failed' : 'Processing');
  
  const verdictStyles = {
      'Hire': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', dot: '#10b981' },
      'No Hire': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', dot: '#ef4444' },
      'Maybe': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', dot: '#f59e0b' },
      'Processing': { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', dot: '#6366f1', animate: true },
      'Failed': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', dot: '#ef4444' }
  }[verdict as 'Hire' | 'No Hire' | 'Maybe' | 'Processing' | 'Failed'] || { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', dot: '#94a3b8' };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '1.25rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        cursor: 'default',
        opacity: isPending ? 0.8 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', 
          padding: '0.85rem', 
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(99, 102, 241, 0.1)'
        }}>
          <Calendar size={20} color="var(--primary)" />
        </div>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>{date}</h4>
            <span style={{ color: 'var(--border-bright)', fontSize: '0.8rem' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
              <Clock size={14} />
              {time}
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-geist-mono)' }}>
            ID: {interview.sessionId.substring(0, 8)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.4rem 0.8rem', 
          background: verdictStyles.bg, 
          borderRadius: '20px',
          border: `1px solid ${verdictStyles.bg}`
        }}>
          {isPending ? (
            <Loader2 className="animate-spin" size={12} color="var(--primary)" />
          ) : (
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: verdictStyles.dot }} />
          )}
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: verdictStyles.text,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            {verdict}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            {interview.dropbox_audio_url && isFinished && (
                <button 
                  onClick={() => onPlayAudio(interview)} 
                  className="secondary" 
                  style={{ 
                    padding: '0.5rem', 
                    borderRadius: 'var(--radius-sm)',
                    width: '36px',
                    height: '36px'
                  }}
                  title="Play Recording"
                >
                    <Play size={16} fill="currentColor" />
                </button>
            )}
            
            {isFinished ? (
                <button 
                  onClick={() => onViewAnalysis(interview)} 
                  style={{ 
                    padding: '0.5rem 1.25rem', 
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                    Analysis
                    <ChevronRight size={16} />
                </button>
            ) : (
                <div style={{ width: '100px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    {isPending ? 'Syncing...' : 'Incomplete'}
                </div>
            )}

            {!isFinished && onRetryFinalize && (
                <button 
                  onClick={() => onRetryFinalize(interview)}
                  className="secondary"
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    borderColor: isPending ? 'var(--primary)' : 'var(--danger)',
                    color: isPending ? 'var(--primary)' : 'var(--danger)'
                  }}
                >
                    {isPending ? 'Refinalize' : 'Retry'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
