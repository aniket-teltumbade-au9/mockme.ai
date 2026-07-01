/**
 * Frontend TypeScript types for Post-Interview Comprehensive Analysis feature
 * Matches backend Pydantic models and provides type safety for analysis data
 */

// Priority levels for gaps
export enum PriorityLevel {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

// Resource types available in the study database
export enum ResourceType {
  Book = 'book',
  Course = 'course',
  Blog = 'blog',
  Documentation = 'documentation',
  Tutorial = 'tutorial',
  Practice = 'practice',
  Guide = 'guide',
}

/**
 * A technical or communication gap identified during the interview
 * and ranked by importance
 */
export interface PrioritizedGap {
  category: string; // e.g., "System Design", "Algorithms", "Code Quality"
  priority: PriorityLevel; // Critical, High, Medium, Low
  frequency: number; // How many times this gap appeared in the interview
  impact_score: number; // 0-100 based on relevance to the role
  detected_in: string; // e.g., "technical_dive", "coding_round", "behavioral"
}

/**
 * Detailed topic information for a skill or knowledge area
 * Sourced from predefined topic database, not LLM-generated
 */
export interface TopicInfo {
  concept: string; // Core concept definition (2-3 sentences)
  subtopics: string[]; // Specific areas within the topic to focus on
  competencies: string[]; // Skills and knowledge areas needed to master this topic
  pitfalls: string[]; // Common mistakes or misconceptions to avoid
}

/**
 * A single step in the resolution path for addressing a gap
 * Steps follow the pattern: Understand → Practice → Demonstrate → Validate
 */
export interface ResolutionStep {
  step_number: number; // 1-4
  title: string; // "Understand", "Practice", "Demonstrate", or "Validate"
  description: string; // What to do in this step
  activities: string[]; // Specific activities or exercises
  time_estimate: string; // e.g., "1-2 hours", "3-5 practice problems"
  resources: StudyResource[]; // Relevant resources for this step
}

/**
 * Complete resolution path for addressing a specific gap
 */
export interface ResolutionPath {
  gap_category: string; // The gap this path addresses
  steps: ResolutionStep[]; // Should contain exactly 4 steps
  estimated_total_time: string; // Total time estimate for all steps
}

/**
 * A curated study resource from the resource database
 * Links to books, courses, blogs, documentation, tutorials, practice sites, and guides
 */
export interface StudyResource {
  id: string; // Unique identifier
  title: string; // Resource title
  author?: string; // Author name if available
  type: ResourceType; // Type of resource
  url: string; // Direct URL to the resource
  categories: string[]; // Which gaps/topics this resource addresses
}

/**
 * A communication gap detected in the interview
 * Categorized into one of six types with actionable improvement tips
 */
export interface CommunicationGap {
  category: string; // One of: Clarity, Structure, Conciseness, Active Listening, Confidence, Technical Vocabulary
  severity: PriorityLevel; // How serious this gap is
  description: string; // What the specific gap is
  candidate_response: string; // Actual response or behavior from the interview (truncated quote)
  improvement_tips: string[]; // 3-5 concrete, actionable techniques to improve
  sample_improved_response: string; // Example of how to handle a similar situation better
  related_tactic?: {
    // Corresponding behavioral tactic from the remediation database
    tactic_name: string;
    description: string;
    example: string;
  };
}

/**
 * Relationship between a technical and communication gap
 * Shows how addressing one gap might help with another
 */
export interface GapRelationship {
  tech_gap: string; // Technical gap category
  comm_gap: string; // Communication gap category
  connection: string; // How they're related
}

/**
 * Holistic guidance showing how gaps relate and should be addressed
 * Provides integrated view across technical and communication improvements
 */
export interface HolisticGuidance {
  gap_relationships: GapRelationship[]; // How gaps relate to each other
  recommended_sequence: string[]; // Order to address gaps for maximum impact
  dependency_map: Record<string, any>; // Visualization data showing dependencies
  action_checklist: Array<{
    // Grouped action items by timeline
    timeline: string; // "This week", "Next week", "Long-term"
    items: string[]; // Actions to take in this timeline
  }>;
  integrated_guidance: string; // Overall recommendation for approach
}

/**
 * Analysis of a critical moment from the interview
 * Shows candidate's response vs elite-level response
 */
export interface TransformationAnalysis {
  critical_moment: string; // Context or question where the stumble occurred
  candidate_original: string; // The candidate's actual response (truncated)
  elite_response: string; // Expert-level response to the same question
  why_better: string; // Explanation of key differences
}

/**
 * Analysis of technical gaps and how to address them
 * Main component of the comprehensive improvement plan
 */
export interface TechnicalAnalysis {
  gaps: PrioritizedGap[]; // Technical gaps sorted by priority
  gaps_by_priority: {
    // Gaps grouped by priority level
    [key in PriorityLevel]?: PrioritizedGap[];
  };
  topic_info: Record<string, TopicInfo>; // Topic information keyed by gap category
  resolution_paths: ResolutionPath[]; // Resolution guidance for each gap
}

/**
 * Analysis of communication gaps and how to address them
 * Addresses clarity, structure, conciseness, listening, confidence, vocabulary
 */
export interface CommunicationAnalysis {
  gaps: CommunicationGap[]; // Communication gaps with improvement tips
  gaps_by_category: Record<string, CommunicationGap[]>; // Grouped by category
  overall_communication_score?: number; // Overall communication score 0-100
  category_scores?: {
    // Individual scores for each communication area
    clarity?: number;
    structure?: number;
    conciseness?: number;
    active_listening?: number;
    confidence?: number;
    technical_vocabulary?: number;
  };
}

/**
 * Resources analysis for all detected gaps
 * Provides centralized resource list with filtering and grouping
 */
export interface ResourcesAnalysis {
  all_resources: StudyResource[]; // All curated resources for detected gaps
  resources_by_type: Record<ResourceType, StudyResource[]>; // Grouped by resource type
  resources_by_category: Record<string, StudyResource[]>; // Grouped by gap category
  coverage_gaps: string[]; // Gaps that have no available resources
  total_resources: number; // Total count of available resources
  available_types: ResourceType[]; // Types of resources available
}

/**
 * Complete improvement plan for a session
 * Organizes all analysis data for multi-tab report display
 */
export interface ImprovementPlan {
  session_id: string; // Reference to the interview session
  session_date: string; // Date of the interview (ISO format)
  overall_score: number; // Overall performance score 0-100
  hire_verdict: string; // "Hire", "No Hire", or "Maybe"

  // Analysis sections
  technical_analysis: TechnicalAnalysis; // Technical gaps and resolution
  communication_analysis: CommunicationAnalysis; // Communication gaps and tips
  holistic_guidance: HolisticGuidance; // Cross-domain relationships and sequence
  transformation_analysis: TransformationAnalysis; // Critical moment analysis
  resources_analysis: ResourcesAnalysis; // Curated resources and coverage

  // Metadata
  generated_at: string; // When the plan was generated (ISO format)
  cache_expires_at?: string; // When cache expires (ISO format)
}

/**
 * Response wrapper for improvement plan API calls
 */
export interface ImprovementPlanResponse {
  success: boolean;
  plan?: ImprovementPlan;
  error?: string;
  code?: string;
  retry_available?: boolean;
  timestamp?: string;
}

/**
 * Response wrapper for resources API calls
 */
export interface ResourcesResponse {
  success: boolean;
  resources: StudyResource[];
  total_count: number;
  filtered_count: number;
  available_types: ResourceType[];
}
