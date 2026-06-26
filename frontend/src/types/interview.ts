export interface EditorConfig {
  language: string;
  codeContent: string;
}

export interface UiConfig {
  currentState: string;
  showCodeWorkspace: boolean;
  progress: number;
  hints: string[];
  detectedGaps: string[];
  editorConfig: EditorConfig;
  voice_script?: string;
}

export interface InterviewRecord {
  sessionId: string;
  created_at: string;
  analysis?: { hire_verdict?: string };
  history?: Array<{ role: string; content: string }>;
  dropbox_audio_url?: string;
  finalized?: boolean;
  finalization_error?: string;
}

export interface UserProgress {
  total_interviews: number;
  skill_gaps: string[];
}
