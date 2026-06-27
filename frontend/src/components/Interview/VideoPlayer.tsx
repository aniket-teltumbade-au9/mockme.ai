"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useVideoDownload } from "@/hooks/useVideoDownload";

/**
 * VideoMetadata Interface
 * Contains metadata about a recorded video file
 */
export interface VideoMetadata {
  videoUrl: string;
  duration: number; // seconds
  fileSize: number; // bytes
  codec: string; // 'h264', 'vp8', 'vp9'
  width: number;
  height: number;
  frameRate: number;
  uploadedAt: string; // ISO timestamp
  recordingMode: "audio" | "video";
}

/**
 * VideoPlayerProps Interface
 * Props for the VideoPlayer component
 */
export interface VideoPlayerProps {
  videoUrl: string;
  videoMetadata: VideoMetadata;
  recordingMode: "audio" | "video";
  sessionId: string;
  onDownload?: () => void;
  onTimestampMarked: (timestamp: number, note?: string) => void;
}

/**
 * Format bytes to human-readable file size string
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

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
 * VideoPlayer Component
 *
 * A comprehensive HTML5 video player component with custom controls including:
 * - Play/Pause controls
 * - Volume control with mute
 * - Progress bar with scrubbing support
 * - Fullscreen button
 * - Playback speed selector (0.75x, 1x, 1.25x, 1.5x)
 * - Download button to export video file with progress tracking
 * - Video metadata display (duration, file size, upload date)
 * - Error messages for playback and download failures
 *
 * Download Features (Task 3.4):
 * 1. Download button with progress indication (Sub-tasks 3.4.1, 3.4.4)
 * 2. Filename generation with sessionId and date (Sub-task 3.4.2)
 * 3. Browser file download triggering (Sub-task 3.4.3)
 * 4. Error handling for download failures (Sub-task 3.4.5)
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoMetadata,
  recordingMode,
  sessionId,
  onDownload,
  onTimestampMarked,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize download hook
  const { isDownloading, progress, error: downloadError, downloadVideo } = useVideoDownload(videoUrl, sessionId);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const previousVolumeRef = useRef<number>(1);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((error) => {
        setPlaybackError(`Failed to play: ${error.message}`);
      });
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      const restoredVolume = previousVolumeRef.current || 1;
      videoRef.current.volume = restoredVolume;
      setVolume(restoredVolume);
      setIsMuted(false);
    } else {
      previousVolumeRef.current = volume;
      videoRef.current.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handlePlaybackRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setPlaybackError("Failed to enter fullscreen mode");
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoadingMetadata(false);
      setPlaybackError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      const errorCode = video.error?.code;
      let errorMessage = "Video playback failed";
      switch (errorCode) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Video playback was aborted";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Network error while loading video";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = "Video decode error. The format may not be supported.";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Video format not supported by your browser";
          break;
      }
      setPlaybackError(errorMessage);
      setIsLoadingMetadata(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const handleMarkTimestamp = () => {
    onTimestampMarked(currentTime);
  };

  const handleDownload = async () => {
    try {
      setDownloadSuccess(false);
      await downloadVideo();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      console.error("Download failed:", err);
    }
    onDownload?.();
  };

  const uploadedDate = new Date(videoMetadata.uploadedAt);
  const formattedDate = uploadedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {playbackError && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "0.2rem" }} />
          <div>{playbackError}</div>
        </div>
      )}

      {downloadError && (
        <div
          role="alert"
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "0.9rem",
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "0.2rem" }} />
          <div>Download failed: {downloadError}</div>
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          background: "#000",
          borderRadius: "12px",
          border: "2px solid rgba(99, 102, 241, 0.2)",
          overflow: "hidden",
          aspectRatio: "16 / 9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          crossOrigin="anonymous"
          aria-label="Interview video playback"
        />

        {isLoadingMetadata && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "3px solid rgba(99, 102, 241, 0.2)",
                borderTop: "3px solid #6366f1",
                animation: "spin 1s linear infinite",
              }}
            >
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
            <div style={{ fontSize: "0.9rem", color: "#a5b4fc" }}>Loading video...</div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          background: "rgba(99, 102, 241, 0.05)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "12px",
          padding: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            color: "#a5b4fc",
          }}
        >
          <span style={{ minWidth: "40px" }}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            style={{
              flex: 1,
              cursor: "pointer",
              height: "4px",
              appearance: "none",
              background: "linear-gradient(to right, #6366f1 0%, #6366f1 var(--value), rgba(99, 102, 241, 0.2) var(--value), rgba(99, 102, 241, 0.2) 100%)",
              "--value": `${(currentTime / (duration || 1)) * 100}%`,
              borderRadius: "2px",
              outline: "none",
            } as React.CSSProperties & { "--value": string }}
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          />
          <span style={{ minWidth: "40px" }}>{formatTime(duration)}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#6366f1",
                border: "none",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#818cf8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
              }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={handleMuteToggle}
                aria-label={isMuted ? "Unmute" : "Mute"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.2)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "#818cf8",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                }}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Volume control"
                style={{
                  width: "80px",
                  height: "4px",
                  cursor: "pointer",
                  appearance: "none",
                  background: "linear-gradient(to right, #6366f1 0%, #6366f1 var(--value), rgba(99, 102, 241, 0.2) var(--value), rgba(99, 102, 241, 0.2) 100%)",
                  "--value": `${volume * 100}%`,
                  borderRadius: "2px",
                  outline: "none",
                } as React.CSSProperties & { "--value": string }}
              />
            </div>

            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              aria-label="Playback speed"
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
              }}
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={handleMarkTimestamp}
              aria-label="Mark timestamp"
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
              }}
            >
              Mark ({formatTime(currentTime)})
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label={isDownloading ? `Downloading... ${progress}%` : "Download video"}
              title={isDownloading ? `Downloading... ${progress}%` : "Download video"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: downloadSuccess
                  ? "rgba(34, 197, 94, 0.3)"
                  : isDownloading
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(34, 197, 94, 0.2)",
                border: downloadSuccess
                  ? "1px solid rgba(34, 197, 94, 0.5)"
                  : isDownloading
                    ? "1px solid rgba(59, 130, 246, 0.3)"
                    : "1px solid rgba(34, 197, 94, 0.3)",
                color: downloadSuccess ? "#86efac" : isDownloading ? "#93c5fd" : "#86efac",
                cursor: isDownloading ? "wait" : "pointer",
                transition: "all 0.2s ease",
                padding: 0,
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isDownloading && !downloadSuccess) {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isDownloading && !downloadSuccess) {
                  e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)";
                }
              }}
            >
              {downloadSuccess ? (
                <CheckCircle size={18} />
              ) : (
                <Download size={18} style={{ opacity: isDownloading ? 0.6 : 1 }} />
              )}
              {isDownloading && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "2px",
                    width: `${progress}%`,
                    background: "#3b82f6",
                    transition: "width 0.2s ease",
                  }}
                />
              )}
            </button>

            <button
              onClick={handleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#818cf8",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
              }}
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          padding: "1rem",
          background: "rgba(99, 102, 241, 0.05)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
            Duration
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--foreground)" }}>
            {formatTime(videoMetadata.duration)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
            File Size
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--foreground)" }}>
            {formatFileSize(videoMetadata.fileSize)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
            Uploaded
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--foreground)" }}>
            {formattedDate}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
            Mode
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--foreground)" }}>
            {recordingMode === "video" ? "Video + Audio" : "Audio Only"}
          </div>
        </div>

        {recordingMode === "video" && (
          <div>
            <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
              Resolution
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--foreground)" }}>
              {videoMetadata.width}x{videoMetadata.height}
            </div>
          </div>
        )}

        {recordingMode === "video" && (
          <div>
            <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600, marginBottom: "0.25rem" }}>
              Frame Rate
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--foreground)" }}>
              {videoMetadata.frameRate} fps
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
