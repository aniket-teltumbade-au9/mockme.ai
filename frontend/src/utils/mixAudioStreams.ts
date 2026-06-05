/**
 * Web Audio mixer for interview recording.
 *
 * Instead of relying on getDisplayMedia (unreliable for capturing TTS output),
 * we route the interviewer's TTS audio through an AudioContext node so it is
 * directly mixed with the mic before reaching MediaRecorder.
 *
 * Usage:
 *   const ctx = await createRecordingContext();
 *   // pass ctx.micStream to MediaRecorder via ctx.mixedStream
 *   // call ctx.playInterviewerAudio(mp3Bytes) to play + record Sarah's voice
 *   // call ctx.dispose() when recording stops
 */

export interface RecordingContext {
  mixedStream: MediaStream;
  playInterviewerAudio: (audioBytes: ArrayBuffer) => Promise<void>;
  dispose: () => Promise<void>;
}

export async function createRecordingContext(): Promise<RecordingContext> {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  const audioContext = new AudioContextClass();

  // Create destination for recording
  const destination = audioContext.createMediaStreamDestination();
  
  // Gain nodes for volume balancing
  const micGain = audioContext.createGain();
  micGain.gain.value = 1.0;
  const ttsGain = audioContext.createGain();
  ttsGain.gain.value = 1.2; // Slightly boost TTS

  // Connect Gains
  micGain.connect(destination);
  ttsGain.connect(destination);
  ttsGain.connect(audioContext.destination); // Play TTS to speakers

  // Track active TTS sources for proper cleanup
  const activeSources = new Set<AudioBufferSourceNode>();

  // ── Mic ──────────────────────────────────────────────────────────────────
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const micSource = audioContext.createMediaStreamSource(micStream);
  micSource.connect(micGain);

  // ── Interviewer TTS player ───────────────────────────────────────────────
  const playInterviewerAudio = async (audioBytes: ArrayBuffer): Promise<void> => {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const decoded = await audioContext.decodeAudioData(audioBytes.slice(0));
    const source = audioContext.createBufferSource();
    source.buffer = decoded;
    source.connect(ttsGain);

    activeSources.add(source);
    
    return new Promise((resolve) => {
      source.onended = () => {
        activeSources.delete(source);
        resolve();
      };
      source.start(0);
    });
  };

  const mixedStream = destination.stream;

  const dispose = async (): Promise<void> => {
    // Stop all active sources
    activeSources.forEach(s => {
        try { s.stop(); } catch {}
        s.disconnect();
    });
    activeSources.clear();

    micSource.disconnect();
    micStream.getTracks().forEach(t => t.stop());
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  };

  return { mixedStream, playInterviewerAudio, dispose };
}
