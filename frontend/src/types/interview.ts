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

// Analysis types
export interface StarScores {
  situation?: boolean;
  task?: boolean;
  action?: boolean;
  result?: boolean;
}

export interface BehavioralStarItem {
  question?: string;
  scores: StarScores;
  feedback?: string;
  tutor_tip?: string;
}

export interface CommAssessment {
  overall_score?: number;
  clarity?: number;
  structure?: number;
  conciseness?: number;
  active_listening?: number;
  confidence?: number;
  technical_vocabulary?: number;
  strengths?: string[];
  gaps?: string[];
  summary?: string;
}

export interface Transformation {
  critical_moment?: string;
  candidate_original?: string;
  elite_response?: string;
  why_better?: string;
}

export interface TacticalStrategy {
  gap: string;
  strategy: {
    step_1_clarification: string;
    step_2_approach: string;
    step_3_iterate: string;
    step_4_pressure_test: string;
  };
}

export interface BehavioralTactic {
  tactic_name: string;
  description: string;
  example: string;
}

export interface Resource {
  title: string;
  author?: string;
  type: string;
  url: string;
}

export interface AnalysisData {
  behavioral_star_analysis: BehavioralStarItem[];
  hire_verdict?: string;
  overall_score?: number;
  communication_assessment?: CommAssessment;
  transformations?: Transformation;
  remediation_plan?: {
    summary: string;
    tactical_strategies: TacticalStrategy[];
    behavioral_tactics: BehavioralTactic[];
    resources: Resource[];
    gaps_addressed: string[];
  };
  states?: {
    tech_dive?: {
      scores?: {
        conceptual?: number;
        architectural?: number;
        communication?: number;
      };
      summary?: number;
      strengths?: string[];
      communication_observations?: string[];
    };
    coding_round?: {
      challenge?: string;
      feedback?: string;
      verbalized_approach?: boolean;
      communicated_tradeoffs?: boolean;
    };
  };
  skill_gaps?: string[];
  communication_gaps?: string[];
  recommended_topics?: string[];
  recommended_communication_improvements?: string[];
}

export interface InterviewRecord {
  sessionId: string;
  created_at: string;
  analysis?: AnalysisData;
  history?: Array<{ role: string; content: string }>;
  dropbox_audio_url?: string;
  finalized?: boolean;
  finalization_error?: string;
}

export interface UserProgress {
  total_interviews: number;
  skill_gaps: string[];
}
