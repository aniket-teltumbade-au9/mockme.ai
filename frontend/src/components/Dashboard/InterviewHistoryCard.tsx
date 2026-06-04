"use client";
import React from 'react';
import { Calendar } from 'lucide-react';

interface InterviewAnalysis {
  hire_verdict?: string;
}

interface Interview {
  sessionId: string;
  created_at: string;
  analysis?: InterviewAnalysis;
  dropbox_audio_url?: string;
}

interface InterviewHistoryCardProps {
  interview: Interview;
  onViewAnalysis: (interview: Interview) => void;
  onPlayAudio: (interview: Interview) => void;
}

export const InterviewHistoryCard: React.FC<InterviewHistoryCardProps> = ({ interview, onViewAnalysis, onPlayAudio }) => {
  const date = new Date(interview.created_at).toLocaleDateString();
  const time = new Date(interview.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const verdictColor = {
      'Hire': 'text-emerald-400',
      'No Hire': 'text-rose-400',
      'Maybe': 'text-amber-400'
  }[interview.analysis?.hire_verdict as 'Hire' | 'No Hire' | 'Maybe'] || 'text-slate-400';

  return (
    <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
          <Calendar size={20} color="#6366f1" />
        </div>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{date} at {time}</h4>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Session: {interview.sessionId.substring(0, 8)}...</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verdict</p>
            <p className={verdictColor} style={{ fontWeight: 700 }}>{interview.analysis?.hire_verdict || 'Pending'}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {interview.dropbox_audio_url && (
                <button onClick={() => onPlayAudio(interview)} className="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                    Listen
                </button>
            )}
            <button onClick={() => onViewAnalysis(interview)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                View Analysis
            </button>
        </div>
      </div>
    </div>
  );
};
