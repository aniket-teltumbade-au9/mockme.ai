"use client";

import React, { useState, useRef } from "react";
import {
  Trash2,
  Download,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { VideoPlayer, VideoMetadata } from "./VideoPlayer";

/**
 * Timestamp Marker Interface
 * Represents a marked moment in the video with optional notes
 */
export interface TimestampMarker {
  id: string;
  timestamp: number; // seconds
  note?: string;
  createdAt: string; // ISO timestamp
}

/**
 * Performance Analysis Data Interface
 * Contains analysis metrics and feedback from the interview
 */
export interface PerformanceAnalysis {
  overall_score?: number;
  hire_verdict?: string;
  communication_assessment?: {
    overall_score?: number;
    clarity?: number;
    structure?: number;
    confidence?: number;
    strengths?: string[];
    gaps?: string[];
    summary?: string;
  };
  skill_gaps?: string[];
  communication_gaps?: string[];
  behavioral_star_analysis?: Array<{
    question?: string;
    scores?: {
      situation?: boolean;
      task?: boolean;
      action?: boolean;
      result?: boolean;
    };
    feedback?: string;
  }>;
  remediation_plan?: {
    summary?: string;
    tactical_strategies?: Array<{
      gap: string;
      strategy?: {
        step_1_clarification?: string;
        step_2_approach?: string;
        step_3_iterate?: string;
        step_4_pressure_test?: string;
      };
    }>;
  };
}

/**
 * VideoResultsPanelProps Interface
 */
export interface VideoResultsPanelProps {
  videoMetadata: VideoMetadata;
  performanceAnalysis?: PerformanceAnalysis;
  recordingMode: "audio" | "video";
  onDownload: () => void;
  onRetryInterview?: () => void;
}

/**
 * Format seconds to MM:SS format
 */
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * VideoResultsPanel Component
 *
 * A comprehensive results panel that combines:
 * 1. Video playback (left/top on desktop, top on mobile)
 * 2. Recording metadata display
 * 3. Performance analysis (right side on desktop, below on mobile)
 * 4. Timestamp markers section with mark/list/delete
 * 5. Notes/comments area for self-review
 * 6. Responsive layout (desktop side-by-side, mobile stacked)
 * 7. Retry interview button
 *
 * **Sub-tasks Implemented:**
 * - 3.2.1 VideoPlayer composed on left/top section
 * - 3.2.2 Recording metadata display (duration, file size, timestamp, mode)
 * - 3.2.3 Performance analysis display on right side
 * - 3.2.4 Timestamp markers section with mark/list/delete functionality
 * - 3.2.5 Notes/comments area for self-review
 * - 3.2.6 Responsive layout (desktop side-by-side, mobile stacked)
 * - 3.2.7 Retry Interview button
 *
 * @component
 * @example
 * ```tsx
 * <VideoResultsPanel
 *   videoMetadata={{...}}
 *   performanceAnalysis={{...}}
 *   recordingMode="video"
 *   onDownload={() => {}}
 *   onRetryInterview={() => {}}
 * />
 * ```
 */
export const VideoResultsPanel: React.FC<VideoResultsPanelProps> = ({
  videoMetadata,
  performanceAnalysis,
  recordingMode,
  onDownload,
  onRetryInterview,
}) => {
  // State for timestamp markers
  const [markers, setMarkers] = useState<TimestampMarker[]>([]);
  const [markerNote, setMarkerNote] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  
  // State for UI
  const [expandedMarkers, setExpandedMarkers] = useState<Set<string>>(new Set());
  const [expandedAnalysis, setExpandedAnalysis] = useState(true);
  
  // References
  const markersContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Sub-task 3.2.4: Create timestamp marker on current video time
   */
  const handleMarkTimestamp = (timestamp: number, note?: string) => {
    const newMarker: TimestampMarker = {
      id: `marker-${Date.now()}`,
      timestamp,
      note: note || `Mark at ${formatTime(timestamp)}`,
      createdAt: new Date().toISOString(),
    };
    setMarkers([...markers, newMarker]);
    setMarkerNote("");
  };

  /**
   * Sub-task 3.2.4: Delete timestamp marker
   */
  const handleDeleteMarker = (markerId: string) => {
    setMarkers(markers.filter((m) => m.id !== markerId));
  };

  /**
   * Toggle marker expansion for notes
   */
  const toggleMarkerExpanded = (markerId: string) => {
    setExpandedMarkers((prev) => {
      const next = new Set(prev);
      if (next.has(markerId)) {
        next.delete(markerId);
      } else {
        next.add(markerId);
      }
      return next;
    });
  };

  /**
   * Toggle analysis section expansion
   */
  const toggleAnalysisExpanded = () => {
    setExpandedAnalysis(!expandedAnalysis);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        width: "100%",
        padding: "0",
      }}
    >
      {/* Main Content Container - Responsive Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          width: "100%",
          "@media (max-width: 1024px)": {
            gridTemplateColumns: "1fr",
          },
        } as React.CSSProperties & { "@media (max-width: 1024px)": React.CSSProperties }}
      >
        {/* Left Column: Video Player */}
        <div style={{ width: "100%" }}>
          <VideoPlayer
            videoUrl={videoMetadata.videoUrl}
            videoMetadata={videoMetadata}
            recordingMode={recordingMode}
            onDownload={onDownload}
            onTimestampMarked={handleMarkTimestamp}
          />
        </div>

        {/* Right Column: Performance Analysis & Metadata */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            width: "100%",
          }}
        >
          {/* Sub-task 3.2.2: Recording Metadata Panel */}
          <div
            style={{
              padding: "1rem",
              background: "rgba(99, 102, 241, 0.05)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#818cf8",
                marginBottom: "1rem",
                letterSpacing: "0.05em",
              }}
            >
              RECORDING METADATA
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1rem",
              }}
            >
              <MetadataField
                label="Duration"
                value={formatTime(videoMetadata.duration)}
              />
              <MetadataField label="Mode" value={recordingMode === "video" ? "Video + Audio" : "Audio Only"} />
              <MetadataField
                label="Uploaded"
                value={new Date(videoMetadata.uploadedAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" }
                )}
              />
              <MetadataField
                label="File Size"
                value={`${(videoMetadata.fileSize / 1024 / 1024).toFixed(2)} MB`}
              />
            </div>
          </div>

          {/* Sub-task 3.2.3: Performance Analysis Display */}
          {performanceAnalysis && (
            <div
              style={{
                padding: "1rem",
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "12px",
              }}
            >
              <button
                onClick={toggleAnalysisExpanded}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  marginBottom: expandedAnalysis ? "1rem" : "0",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "#818cf8",
                    letterSpacing: "0.05em",
                  }}
                >
                  PERFORMANCE ANALYSIS
                </h3>
                {expandedAnalysis ? (
                  <ChevronUp size={18} color="#818cf8" />
                ) : (
                  <ChevronDown size={18} color="#818cf8" />
                )}
              </button>

              {expandedAnalysis && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Overall Score */}
                  {performanceAnalysis.overall_score !== undefined && (
                    <AnalysisMetric
                      label="Overall Score"
                      value={performanceAnalysis.overall_score.toFixed(1)}
                      max={10}
                    />
                  )}

                  {/* Hire Verdict */}
                  {performanceAnalysis.hire_verdict && (
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#818cf8",
                          fontWeight: 600,
                          marginBottom: "0.25rem",
                        }}
                      >
                        HIRE VERDICT
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--foreground)",
                          padding: "0.5rem",
                          background: "rgba(99, 102, 241, 0.1)",
                          borderRadius: "6px",
                        }}
                      >
                        {performanceAnalysis.hire_verdict}
                      </div>
                    </div>
                  )}

                  {/* Communication Assessment */}
                  {performanceAnalysis.communication_assessment && (
                    <AnalysisSection
                      title="Communication"
                      data={performanceAnalysis.communication_assessment}
                    />
                  )}

                  {/* Skill Gaps */}
                  {performanceAnalysis.skill_gaps &&
                    performanceAnalysis.skill_gaps.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#818cf8",
                            fontWeight: 600,
                            marginBottom: "0.25rem",
                          }}
                        >
                          SKILL GAPS
                        </div>
                        <ul
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--foreground)",
                            paddingLeft: "1rem",
                            lineHeight: "1.6",
                          }}
                        >
                          {performanceAnalysis.skill_gaps.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Timestamp Markers and Notes - Full Width */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          width: "100%",
        }}
      >
        {/* Sub-task 3.2.4: Timestamp Markers Section */}
        <div
          ref={markersContainerRef}
          style={{
            padding: "1rem",
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#818cf8",
              letterSpacing: "0.05em",
            }}
          >
            TIMESTAMP MARKERS
          </h3>

          {/* Mark Timestamp Input */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Add note (optional)..."
              value={markerNote}
              onChange={(e) => setMarkerNote(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleMarkTimestamp(currentVideoTime, markerNote);
                }
              }}
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                color: "var(--foreground)",
                fontSize: "0.85rem",
              }}
            />
            <button
              onClick={() =>
                handleMarkTimestamp(currentVideoTime, markerNote)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                background: "#6366f1",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              <Plus size={16} /> Mark
            </button>
          </div>

          {/* Markers List */}
          {markers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
                color: "#a5b4fc",
                fontSize: "0.85rem",
              }}
            >
              No markers yet. Add markers while reviewing to track important moments.
            </div>
          ) : (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {markers.map((marker) => (
                <div
                  key={marker.id}
                  style={{
                    padding: "0.75rem",
                    background: "rgba(99, 102, 241, 0.08)",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    borderLeft: "2px solid #6366f1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        flex: 1,
                      }}
                      onClick={() => toggleMarkerExpanded(marker.id)}
                    >
                      {expandedMarkers.has(marker.id) ? (
                        <ChevronUp size={14} color="#818cf8" />
                      ) : (
                        <ChevronDown size={14} color="#818cf8" />
                      )}
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: "#e0e7ff",
                        }}
                      >
                        {formatTime(marker.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMarker(marker.id)}
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        borderRadius: "4px",
                        padding: "0.3rem 0.6rem",
                        cursor: "pointer",
                        color: "#fca5a5",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Delete marker"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {expandedMarkers.has(marker.id) && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#a5b4fc",
                        paddingTop: "0.5rem",
                        borderTop: "1px solid rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      {marker.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sub-task 3.2.5: Notes/Comments Area */}
        <div
          style={{
            padding: "1rem",
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#818cf8",
              letterSpacing: "0.05em",
            }}
          >
            SELF-REVIEW NOTES
          </h3>

          <textarea
            placeholder="Add your self-review notes, observations, or action items here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              flex: 1,
              minHeight: "200px",
              padding: "0.75rem",
              borderRadius: "6px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              color: "var(--foreground)",
              fontSize: "0.85rem",
              fontFamily: "monospace",
              resize: "none",
            }}
          />

          <div style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>
            {notes.length} characters
          </div>
        </div>
      </div>

      {/* Sub-task 3.2.7: Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          paddingTop: "1rem",
          borderTop: "1px solid rgba(99, 102, 241, 0.2)",
        }}
      >
        {onRetryInterview && (
          <button
            onClick={onRetryInterview}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "#6366f1",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            <RotateCcw size={18} /> Retry Interview
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * MetadataField Component
 * Renders a single metadata field with label and value
 */
interface MetadataFieldProps {
  label: string;
  value: string | number;
}

const MetadataField: React.FC<MetadataFieldProps> = ({ label, value }) => (
  <div>
    <div
      style={{
        fontSize: "0.7rem",
        color: "#818cf8",
        fontWeight: 600,
        marginBottom: "0.25rem",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "0.9rem",
        color: "var(--foreground)",
        fontWeight: 500,
      }}
    >
      {value}
    </div>
  </div>
);

/**
 * AnalysisMetric Component
 * Renders a metric with score bar visualization
 */
interface AnalysisMetricProps {
  label: string;
  value: number | string;
  max?: number;
}

const AnalysisMetric: React.FC<AnalysisMetricProps> = ({
  label,
  value,
  max = 10,
}) => {
  const numValue = typeof value === "number" ? value : parseFloat(value as string);
  const percentage = (numValue / max) * 100;
  const color =
    numValue >= 8 ? "#10b981" : numValue >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#818cf8",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        <span>{label}</span>
        <span>{numValue.toFixed(1)}</span>
      </div>
      <div
        style={{
          height: "4px",
          background: "rgba(99, 102, 241, 0.1)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            background: color,
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
};

/**
 * AnalysisSection Component
 * Renders a section of analysis with scores and feedback
 */
interface AnalysisSectionProps {
  title: string;
  data: {
    overall_score?: number;
    clarity?: number;
    structure?: number;
    confidence?: number;
    strengths?: string[];
    gaps?: string[];
    summary?: string;
    [key: string]: any;
  };
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ title, data }) => (
  <div>
    <div
      style={{
        fontSize: "0.75rem",
        color: "#818cf8",
        fontWeight: 600,
        marginBottom: "0.5rem",
      }}
    >
      {title.toUpperCase()}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {data.overall_score !== undefined && (
        <AnalysisMetric label="Score" value={data.overall_score} />
      )}
      {data.clarity !== undefined && (
        <AnalysisMetric label="Clarity" value={data.clarity} />
      )}
      {data.structure !== undefined && (
        <AnalysisMetric label="Structure" value={data.structure} />
      )}
      {data.confidence !== undefined && (
        <AnalysisMetric label="Confidence" value={data.confidence} />
      )}
      {data.strengths && data.strengths.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#86efac",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Strengths
          </div>
          <ul
            style={{
              fontSize: "0.8rem",
              paddingLeft: "1rem",
              color: "#86efac",
            }}
          >
            {data.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {data.gaps && data.gaps.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#fca5a5",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Areas for Improvement
          </div>
          <ul
            style={{
              fontSize: "0.8rem",
              paddingLeft: "1rem",
              color: "#fca5a5",
            }}
          >
            {data.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);
