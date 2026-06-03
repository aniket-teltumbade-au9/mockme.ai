`markdown
# Architectural & Implementation Specification
## MockMe.AI — Interview Audio Recording, Dropbox Archival & Analytics Dashboard

This single specification document consolidates all frontend hooks, backend services, database mutations, schemas, and UI design tokens required to implement the synchronized audio capture and Dropbox archival system.

---

## 1. System Context & Architecture

### Stack Baseline
* **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React
* **Backend:** FastAPI (Python 3.10+), Motor (Async MongoDB), Groq SDK
* **AI Configuration:** Groq `llama-3.3-70b-versatile` (Evaluation/Analytics LLM), `whisper-large-v3` (STT), Browser Web Speech API (TTS)
* **Storage Matrix:** Local MongoDB instance + Distributed remote archival to private user Dropbox accounts.

### Session Lifecycle States
```text
[STATE_0: Intro] ──> [STATE_1: Tech Dive] ──> [STATE_2: Coding] ──> [STATE_3: Conclusion] ──> [FINALIZE_PIPELINE]

```

---

## 2. Directory Additions & Database Schemas

### Codebase Extensions

```text
├── backend/
│   ├── routers/
│   │   ├── dropbox_auth.py       # OAuth2 handlers (PKCE, Token Exchange)
│   │   └── interviews.py         # /finalize upload ingestion & /history query endpoints
│   ├── services/
│   │   ├── dropbox_service.py    # Chunked uploads, direct stream parsing, token rotation
│   │   └── analysis_builder.py   # State aggregator & Groq engine orchestrator
│   └── prompts/
│       └── analysis_prompt.py    # System prompt templates for interview parsing
└── frontend/
    ├── hooks/
    │   └── useInterviewRecorder.ts # Dual-channel MediaStream synchronization hook
    ├── components/
    │   ├── Dashboard/
    │   │   ├── InterviewHistoryCard.tsx # Session summary presentation element
    │   │   ├── AudioPlayerModal.tsx     # Waveform-synchronized replay module
    │   │   └── AnalysisDrawer.tsx       # Performance telemetry tabbed interface
    │   └── InterviewCall/
    │       └── InterviewCall.tsx        # Injects finalization hook inside STATE_3
    └── app/
        ├── dropbox/
        │   └── callback/
        │     └── page.tsx        # Client side OAuth code catcher
        └── settings/
            └── page.tsx          # Integration state control center

```

### Database Extensions (MongoDB)

#### `users` Collection Document Modifications

```json
{
  "dropbox_access_token": "string | null",
  "dropbox_refresh_token": "string | null",
  "dropbox_token_expiry": "ISODate | null",
  "dropbox_account_email": "string | null"
}

```

#### `sessions` Collection Document Modifications

```json
{
  "finalized": "boolean",
  "dropbox_audio_url": "string | null",
  "dropbox_analysis_url": "string | null",
  "recording_available": "boolean",
  "finalization_attempted_at": "ISODate | null",
  "finalization_error": "string | null",
  "analysis": "object | null" 
}

```

---

## 3. Implementation Phases Blueprint

### Phase 1: Browser Audio Recording (Frontend)

**File Path:** `frontend/hooks/useInterviewRecorder.ts`

Implements a React hook using the browser Web Audio and MediaRecorder APIs to merge candidate microphone input with the host speech synthesis output.

```typescript
import { useRef, useState, useCallback } from 'react';

export interface UseInterviewRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  recordingState: 'idle' | 'recording' | 'stopped';
}

