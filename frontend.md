# OBJECTIVE
Build a fully interactive, responsive Next.js (React) or Vue.js frontend application for the AI Personal Interview Helper App. The interface must dynamically adapt based on server-driven JSON states and handle streaming media inputs natively.

## 1. UI LAYOUT & COMPONENT STATES
Create a single-page app layout divided dynamically into two primary layouts based on the backend `currentState` value:
*   **Layout A (Conversational Mode):** A clean, focused interface displaying a real-time audio visualizer waveform canvas, a prominent state progress bar, and basic status indicators. Used during States 0, 1, 3, and 4.
*   **Layout B (Split-Screen Code Workspace):** Triggered instantly whenever `showCodeWorkspace` is `true`. The screen must split smoothly down the center:
    *   *Left Panel:* Audio visualizer canvas and live conversational hints/detected gaps ticker.
    *   *Right Panel:* An interactive code editor using `@monaco-editor/react` or `CodeMirror`. It must load the language and seed code dynamically from the incoming `editorConfig.codeContent` payload.

## 2. NATIVE AUDIO CAPTURE PIPELINE (STT STREAMER)
*   Implement a robust recording module using the native Web MediaDevices API (`navigator.mediaDevices.getUserMedia`).
*   Capture audio from the user's microphone in standard formats (e.g., audio/webm or audio/wav).
*   **Interaction Loop Logic:** 
    1. The frontend remains idle until the server's audio playback finishes.
    2. Automatically open the microphone stream and indicate visually that the app is "Listening".
    3. Implement a manual "Submit Answer" button or an automatic silence detection threshold (VAD - Voice Activity Detection) to stop recording.
    4. Send the binary audio payload via a POST request to `/api/interview/respond-audio`.

## 3. PLAYBACK ENGINE & SYNCHRONIZATION
*   Upon receiving a response from the backend, extract the `uiConfig` JSON and update the global application state (Progress, Editor contents, Hints, Gaps).
*   Extract the binary audio stream returned by the server and play it instantly using the browser's native `AudioContext` or an HTML5 `<audio>` element.
*   Disable the microphone button while the AI audio is playing back to prevent sound bleed and infinite feedback loops.

## 4. CODE STATE SYNCING
*   Add a debounced event handler (e.g., 800ms) or a dedicated "Run Code & Sync" button inside the code workspace panel.
*   Whenever clicked or fired, send the raw text value of the code editor to `/api/interview/respond-code` so the local backend LLM can continuously analyze optimizations in real-time.
