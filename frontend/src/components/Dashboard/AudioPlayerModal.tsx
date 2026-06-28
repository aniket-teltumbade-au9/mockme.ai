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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-[500px] relative m-4 p-6">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-transparent p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
            <X size={20} />
        </button>
        
        <h3 className="mb-6 text-[1.1rem] font-semibold">Interview Recording</h3>
        
        <div className="text-center mb-8">
            <div className="text-4xl font-extrabold text-primary mb-2 min-w-[120px]">
                {formatTime(currentTime)}
            </div>
            <div className="text-slate-400 text-sm">of {formatTime(duration)}</div>
        </div>

        <audio ref={audioRef} src={streamingUrl} onEnded={() => setIsPlaying(false)} />

        <div className="flex justify-center items-center gap-4 flex-wrap">
            <button 
              onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10 }} 
              className="secondary rounded-full w-[50px] h-[50px] p-0 flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label="Rewind 10 seconds"
            >
                <RotateCcw size={20} />
            </button>
            <button 
              onClick={togglePlayback} 
              className="rounded-full w-[70px] h-[70px] p-0 flex items-center justify-center min-h-[60px] min-w-[60px] bg-primary"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={28} /> : <Play size={28} fill="white" />}
            </button>
            <div className="w-[50px]"></div>
        </div>

        <div className="mt-8 w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};
