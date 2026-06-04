"use client";
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isSpeaking: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isSpeaking }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !stream) return;

    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      if (stream && !isSpeaking) {
        analyser.getByteFrequencyData(dataArray);
      } else if (isSpeaking) {
        // Simulate AI voice activity for "feel"
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.random() * 150 * (Math.sin(Date.now() / 100 + i / 5) * 0.5 + 0.5);
        }
      } else {
        dataArray.fill(0);
      }

      ctx.fillStyle = 'rgb(2, 6, 23)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = isSpeaking ? `rgb(59, 130, 246)` : `rgb(16, 185, 129)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [stream, isSpeaking]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" width={600} height={300} />
      <div className={`status-indicator ${isSpeaking ? 'status-speaking' : stream ? 'status-listening' : 'status-idle'}`}>
        {isSpeaking ? 'AI Speaking' : stream ? 'Listening' : 'Idle'}
      </div>
    </div>
  );
};
