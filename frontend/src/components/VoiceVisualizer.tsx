"use client";
import React, { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  isActive: boolean;
  audioSource?: MediaStream | HTMLAudioElement;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive, audioSource }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !audioSource || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode;

    if (audioSource instanceof MediaStream) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaStreamSource(audioSource);
    } else {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      source = audioContext.createMediaElementSource(audioSource);
    }

    analyser.fftSize = 256;
    source.connect(analyser);
    // We don't connect to destination to avoid feedback/loopback if it's a microphone stream
    // If it's an audio element, we might want to connect to destination to actually hear it, 
    // but for the sake of a visualizer, we just need the analyser.
    // However, if it's a microphone stream, connecting to destination would cause loud feedback.
    // So we only connect to destination if it's NOT a MediaStream (i.e. it's an audio element).
    if (!(audioSource instanceof MediaStream)) {
      analyser.connect(audioContext.destination);
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Color based on intensity
        const hue = 260 + (dataArray[i] / 255) * 40; // Transition from indigo to violet
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;

        ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContext) audioContext.close();
    };
  }, [isActive, audioSource]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      style={{
        width: "100%",
        height: "60px",
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    />
  );
};
