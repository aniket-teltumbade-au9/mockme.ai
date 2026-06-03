# OBJECTIVE
Build a high-performance, local Node.js (NestJS or Fastify) or Python (FastAPI) backend server for an AI Personal Interview Helper App. The backend must operate completely locally without connecting to any third-party APIs (no OpenAI, no ElevenLabs, no Anthropic).

## 1. STACK & NATIVE ENGINE INTEGRATIONS
Generate clean, modular code to integrate with these locally hosted engines:
*   **LLM Engine:** Connect via standard HTTP/REST or WebSockets to a local Ollama instance running `llama3:8b` or `mistral` (default endpoint: `http://localhost:11434/api/chat`).
*   **STT Engine (Speech-to-Text):** Integrate with a local Whisper instance running via `whisper.cpp` or a local Python process. It must accept raw binary audio buffers or WebM/WAV files from the frontend and return plaintext.
*   **TTS Engine (Text-to-Speech):** Integrate with a local `XTTS-v2` or `Coqui-TTS` instance. It must accept a text string and return an audio stream or static WAV file buffer back to the frontend.

## 2. STATE MACHINE & SESSION MANAGEMENT
*   Implement an in-memory or local SQLite/Redis session store to track active interview progress.
*   Every user session must store: `sessionId`, `currentState` (STATE_0 to STATE_4), `history` (the rolling LLM chat conversation history), `detectedGaps` (array), and `currentCodeWorkspace`.
*   Maintain strict context formatting: Ensure the **Master Interview Engine Prompt** is prepended as the system message to the local LLM history on every chat transaction.

## 3. PARSING ENGINE & ROUTING LAYER
Create middleware or helper utilities to split the local LLM's dual-channel string output on every turn:
*   **Parser Logic:** Locate `[UI_SYNC]` and parse the following string into a clean JSON object. Locate `[VOICE_TEXT]` and extract the clean string for the local TTS engine.
*   **Endpoint 1: `/api/session/start`** -> Initializes a new interview instance, sets state to STATE_0.
*   **Endpoint 2: `/api/interview/respond-audio`** -> Accepts a multipart form file or binary stream containing user voice input. Passes it through local STT -> sends resulting text to the Local LLM -> parses the LLM response -> sends `voiceScript` through local TTS -> returns a unified response containing the UI JSON state data AND the raw binary audio array/stream.
*   **Endpoint 3: `/api/interview/respond-code`** -> Accepts the updated string from the frontend text editor and passes it to the LLM with a system wrapper `User updated code to: [...]`.

## 4. ERROR HANDLING & ROBUSTNESS
*   If the local LLM fails to output valid JSON under `[UI_SYNC]`, implement a fallback regex parser or automatic local self-correction prompt to sanitize the string before returning it to the client.
