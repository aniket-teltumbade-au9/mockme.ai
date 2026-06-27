"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle, Volume2 } from "lucide-react";

/**
 * VideoPreview Component Props
 *
 * @interface VideoPreviewProps
 * @property {MediaStream | null} mediaStream - The MediaStream object from getUserMedia() containing video/audio tracks
 * @property {('audio' | 'video')} recordingMode - The recording mode: 'audio' for audio-only, 'video' for video+audio
 * @property {boolean} isRecording - Whether the interview is currently recording
 */
export interface VideoPreviewProps {
  mediaStream: MediaStream | null;
  recordingMode: "audio" | "video";
  isRecording: boolean;
}

/**
 * VideoPreview Component
 *
 * Displays a live video stream from the user's webcam during an interview recording session.
 * This component implements the following features:
 *
 * Features:
 * 1. **Live Video Stream Display** (Sub-task 2.3.1)
 *    - Uses HTML5 <video> element with autoplay and muted attributes
 *    - Attaches MediaStream to video element for live preview
 *    - Ensures video plays immediately without user interaction
 *
 * 2. **Recording Badge** (Sub-task 2.3.2)
 *    - Shows "● Recording" badge when isRecording prop is true
 *    - Hidden when isRecording is false
 *    - Red pulsing indicator with text label
 *
 * 3. **Mode Indicator Badge** (Sub-task 2.3.3)
 *    - Displays "Video" badge when recordingMode is 'video'
 *    - Displays "Audio-Only" badge when recordingMode is 'audio'
 *    - Positioned in top-right corner
 *
 * 4. **Null/Undefined MediaStream Handling** (Sub-task 2.3.4)
 *    - Gracefully handles null or undefined mediaStream
 *    - Shows placeholder message when stream is not available
 *    - Does not break when stream is missing
 *
 * 5. **Error Messages** (Sub-task 2.3.5)
 *    - Displays error message with icon when stream is unavailable
 *    - Provides guidance to user on how to enable camera
 *    - Clear, user-friendly error text
 *
 * 6. **Layout Sizing** (Sub-task 2.3.6)
 *    - Responsive sizing appropriate for interview UI layout
 *    - Maintains aspect ratio (16:9)
 *    - Fits in interview sidebar/panel without overflow
 *    - Mobile-responsive with proper sizing
 *
 * Styling:
 * - Uses inline styles and CSS classes for consistency
 * - Dark theme with subtle borders and rounded corners
 * - Badge positioning and styling consistent with design system
 * - Accessible color contrast ratios
 *
 * Accessibility:
 * - Muted video to prevent autoplay sound issues
 * - ARIA labels for badges and error states
 * - Semantic HTML structure
 * - Video element labeled for screen readers
 *
 * @component
 * @example
 * ```tsx
 * // Video mode with stream and recording
 * <VideoPreview
 *   mediaStream={mediaStream}
 *   recordingMode="video"
 *   isRecording={true}
 * />
 *
 * // Audio-only mode
 * <VideoPreview
 *   mediaStream={null}
 *   recordingMode="audio"
 *   isRecording={true}
 * />
 *
 * // No stream available
 * <VideoPreview
 *   mediaStream={null}
 *   recordingMode="video"
 *   isRecording={false}
 * />
 * ```
 */
export const VideoPreview: React.FC<VideoPreviewProps> = ({
  mediaStream,
  recordingMode,
  isRecording,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Attach MediaStream to video element when stream changes
   * Uses useEffect to handle stream attachment and cleanup
   */
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (mediaStream) {
      // Attach the MediaStream to the video element
      videoElement.srcObject = mediaStream;

      // Ensure video plays (autoplay might be blocked by browser policies)
      const playPromise = videoElement.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((error) => {
          console.warn("Video autoplay failed:", error);
          // Silently fail - video element will show but won't play
          // This can happen in some browser security contexts
        });
      }
    } else {
      // Clear the video element if stream is null/undefined
      videoElement.srcObject = null;
    }

    // Cleanup: stop video playback when component unmounts or stream changes
    return () => {
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    };
  }, [mediaStream]);

  // Determine if we should show the error state
  const isStreamUnavailable = recordingMode === "video" && !mediaStream;
  const isAudioOnly = recordingMode === "audio";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      {/* Main Video Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#000",
          borderRadius: "12px",
          border: "2px solid rgba(99, 102, 241, 0.3)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        role="region"
        aria-label={recordingMode === "video" ? "Live video preview" : "Audio recording"}
      >
        {/* Sub-task 2.3.1: Live Video Stream Display */}
        {mediaStream && recordingMode === "video" && (
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)", // Mirror the video for better UX (like a mirror in the room)
            }}
            autoPlay
            muted={true}
            playsInline
            aria-label="Live video stream from webcam"
          />
        )}

        {/* Sub-task 2.3.4 & 2.3.5: Error State - Stream Unavailable */}
        {isStreamUnavailable && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "2rem",
              textAlign: "center",
            }}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <AlertCircle
              size={48}
              style={{
                color: "#ef4444",
                opacity: 0.8,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#fca5a5",
                }}
              >
                Camera Unavailable
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#f87171",
                  lineHeight: "1.4",
                }}
              >
                Please enable your camera and grant permission to continue.
              </div>
            </div>
          </div>
        )}

        {/* Sub-task 2.3.4: Graceful Handling - Audio-Only Mode */}
        {isAudioOnly && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <Volume2
              size={48}
              style={{
                color: "#818cf8",
                opacity: 0.8,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "#818cf8",
                }}
              >
                Audio-Only Mode
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#a5b4fc",
                  lineHeight: "1.4",
                }}
              >
                Recording audio only. No video will be captured.
              </div>
            </div>
          </div>
        )}

        {/* Sub-task 2.3.2: Recording Badge */}
        {isRecording && (
          <div
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "rgba(239, 68, 68, 0.95)",
              borderRadius: "20px",
              backdropFilter: "blur(4px)",
              zIndex: 10,
            }}
            aria-label="Recording indicator"
            role="status"
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#fca5a5",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            >
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
              `}</style>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "0.5px",
              }}
            >
              ● Recording
            </span>
          </div>
        )}

        {/* Sub-task 2.3.3: Mode Indicator Badge */}
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.4rem 0.8rem",
            background: "rgba(59, 130, 246, 0.9)",
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 700,
            borderRadius: "12px",
            backdropFilter: "blur(4px)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            zIndex: 9,
          }}
          aria-label={`Recording mode: ${recordingMode === "video" ? "Video and audio" : "Audio only"}`}
          role="status"
        >
          {recordingMode === "video" ? "Video" : "Audio-Only"}
        </div>
      </div>

      {/* Sub-task 2.3.6: Layout Information - Responsive Sizing Info */}
      <div
        style={{
          marginTop: "0.75rem",
          padding: "0.5rem 0.75rem",
          background: "rgba(99, 102, 241, 0.1)",
          borderRadius: "8px",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          fontSize: "0.7rem",
          color: "#a5b4fc",
          textAlign: "center",
          lineHeight: "1.4",
        }}
        aria-live="polite"
        aria-label="Recording information"
      >
        {recordingMode === "video" && mediaStream ? (
          <span>Live preview • Camera enabled • Ready to record</span>
        ) : recordingMode === "video" && !mediaStream ? (
          <span>Camera not available • Fallback to audio recommended</span>
        ) : (
          <span>Audio mode • Camera disabled • Audio recording active</span>
        )}
      </div>
    </div>
  );
};
