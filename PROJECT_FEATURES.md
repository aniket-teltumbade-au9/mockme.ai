# MockMe.AI - Project Status & Features

## Project Vision
MockMe.AI is a high-fidelity, AI-powered technical interview simulator designed to provide a professional, immersive, and data-driven practice environment.

## Current Technical Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS (Custom Vanilla CSS modules), Lucide React (Icons).
- **Backend:** FastAPI (Python 3.10+), Motor (Async MongoDB), Groq API.
- **AI Engines:**
    - **LLM:** Groq Llama-3.3-70b-versatile (High-speed, high-reasoning).
    - **STT (Speech-to-Text):** Groq Whisper-large-v3 (Sub-second transcription).
    - **TTS (Text-to-Speech):** Browser-native Web Speech API (Zero-latency, reliable).
- **Database:** MongoDB (Local) for user persistence and session tracking.

## Core Features Implemented

### 1. Immersive Interview Persona ("Sarah")
- **The Persona:** AI acts as "Sarah," a Senior Engineering Manager who is professional, encouraging, and rigorous.
- **Dynamic Interaction:** The AI acknowledges candidate answers with empathetic transitions before progressing, simulating real-world social cues.

### 2. Structured Interview Lifecycle
Strict enforcement of a 4-state machine:
- **STATE_0 (Introduction):** Greet, self-intro, and candidate intro.
- **STATE_1 (Deep Tech Dive):** Conceptual and architectural evaluation based on JD.
- **STATE_2 (Coding Round):** Live technical challenge with synchronized workspace.
- **STATE_3 (Conclusion):** Summary of strengths, gaps, and "Hire/No Hire" feedback.

### 3. Smart Context Management (JD-Driven)
- **JD Collection:** User must provide a Job Description before starting.
- **Tailored Evaluation:** Sarah analyzes the JD to generate relevant technical and coding questions in real-time.

### 4. Immersive Call UI
- **Neural Avatar:** A central glowing sphere that pulses dynamically when the AI is speaking.
- **Glassmorphism Design:** Modern, dark-themed "Video Call" aesthetic using blurred glass panels and professional typography.
- **Technical Workspace:** An integrated Monaco-powered code editor that automatically appears during coding rounds.

### 5. Progress Tracking & Persistence
- **MongoDB Integration:** Stores session history, detected skill gaps, and interview counts.
- **User Dashboard:** Displays real-time stats and persistent "Recent Gaps" to guide the user's next study session.
- **Daily Limit:** Enforces a "1 Interview Per Day" rule to simulate a realistic daily practice routine.

### 6. Robust Interaction Pipeline
- **Dual-Channel Parser:** Custom logic to extract structured `[UI_SYNC]` JSON and clean `[VOICE_TEXT]` from a single LLM stream.
- **Interaction Loop:** Automatically disables input while AI speaks and opens the mic only when it's the candidate's turn.
- **Debounced Code Sync:** Real-time analysis of code changes without overwhelming the API.

## Environment Requirements
- `GROQ_API_KEY` for LLM and STT.
- `MONGODB_URL` for database connectivity.
- Local MongoDB instance running on port `27017`.