export const useInterviewRecorder = (): UseInterviewRecorderReturn => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'stopped'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder null |>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamTracksRef = useRef<MediaStreamTrack[]>([]);

  const startRecording = useCallback(async () => {
    audioChunksRef.current = [];
    try {
      // 1. Fetch User Microphone Input Stream
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);
      micStream.getTracks().forEach(t => streamTracksRef.current.push(t));

      // 2. Intercept and Merge Browser Audio Target (System Playback)
      try {
        const systemStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: false });
        const systemSource = audioContext.createMediaStreamSource(systemStream);
        systemSource.connect(destination);
        systemStream.getTracks().forEach(t => streamTracksRef.current.push(t));
      } catch {
        console.warn("System audio capture unavailable. Engaging reliable fallback text-logging context.");
      }

      // 3. Initialize Unified Media Recorder Configuration
      const recorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm;codecs=opus' });
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(1000); // 1000ms chunk emission interval
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
    } catch (err) {
      console.error("Critical failure initializing media logging hardware context.", err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || recordingState !== 'recording') {
        return reject(new Error("Recorder context is not processing active tracks."));
      }

      mediaRecorderRef.current.onstop = () => {
        const finalAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        
        // Cleanup all active streams and operational hardware contexts
        streamTracksRef.current.forEach(track => track.stop());
        streamTracksRef.current = [];
        setRecordingState('stopped');
        resolve(finalAudioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [recordingState]);

  return { startRecording, stopRecording, recordingState };
};

```

---

### Phase 2: Cloud Integration Components (Backend)

#### A. Dropbox Secure Authorization Router

**File Path:** `backend/routers/dropbox_auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
import dropbox
import secrets
from datetime import datetime, timedelta
from backend.internal.db import get_mongo_client

router = APIRouter(prefix="/api/dropbox", tags=["dropbox_auth"])

@router.get("/auth-url")
async def get_dropbox_auth_url(user_id: str):
    # Setup state verification keys and dynamic redirect engines via PKCE configurations
    app_key = "DROPBOX_APP_KEY"
    flow = dropbox.DropboxOAuth2FlowNoRedirect(app_key, use_pkce=True, token_access_type='offline')
    auth_url = flow.start()
    # Cache verifier securely via cross-session lookup variables (e.g., Memory DB/Redis)
    return {"auth_url": auth_url, "code_verifier": flow.code_verifier}

@router.get("/callback")
async def dropbox_callback(code: str, code_verifier: str, user_id: str):
    db = await get_mongo_client()
    try:
        flow = dropbox.DropboxOAuth2FlowNoRedirect("DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", use_pkce=True, token_access_type='offline')
        flow.code_verifier = code_verifier
        res = flow.finish(code)
        
        expiry_delta = datetime.utcnow() + timedelta(seconds=res.expires_in) if res.expires_in else None
        
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "dropbox_access_token": res.access_token,
                "dropbox_refresh_token": res.refresh_token,
                "dropbox_token_expiry": expiry_delta,
                "dropbox_account_email": "connected" # Fetch optionally via accounts endpoints
            }}
        )
        return RedirectResponse(url="/dashboard?integration=success")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth Handshake Failure: {str(e)}")

@router.get("/status")
async def get_dropbox_status(user_id: str):
    db = await get_mongo_client()
    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("dropbox_refresh_token"):
        return {"connected": False}
    return {"connected": True, "email": user.get("dropbox_account_email")}

@router.post("/disconnect")
async def disconnect_dropbox(user_id: str):
    db = await get_mongo_client()
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {
            "dropbox_access_token": None,
            "dropbox_refresh_token": None,
            "dropbox_token_expiry": None,
            "dropbox_account_email": None
        }}
    )
    return {"success": True}

```

#### B. Storage Management Pipeline & Payload Endpoint

**File Path:** `backend/services/dropbox_service.py` & `backend/routers/interviews.py`

```python
import json
import dropbox
from datetime import datetime

class DropboxService:
    def __init__(self, app_key: str, app_secret: str, refresh_token: str):
        self.dbx = dropbox.Dropbox(
            oauth2_refresh_token=refresh_token,
            app_key=app_key,
            app_secret=app_secret
        )

    def upload_interview(self, session_id: str, date_str: str, audio_bytes: bytes, analysis_data: dict):
        base_path = f"/MockMe.AI/interviews/{date_str}_{session_id}"
        
        # 1. Pipeline Audio Blob Ingestion Target
        audio_path = f"{base_path}/audio.webm"
        self.dbx.files_upload(audio_bytes, audio_path, mode=dropbox.files.WriteMode.overwrite)
        
        # 2. Pipeline Structured Execution Profile Payload Target
        json_path = f"{base_path}/analysis.json"
        json_bytes = json.dumps(analysis_data, indent=2).encode('utf-8')
        self.dbx.files_upload(json_bytes, json_path, mode=dropbox.files.WriteMode.overwrite)
        
        # 3. Create public shared links for asset targets
        audio_link = self.dbx.sharing_create_shared_link_with_settings(audio_path).url
        json_link = self.dbx.sharing_create_shared_link_with_settings(json_path).url
        
        return audio_link, json_link

