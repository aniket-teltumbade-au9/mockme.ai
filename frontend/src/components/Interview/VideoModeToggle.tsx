"use client";

import React, { useState, useEffect } from "react";
import { Camera, Mic, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * VideoModeToggle Component Props
 *
 * @interface VideoModeToggleProps
 * @property {('audio' | 'video')} defaultMode - The default recording mode when component mounts
 * @property {(mode: 'audio' | 'video') => void} onModeChange - Callback function invoked when user changes recording mode
 * @property {boolean} isDisabled - If true, disables mode selection (component becomes read-only)
 * @property {boolean} [hasCamera] - If provided, uses this value; otherwise auto-detects camera availability at mount
 * @property {(hasCameraDetected: boolean) => void} [onCameraDetectionChange] - Optional callback invoked when camera detection completes
 */
export interface VideoModeToggleProps {
  defaultMode: "audio" | "video";
  onModeChange: (mode: "audio" | "video") => void;
  isDisabled: boolean;
  hasCamera?: boolean;
  onCameraDetectionChange?: (hasCameraDetected: boolean) => void;
  onPermissionChange?: (permissionState: "granted" | "denied" | "prompt" | "unknown") => void;
}

/**
 * VideoModeToggle Component
 *
 * Renders a toggle/radio button interface for users to select between "Audio Only" and "Video + Audio" recording modes.
 * This component should be displayed on the interview setup screen before the interview starts.
 *
 * Features:
 * - Radio button interface for clear mode selection
 * - Auto-detects camera availability on mount using browser APIs (navigator.mediaDevices.enumerateDevices())
 * - Shows camera availability status with clear visual indicators:
 *   - Green checkmark (✓ Camera available) when camera is detected
 *   - Warning badge (⚠ Camera not available) when camera is not found
 * - Disables video mode if camera is unavailable or hardware not detected
 * - **Triggers camera permission request when user selects video mode**
 *   - Prompts browser permission dialog
 *   - Updates component state to reflect permission status
 *   - Shows loading spinner during permission request
 *   - Falls back to audio mode if permission denied
 * - Calls onPermissionChange callback with permission state (granted/denied/prompt/unknown)
 * - Keyboard accessible (arrow keys, Enter for selection)
 * - Triggers onModeChange callback when mode changes
 * - Invokes onCameraDetectionChange callback when detection completes
 * - Disabled state support for when user cannot change mode
 * - Graceful error handling if browser doesn't support mediaDevices API
 *
 * Accessibility:
 * - Uses semantic `<fieldset>` and `<legend>` for grouping related radio buttons
 * - Proper ARIA labels and descriptions
 * - Full keyboard navigation support
 * - Visual feedback for focus and disabled states
 * - Loading state clearly communicated
 *
 * @component
 * @example
 * ```tsx
 * <VideoModeToggle
 *   defaultMode="video"
 *   onModeChange={(mode) => console.log('User selected:', mode)}
 *   isDisabled={false}
 *   onCameraDetectionChange={(hasCamera) => console.log('Camera detected:', hasCamera)}
 *   onPermissionChange={(permission) => console.log('Permission state:', permission)}
 * />
 * ```
 */
export const VideoModeToggle: React.FC<VideoModeToggleProps> = ({
  defaultMode,
  onModeChange,
  isDisabled,
  hasCamera: providedHasCamera,
  onCameraDetectionChange,
  onPermissionChange,
}) => {
  const [selectedMode, setSelectedMode] = useState<"audio" | "video">(defaultMode);
  const [detectedHasCamera, setDetectedHasCamera] = useState<boolean | null>(
    providedHasCamera !== undefined ? providedHasCamera : null
  );
  const [cameraDetectionError, setCameraDetectionError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(providedHasCamera === undefined);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionState, setPermissionState] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");

  // Detect camera availability on component mount
  useEffect(() => {
    // Skip detection if hasCamera was explicitly provided
    if (providedHasCamera !== undefined) {
      return;
    }

    const detectCamera = async () => {
      try {
        setIsDetecting(true);
        setCameraDetectionError(null);

        // Check if the browser supports mediaDevices API
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setCameraDetectionError("Browser does not support camera detection API");
          setDetectedHasCamera(false);
          onCameraDetectionChange?.(false);
          return;
        }

        // Enumerate available devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Look for video input devices (cameras)
        const hasCameraDevice = devices.some((device) => device.kind === "videoinput");

        setDetectedHasCamera(hasCameraDevice);
        setCameraDetectionError(null);
        onCameraDetectionChange?.(hasCameraDevice);
      } catch (error) {
        // Handle permission denied or other errors gracefully
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to detect camera availability";

        // If permission is denied, we can't enumerate devices
        // In this case, assume camera might be available but we just can't detect it
        // This is better UX than assuming it's not available
        if (errorMessage.includes("Permission") || errorMessage.includes("permission")) {
          setDetectedHasCamera(true); // Assume camera exists but permissions not granted
          setCameraDetectionError(
            "Camera permissions not granted. You will be prompted for access when needed."
          );
          onCameraDetectionChange?.(true);
        } else {
          setDetectedHasCamera(false);
          setCameraDetectionError(errorMessage);
          onCameraDetectionChange?.(false);
        }
      } finally {
        setIsDetecting(false);
      }
    };

    detectCamera();
  }, [providedHasCamera, onCameraDetectionChange]);

  // Use provided hasCamera or detected value
  const hasCamera = providedHasCamera !== undefined ? providedHasCamera : detectedHasCamera ?? false;

  // Request camera permission from browser
  const requestCameraPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    try {
      // Check if browser supports mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraDetectionError("Browser does not support camera permissions");
        setPermissionState("denied");
        onPermissionChange?.("denied");
        return false;
      }

      // Request camera permission by attempting to get video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      // Permission granted - clean up the test stream immediately
      stream.getTracks().forEach((track) => track.stop());

      setPermissionState("granted");
      setCameraDetectionError(null);
      onPermissionChange?.("granted");
      return true;
    } catch (error) {
      let state: "denied" | "prompt" | "unknown" = "denied";
      let errorMsg = "";

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          state = "denied";
          errorMsg = "Camera permission denied. Please enable camera access in your browser settings.";
        } else if (error.name === "NotFoundError") {
          state = "denied";
          errorMsg = "No camera hardware found. Please check your device.";
        } else if (error.name === "TimeoutError") {
          state = "prompt";
          errorMsg = "Camera permission request timed out.";
        } else {
          state = "unknown";
          errorMsg = error.message;
        }
      } else {
        state = "unknown";
        errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      }

      setPermissionState(state);
      setCameraDetectionError(errorMsg);
      onPermissionChange?.(state);
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Handle mode selection - trigger permission request for video mode
  const handleModeChange = async (mode: "audio" | "video") => {
    if (isDisabled) return;
    if (mode === "video" && !hasCamera) return; // Prevent selecting video if no camera

    // If selecting video mode, request camera permission
    if (mode === "video" && permissionState !== "granted") {
      const permissionGranted = await requestCameraPermission();
      if (!permissionGranted) {
        // Permission denied - revert to audio mode
        setSelectedMode("audio");
        onModeChange("audio");
        return;
      }
    }

    setSelectedMode(mode);
    onModeChange(mode);
  };

  // Handle keyboard navigation (arrow keys)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>, mode: "audio" | "video") => {
    if (isDisabled) return;

    // Arrow keys for navigation between radio buttons
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      if (mode === "audio") {
        if (hasCamera) {
          await handleModeChange("video");
        }
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      if (mode === "video") {
        await handleModeChange("audio");
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      await handleModeChange(mode);
    }
  };

  const audioModeDisabled = isDisabled;
  const videoModeDisabled = isDisabled || !hasCamera;

  return (
    <fieldset
      style={{
        border: "none",
        padding: 0,
        margin: 0,
        marginBottom: "1.5rem",
      }}
      disabled={isDisabled}
    >
      <legend
        style={{
          display: "block",
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "var(--foreground)",
        }}
      >
        Recording Mode
      </legend>

      {/* Camera Availability Status Indicator */}
      {!isDetecting && (
        <div
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            background: hasCamera
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            border: hasCamera
              ? "1px solid rgba(34, 197, 94, 0.3)"
              : "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          {hasCamera ? (
            <>
              <CheckCircle2
                size={16}
                style={{ color: "#22c55e", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#86efac",
                  fontWeight: 500,
                }}
              >
                ✓ Camera available
              </span>
            </>
          ) : (
            <>
              <AlertCircle
                size={16}
                style={{ color: "#ef4444", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#fca5a5",
                  fontWeight: 500,
                }}
              >
                ⚠ Camera not available
              </span>
            </>
          )}
        </div>
      )}

      {/* Detecting message */}
      {isDetecting && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "8px",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            fontSize: "0.75rem",
            color: "#93c5fd",
          }}
        >
          Detecting camera...
        </div>
      )}

      {/* Mode Selection Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "0.5rem",
        }}
      >
        {/* Audio Only Option */}
        <div
          role="radio"
          tabIndex={audioModeDisabled ? -1 : 0}
          aria-checked={selectedMode === "audio"}
          aria-disabled={audioModeDisabled}
          aria-label="Audio only mode"
          aria-describedby="audio-mode-description"
          onKeyDown={(e) => handleKeyDown(e, "audio")}
          onClick={() => handleModeChange("audio")}
          style={{
            padding: "1rem",
            background:
              selectedMode === "audio"
                ? "rgba(99, 102, 241, 0.15)"
                : "rgba(255, 255, 255, 0.05)",
            border:
              selectedMode === "audio"
                ? "2px solid #6366f1"
                : "2px solid var(--border)",
            borderRadius: "12px",
            cursor: audioModeDisabled ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: audioModeDisabled ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!audioModeDisabled) {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
              e.currentTarget.style.borderColor = "#818cf8";
            }
          }}
          onMouseLeave={(e) => {
            if (!audioModeDisabled) {
              e.currentTarget.style.background =
                selectedMode === "audio"
                  ? "rgba(99, 102, 241, 0.15)"
                  : "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor =
                selectedMode === "audio" ? "#6366f1" : "var(--border)";
            }
          }}
        >
          {/* Radio Button Indicator */}
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "2px solid",
              borderColor: selectedMode === "audio" ? "#6366f1" : "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backgroundColor: selectedMode === "audio" ? "#6366f1" : "transparent",
            }}
          >
            {selectedMode === "audio" && (
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                }}
              />
            )}
          </div>

          {/* Audio Icon and Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
            <Mic size={18} style={{ color: selectedMode === "audio" ? "#818cf8" : "var(--foreground-muted)" }} />
            <div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: selectedMode === "audio" ? "#818cf8" : "var(--foreground)",
                }}
              >
                Audio Only
              </div>
              <div
                id="audio-mode-description"
                style={{
                  fontSize: "0.7rem",
                  color: "var(--foreground-muted)",
                  marginTop: "0.2rem",
                }}
              >
                Microphone only
              </div>
            </div>
          </div>
        </div>

        {/* Video + Audio Option */}
        <div
          role="radio"
          tabIndex={videoModeDisabled || isRequestingPermission ? -1 : 0}
          aria-checked={selectedMode === "video"}
          aria-disabled={videoModeDisabled || isRequestingPermission}
          aria-label="Video and audio mode"
          aria-describedby="video-mode-description"
          onKeyDown={(e) => handleKeyDown(e, "video")}
          onClick={() => handleModeChange("video")}
          style={{
            padding: "1rem",
            background:
              selectedMode === "video"
                ? "rgba(99, 102, 241, 0.15)"
                : "rgba(255, 255, 255, 0.05)",
            border:
              selectedMode === "video"
                ? "2px solid #6366f1"
                : "2px solid var(--border)",
            borderRadius: "12px",
            cursor: videoModeDisabled || isRequestingPermission ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: videoModeDisabled || isRequestingPermission ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!videoModeDisabled && !isRequestingPermission) {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
              e.currentTarget.style.borderColor = "#818cf8";
            }
          }}
          onMouseLeave={(e) => {
            if (!videoModeDisabled && !isRequestingPermission) {
              e.currentTarget.style.background =
                selectedMode === "video"
                  ? "rgba(99, 102, 241, 0.15)"
                  : "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor =
                selectedMode === "video" ? "#6366f1" : "var(--border)";
            }
          }}
        >
          {/* Radio Button Indicator */}
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "2px solid",
              borderColor: selectedMode === "video" ? "#6366f1" : "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backgroundColor: selectedMode === "video" ? "#6366f1" : "transparent",
            }}
          >
            {selectedMode === "video" && (
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                }}
              />
            )}
          </div>

          {/* Video Icon and Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
            {isRequestingPermission && selectedMode === "video" ? (
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2px solid #818cf8",
                  borderTop: "2px solid rgba(129, 140, 248, 0.3)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <Camera size={18} style={{ color: selectedMode === "video" ? "#818cf8" : "var(--foreground-muted)" }} />
            )}
            <div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: selectedMode === "video" ? "#818cf8" : "var(--foreground)",
                }}
              >
                {isRequestingPermission && selectedMode === "video" ? "Requesting access..." : "Video + Audio"}
              </div>
              <div
                id="video-mode-description"
                style={{
                  fontSize: "0.7rem",
                  color: "var(--foreground-muted)",
                  marginTop: "0.2rem",
                }}
              >
                {isRequestingPermission && selectedMode === "video"
                  ? "Waiting for permission..."
                  : "Webcam & microphone"}
              </div>
            </div>
          </div>
        </div>

        {/* Add spin animation for loading state */}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>

      {/* Camera Unavailable Warning */}
      {!hasCamera && !isDetecting && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "0.75rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600 }}>⚠️</span>
          <span>Video mode is unavailable. Please enable camera hardware or use audio-only mode.</span>
        </div>
      )}

      {/* Camera Detection Error Message */}
      {cameraDetectionError && !isDetecting && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "0.5rem 0.75rem",
            background: "rgba(249, 115, 22, 0.1)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            borderRadius: "8px",
            color: "#fed7aa",
            fontSize: "0.7rem",
            marginTop: "0.5rem",
          }}
        >
          {cameraDetectionError}
        </div>
      )}
    </fieldset>
  );
};
