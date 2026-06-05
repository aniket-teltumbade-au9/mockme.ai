import { useRef, useState, useCallback } from "react";
import {
  createRecordingContext,
  RecordingContext,
} from "@/utils/mixAudioStreams";

export interface UseInterviewRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  /** Play interviewer TTS bytes — recorded into the session audio automatically */
  playInterviewerAudio: (audioBytes: ArrayBuffer) => Promise<void>;
  recordingState: "idle" | "recording" | "stopped";
}

export const useInterviewRecorder = (): UseInterviewRecorderReturn => {
  const [recordingState, setRecordingState] = useState<
    "idle" | "recording" | "stopped"
  >("idle");
  const recordingStateRef = useRef<"idle" | "recording" | "stopped">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recCtxRef = useRef<RecordingContext | null>(null);
  // Track ongoing audio playback to prevent overlaps or issues
  const audioPlaybackRef = useRef<Promise<void>>(Promise.resolve());

  const setRecState = (s: "idle" | "recording" | "stopped") => {
    recordingStateRef.current = s;
    setRecordingState(s);
  };

  const startRecording = useCallback(async () => {
    console.log("DEBUG: startRecording called. Current state:", recordingStateRef.current);
    audioChunksRef.current = [];

    // Tear down any previous context
    if (recCtxRef.current) {
      console.log("DEBUG: Disposing previous recording context.");
      await recCtxRef.current.dispose();
      recCtxRef.current = null;
    }

    try {
      console.log("DEBUG: Creating new recording context...");
      const recCtx = await createRecordingContext();
      recCtxRef.current = recCtx;
      console.log("DEBUG: Recording context created.");

      // Robust codec negotiation
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";
      console.log("DEBUG: Selected MIME type:", mimeType);

      const recorder = new MediaRecorder(
        recCtx.mixedStream,
        mimeType ? { mimeType } : undefined,
      );

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data);
      };

      // Flush chunks every 5 seconds to reduce data loss risk on crash
      recorder.start(5000); 
      mediaRecorderRef.current = recorder;
      setRecState("recording");
      console.log("DEBUG: Recorder started. State set to:", recordingStateRef.current);
    } catch (err) {
      console.error("Failed to start session recorder:", err);
      setRecState("idle");
      throw err;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        recordingStateRef.current !== "recording"
      ) {
        console.warn(
          "stopRecording called but recorder was not active — returning empty blob",
        );
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (recCtxRef.current) {
          await recCtxRef.current.dispose();
          recCtxRef.current = null;
        }

        setRecState("stopped");
        resolve(finalBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  /**
   * Play interviewer TTS audio and simultaneously record it into the session.
   * If recorder is not active, waits for it to become active, ensuring audio is captured.
   */
  const playInterviewerAudio = useCallback(
    async (audioBytes: ArrayBuffer): Promise<void> => {
      console.log('DEBUG: Queuing interviewer audio...');
      // Chain playback to ensure serial execution
      audioPlaybackRef.current = audioPlaybackRef.current.then(async () => {
        // Wait until recording context is initialized
        // This is only okay if startRecording HAS been called.
        // If it hasn't, this loop will hang forever.
        // We need a way to check if recording is actually intended.
        while (!recCtxRef.current) {
          if (recordingStateRef.current === 'idle') {
             console.log('DEBUG: Recording is idle, aborting wait.');
             return;
          }
          console.log('DEBUG: Waiting for recording context...');
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        console.log('DEBUG: Invoking playInterviewerAudio...');
        await recCtxRef.current.playInterviewerAudio(audioBytes);
        console.log('DEBUG: playInterviewerAudio finished.');
      });
      return audioPlaybackRef.current;
    },
    [],
  );

  return {
    startRecording,
    stopRecording,
    playInterviewerAudio,
    recordingState,
  };
};