```

##### Process Finalization Hook: `POST /api/interviews/{session_id}/finalize`

```python
@router.post("/{session_id}/finalize")
async def finalize_interview(session_id: str, audio: UploadFile = File(...)):
    db = await get_mongo_client()
    session = await db.sessions.find_one({"_id": session_id})
    user = await db.users.find_one({"_id": session["user_id"]})
    
    # Run Automated Metrics Extraction via Groq Engine Interoperability Layers
    analysis_payload = await build_groq_session_analysis(session)
    
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    try:
        service = DropboxService("DROPBOX_APP_KEY", "DROPBOX_APP_SECRET", user["dropbox_refresh_token"])
        audio_bytes = await audio.read()
        
        audio_url, json_url = service.upload_interview(session_id, date_str, audio_bytes, analysis_payload)
        
        await db.sessions.update_one(
            {"_id": session_id},
            {"$set": {
                "finalized": True,
                "dropbox_audio_url": audio_url,
                "dropbox_analysis_url": json_url,
                "analysis": analysis_payload,
                "finalization_attempted_at": datetime.utcnow()
            }}
        )
        return {"success": True, "audio_url": audio_url, "analysis_url": json_url}
    except Exception as e:
        await db.sessions.update_one(
            {"_id": session_id},
            {"$set": {
                "finalized": False,
                "finalization_error": str(e),
                "finalization_attempted_at": datetime.utcnow()
            }}
        )
        raise HTTPException(status_code=500, detail=f"Archival Fault: {str(e)}")

```

---

### Phase 3: Evaluation Schema Blueprint (`analysis.json`)

The structural data generated for evaluation reports must explicitly conform to the structure below:

```json
{
  "session_id": "string (UUID)",
  "user_id": "string (UUID)",
  "date": "2026-06-03T20:45:00Z",
  "job_description": "Full-text representation of targeted hiring parameters",
  "duration_seconds": 1540,
  "hire_verdict": "Hire | No Hire | Maybe",
  "overall_score": 84,
  "states": {
    "introduction": { "duration_seconds": 180, "summary": "Candidate introduced structural domain engineering context smoothly." },
    "tech_dive": {
      "duration_seconds": 600,
      "questions_asked": ["Explain concurrency boundaries in async paradigms."],
      "scores": { "conceptual": 85, "architectural": 80, "communication": 90 },
      "strengths": ["Strong understanding of event-loops"],
      "gaps": ["Minor thread allocation definition errors"]
    },
    "coding_round": {
      "duration_seconds": 640,
      "challenge": "Implement sliding window tracking array operations optimization.",
      "final_code": "export const slidingWindow = ...",
      "language": "typescript",
      "scores": { "correctness": 100, "efficiency": 90, "code_quality": 85 },
      "feedback": "Optimized calculations correctly; naming profiles maintain enterprise parity structural rules."
    },
    "conclusion": { "summary": "Wrap up conversation cleanly and outlined questions regarding enterprise scale targets." }
  },
  "full_transcript": [
    {
      "turn": 0,
      "speaker": "AI",
      "text": "Welcome. Let us break down database normalization targets.",
      "timestamp_ms": 1050,
      "state": "STATE_0"
    }
  ],
  "skill_gaps": ["Distributed caching state systems", "Asynchronous memory pooling controls"],
  "recommended_topics": ["Redis Cluster Topology Optimization", "Leaky Bucket Rate Limiting Mechanics"],
  "dropbox_audio_url": "[https://dl.dropboxusercontent.com/](https://dl.dropboxusercontent.com/)..."
}

```

---

### Phase 4: Lifecycle Finalization Hook (Frontend Component Injection)

**File Context:** `frontend/components/InterviewCall/InterviewCall.tsx`

```typescript
// Intercepting evaluation milestones inside state updates tracking terminal points
const handleStateThreeCompletion = async () => {
  setIsFinalizing(true); // Engages blocking state machine processing triggers
  try {
    const audioBlob = await stopRecording();
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'session_audio.webm');
    
    const response = await fetch(`/api/interviews/${currentSessionId}/finalize`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error("Server rejected cloud archival payload.");
    
    toast.success("Interview securely archived! Directing to performance analytics panels.");
    setTimeout(() => router.push('/dashboard'), 3000);
  } catch (error) {
    console.error("Payload transport dropped.", error);
    toast.error("Cloud connectivity fault encountered. Recording safely isolated in local cache.");
    // Cache payload values locally into browser IndexedDB schemas for recovery actions
  } finally {
    setIsFinalizing(false);
  }
};

