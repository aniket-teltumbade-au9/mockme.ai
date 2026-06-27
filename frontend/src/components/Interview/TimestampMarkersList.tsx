/**
 * TimestampMarkersList Component
 * 
 * Displays a list of video timestamp markers with functionality to:
 * - Click to seek to marked timestamp (sub-task 3.3.4)
 * - Delete individual markers (sub-task 3.3.5)
 * - Display marker notes/descriptions
 * - Show formatted timestamps
 * 
 * Implements sub-tasks 3.3.3 and 3.3.5
 */

import React from "react";
import { Trash2, Play } from "lucide-react";
import { TimestampMarker } from "../../hooks/useTimestampMarkers";

interface TimestampMarkersListProps {
  markers: TimestampMarker[];
  currentTime: number;
  onMarkerClick: (marker: TimestampMarker) => void;
  onMarkerDelete: (markerId: string) => void;
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
 * TimestampMarkersList Component
 * 
 * Renders a list of timestamp markers with:
 * - Clickable marker items that seek to timestamp
 * - Delete buttons to remove markers
 * - Optional note/description display
 * - Highlighting of current position
 * - Responsive layout
 * 
 * @component
 * @example
 * ```tsx
 * <TimestampMarkersList
 *   markers={[
 *     {
 *       id: "m1",
 *       timestamp: 45.5,
 *       note: "Stumbled on this answer",
 *       createdAt: "2024-01-15T10:30:00Z"
 *     }
 *   ]}
 *   currentTime={45.5}
 *   onMarkerClick={(marker) => console.log('Seek to', marker.timestamp)}
 *   onMarkerDelete={(id) => console.log('Delete', id)}
 * />
 * ```
 */
export const TimestampMarkersList: React.FC<TimestampMarkersListProps> = ({
  markers,
  currentTime,
  onMarkerClick,
  onMarkerDelete,
}) => {
  if (markers.length === 0) {
    return (
      <div
        style={{
          padding: "2rem 1rem",
          textAlign: "center",
          color: "#a5b4fc",
          fontSize: "0.9rem",
        }}
      >
        No timestamps marked yet. Click "Mark" during playback to add markers.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {markers.map((marker) => {
        const isNearCurrent =
          Math.abs(marker.timestamp - currentTime) < 0.5;

        return (
          <div
            key={marker.id}
            onClick={() => onMarkerClick(marker)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: isNearCurrent
                ? "rgba(99, 102, 241, 0.2)"
                : "rgba(99, 102, 241, 0.08)",
              border: `1px solid ${
                isNearCurrent
                  ? "rgba(99, 102, 241, 0.4)"
                  : "rgba(99, 102, 241, 0.2)"
              }`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isNearCurrent
                ? "rgba(99, 102, 241, 0.2)"
                : "rgba(99, 102, 241, 0.08)";
              e.currentTarget.style.borderColor = isNearCurrent
                ? "rgba(99, 102, 241, 0.4)"
                : "rgba(99, 102, 241, 0.2)";
            }}
            role="button"
            tabIndex={0}
            aria-label={`Seek to ${formatTime(marker.timestamp)}${
              marker.note ? ": " + marker.note : ""
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onMarkerClick(marker);
              }
            }}
          >
            {/* Timestamp and Play Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: "60px",
              }}
            >
              <Play
                size={14}
                style={{
                  flexShrink: 0,
                  color: "#6366f1",
                }}
              />
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#818cf8",
                  fontFamily: "monospace",
                }}
              >
                {formatTime(marker.timestamp)}
              </span>
            </div>

            {/* Note/Description */}
            {marker.note && (
              <div
                style={{
                  flex: 1,
                  fontSize: "0.85rem",
                  color: "#d4d4d8",
                  wordBreak: "break-word",
                  minWidth: 0,
                }}
              >
                {marker.note}
              </div>
            )}

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkerDelete(marker.id);
              }}
              aria-label={`Delete marker at ${formatTime(marker.timestamp)}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                minWidth: "28px",
                flexShrink: 0,
                borderRadius: "6px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
