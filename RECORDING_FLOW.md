# Audio Recording Flow Documentation

This document outlines the architecture for mixing and recording Microphone and System (AI TTS) audio within the `mockme` application.

## Core Objective
Capture a single audio file containing both the User's voice (Mic) and the AI Interviwer's voice (TTS) to provide a complete recording of the conversation.

## Components
1.  **`frontend/src/utils/mixAudioStreams.ts`**: The Web Audio API engine.
2.  **`frontend/src/hooks/useInterviewRecorder.ts`**: The stateful React hook managing the lifecycle of recording and audio playback.
3.  **`frontend/src/app/page.tsx`**: The UI orchestrator that triggers the recording and finalizes the session.

---

## Detailed Flow

### 1. Context Creation (`createRecordingContext`)
Called when `startRecording()` is initiated:
1.  Creates a new `AudioContext`.
2.  Creates a `MediaStreamAudioDestinationNode`. This acts as the "virtual microphone" that `MediaRecorder` will read from.
3.  **Microphone Stream**:
    *   `navigator.mediaDevices.getUserMedia({ audio: true })` captures the user's mic.
    *   Connects the mic to the `AudioContext` destination node.
4.  **Mixed Stream**: 
    *   The `AudioContext` destination now outputs a stream containing the mixed audio (Mic + anything else connected to the destination).

### 2. Playing AI Audio (`playInterviewerAudio`)
When the backend returns TTS bytes:
1.  The bytes are decoded into an `AudioBuffer`.
2.  An `AudioBufferSourceNode` is created.
3.  **Mixing**: The source is connected to:
    *   **The Destination Node**: Routes the audio into the `MediaRecorder` stream.
    *   **The AudioContext Destination**: Routes the audio to the speakers so the user can hear the AI.
4.  The source is started.

### 3. Recording (`MediaRecorder`)
In `useInterviewRecorder.ts`:
1.  A `MediaRecorder` is initialized using the `mixedStream` from the `RecordingContext`.
2.  `recorder.start()` begins capturing the mixed stream.
3.  `recorder.ondataavailable` pushes audio chunks into a `Blob` array.

### 4. Stopping and Finalization
1.  `stopRecording()` triggers `recorder.stop()`.
2.  The `onstop` event listener fires, converting all captured `Blob` chunks into one final WebM file.
3.  `dispose()` is called on the `RecordingContext` to close the `AudioContext`, disconnect nodes, and release mic permissions.
4.  The final `Blob` is sent to the backend `/api/interviews/{session_id}/finalize` endpoint via `FormData`.

---

## Identified Limitations & Known Issues
*   **Browser Requirements**: Capturing system audio (TTS) in some browser environments requires `getDisplayMedia` (Screen Sharing), which forces a browser UI prompt. If this prompt is ignored or cancelled, system audio will not be mixed.
*   **AudioContext Autoplay Policy**: Browsers often suspend the `AudioContext` until the user interacts with the page (click).
*   **State Management**: If `startRecording` is not correctly called *before* `playInterviewerAudio`, the audio context may not be ready, potentially causing audio to be missed in the initial capture.