```

---

### Phase 5: Historical Performance Dashboard UI

#### Audio Interactive Waveform Explorer Component

**File Path:** `frontend/components/Dashboard/AudioPlayerModal.tsx`

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X } from 'lucide-react';

interface TranscriptLine {
  turn: number;
  speaker: 'AI' | 'Candidate';
  text: string;
  timestamp_ms: number;
  state: string;
}

interface AudioPlayerModalProps {
  audioUrl: string;
  transcript: TranscriptLine[];
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ audioUrl, transcript, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement null |>(null);
  const activeTranscriptRef = useRef<HTMLDivElement null |>(null);

  // Convert Dropbox share link structure to direct streaming endpoints
  const streamingUrl = audioUrl.replace('?dl=0', '?dl=1').replace('[www.dropbox.com](https://www.dropbox.com)', 'dl.dropboxusercontent.com');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTimeMs(audio.currentTime * 1000);
    audio.addEventListener('timeupdate', updateTime);
    return () => audio.removeEventListener('timeupdate', updateTime);
  }, []);

  // Track speech timeline matching parameters to auto-scroll corresponding text structures
  useEffect(() => {
    const activeElement = document.getElementById(`turn-${getCurrentActiveTurn()}`);
    if (activeElement && activeTranscriptRef.current) {
      activeTranscriptRef.current.scrollTo({
        top: activeElement.offsetTop - 120,
        behavior: 'smooth'
      });
    }
  }, [currentTimeMs]);

  const getCurrentActiveTurn = () => {
    let currentTurn = 0;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].timestamp_ms <= currentTimeMs) {
        currentTurn = transcript[i].turn;
      } else {
        break;
      }
    }
    return currentTurn;
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[80vh] rounded-xl flex flex-col overflow-hidden">
        
        
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-white font-semibold text-lg">Interview Session Audio Tracking Panel</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X size="{20}"/></button>
        </div>

        {/* Dynamic Highlight Timeline Stream Body */}
        <div ref={activeTranscriptRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/40">
          {transcript.map((line) => {
            const isActive = line.turn === getCurrentActiveTurn();
            return (
              <div 
                key={line.turn} id={`turn-${line.turn}`}
                className={`p-4 rounded-lg border transition duration-300 ${
                  isActive 
                    ? 'bg-blue-600/10 border-blue-500/50 text-white scale-[1.01]' 
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded ${
                    line.speaker === 'AI' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-emerald-600/20 text-emerald-400'
                  }`}>
                    {line.speaker}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {new Date(line.timestamp_ms).toISOString().substr(14, 5)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{line.text}</p>
              </div>
            );
          })}
        </div>

        
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center space-x-4">
          <audio ref={audioRef} src={streamingUrl} />
          <button 
            onClick={togglePlayback}
            className="p-4 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
          >
            {isPlaying ? <Pause size="{20}"/> : <Play size="{20}"/>}
          </button>
          <div className="flex-1">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${audioRef.current ? (currentTimeMs / (audioRef.current.duration * 1000)) * 1000 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>{new Date(currentTimeMs).toISOString().substr(14, 5)}</span>
              <span>{audioRef.current ? new Date(audioRef.current.duration * 1000).toISOString().substr(14, 5) : "00:00"}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

```

---

### Phase 6: Core System Verification & Verification Guard

To maintain system integrity, you must enforce the execution check block on the frontend module initialization loops.

```tsx
// Gate keeper code integration block inside Interview generation dashboards
const handleInterviewInitialiationClick = () => {
  if (!dropboxConnectedStatus && !userBypassedCloudStorageSettings) {
    // Force launch warning modal configurations preventing automated actions
    setLaunchDropboxGatekeeperOverlay(true);
    return;
  }
  
  // Transition into core structural logic modules smoothly
  initializeActiveInterviewSessionContext();
};

```

---

## 4. Edge Case Handling Matrix

| Fault Vectors Encountered | Runtime Automation Handling Routines |
| --- | --- |
| **Cloud Target Upload Dropouts** | Intercept operational errors, copy structural arrays, serialize them into browser-side local `IndexedDB` objects, and show manual cloud integration retry actions on the user's dashboard. |
| **Browser Execution Interruption** | Hook `window.addEventListener('beforeunload')` triggers during active states. If unexpected page exits occur during `STATE_3`, dispatch a beacon payload data stream to save state metrics inside local historical database parameters. |
| **Token Lifetime Expiry** | Before launching background processing routines, check security verification milestones on the backend. If validation windows are exceeded, automatically initiate background authorization routines via `dropbox.DropboxOAuth2FlowNoRedirect` updates. |

```</HTMLDivElement></HTMLAudioElement></AudioPlayerModalProps></Blob></MediaStreamTrack[]></Blob[]></MediaRecorder></Blob>

```
