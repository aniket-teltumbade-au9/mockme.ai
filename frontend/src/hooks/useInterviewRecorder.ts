import { useRef, useState, useCallback } from "react";

export interface UseInterviewRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  recordingState: "idle" | "recording" | "stopped";
}

export const useInterviewRecorder = (): UseInterviewRecorderReturn => {
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "stopped"
  >("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(type => MediaRecorder.isTypeSupported(type)) || "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(); 
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");
    } catch (err) {
      console.error("Failed to start recorder:", err);
      setRecordingState("idle");
      throw err;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Clean up stream
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        setRecordingState("stopped");
        resolve(finalBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  return {
    startRecording,
    stopRecording,
    recordingState,
  };
};
