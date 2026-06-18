"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, RotateCcw } from 'lucide-react';

interface AudioPlayerModalProps {
  audioUrl: string;
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ audioUrl, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Convert Dropbox share link to direct download/stream link
  const streamingUrl = audioUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?dl=1');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, []);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" style={{ zIndex: 100 }}>
      <div className="glass-panel" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        position: 'relative',
        margin: '1rem',
        padding: '1.5rem'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            background: 'transparent', 
            padding: '0.5rem',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Close"
        >
            <X size={20} />
        </button>
        
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Interview Recording</h3>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 800, 
              color: 'var(--primary)', 
              marginBottom: '0.5rem',
              minWidth: '120px'
            }}>
                {formatTime(currentTime)}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>of {formatTime(duration)}</div>
        </div>

        <audio ref={audioRef} src={streamingUrl} onEnded={() => setIsPlaying(false)} />

        <div className="flex justify-center items-center gap-4" style={{ flexWrap: 'wrap' }}>
            <button 
              onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10 }} 
              className="secondary" 
              style={{ 
                borderRadius: '50%', 
                width: '50px', 
                height: '50px', 
                padding: '0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '44px',
                minWidth: '44px'
              }}
              aria-label="Rewind 10 seconds"
            >
                <RotateCcw size={20} />
            </button>
            <button 
              onClick={togglePlayback} 
              style={{ 
                borderRadius: '50%', 
                width: '70px', 
                height: '70px', 
                padding: '0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '60px',
                minWidth: '60px',
                background: 'var(--primary)'
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={28} /> : <Play size={28} fill="white" />}
            </button>
            <div style={{ width: '50px' }}></div>
        </div>

        <div style={{ marginTop: '2rem', width: '100%', height: '8px', background: 'var(--secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--primary)', 
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              transition: 'width 0.2s ease'
            }}></div>
        </div>
      </div>
    </div>
  );
};
