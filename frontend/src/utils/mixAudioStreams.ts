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
  /** Feed this stream directly into MediaRecorder — contains mixed mic + interviewer audio */
  mixedStream: MediaStream;
  /**
   * Decode and play interviewer TTS audio bytes (MP3/WebM from the backend).
   * The audio is simultaneously routed into the recording and played through
   * the speaker so the user can hear it.
   * Returns a Promise that resolves when playback finishes.
   */
  playInterviewerAudio: (audioBytes: ArrayBuffer) => Promise<void>;
  /** Tear down the Web Audio graph and stop all owned tracks */
  dispose: () => Promise<void>;
}

export async function createRecordingContext(): Promise<RecordingContext> {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  const audioContext = new AudioContextClass();

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Single destination — MediaRecorder reads from this
  const destination = audioContext.createMediaStreamDestination();

  // ── Mic ──────────────────────────────────────────────────────────────────
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const micSource = audioContext.createMediaStreamSource(micStream);
  micSource.connect(destination);

  // ── Interviewer TTS player ───────────────────────────────────────────────
  // Each call decodes the MP3 bytes, plays them through the speaker AND
  // routes them into the recording destination simultaneously.
  const playInterviewerAudio = (audioBytes: ArrayBuffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Copy the buffer — decodeAudioData detaches it on some browsers
      const bufferCopy = audioBytes.slice(0);

      audioContext.decodeAudioData(
        bufferCopy,
        (decoded) => {
          const source = audioContext.createBufferSource();
          source.buffer = decoded;

          // Route to recording destination
          source.connect(destination);
          // Also route to speakers so the user hears Sarah
          source.connect(audioContext.destination);

          source.onended = () => resolve();
          source.start(0);
        },
        (err) => {
          console.error('Failed to decode interviewer audio:', err);
          reject(err);
        },
      );
    });
  };

  // ── Mixed stream (mic + interviewer) → MediaRecorder ────────────────────
  const mixedStream = destination.stream;

  // ── Cleanup ──────────────────────────────────────────────────────────────
  const dispose = async (): Promise<void> => {
    micSource.disconnect();
    micStream.getTracks().forEach(t => t.stop());
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  };

  return { mixedStream, playInterviewerAudio, dispose };
}
