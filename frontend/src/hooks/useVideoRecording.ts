import { useRef, useState, useCallback, useEffect } from "react";

export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export interface UseVideoRecordingReturn {
  isRecording: boolean;
  recordingMode: "audio" | "video";
  videoPreviewStream: MediaStream | null;
  recordingError: Error | null;
  cameraPermission: PermissionState;
  microphonePermission: PermissionState;
  isCameraAvailable: boolean;
  supportedVideoCodec: string | null;
  supportedAudioCodec: string | null;
  startRecording: (mode: "audio" | "video") => Promise<void>;
  stopRecording: () => Promise<{ videoBlob?: Blob; audioBlob: Blob; videoCodec?: string; audioCodec?: string }>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  requestCameraPermission: () => Promise<PermissionState>;
  requestMicrophonePermission: () => Promise<PermissionState>;
  retryPermissionRequest: (type: "camera" | "microphone") => Promise<PermissionState>;
}

export const useVideoRecording = (): UseVideoRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<"audio" | "video">("audio");
  const [videoPreviewStream, setVideoPreviewStream] = useState<MediaStream | null>(null);
  const [recordingError, setRecordingError] = useState<Error | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("unknown");
  const [microphonePermission, setMicrophonePermission] = useState<PermissionState>("unknown");
  const [isCameraAvailable, setIsCameraAvailable] = useState(false);
  const [supportedVideoCodec, setSupportedVideoCodec] = useState<string | null>(null);
  const [supportedAudioCodec, setSupportedAudioCodec] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const permissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordedVideoCodecRef = useRef<string | null>(null);
  const recordedAudioCodecRef = useRef<string | null>(null);

  // Check browser support
  const checkBrowserSupport = useCallback((): Error | null => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return new Error("getUserMedia API is not supported by this browser");
    }
    if (!MediaRecorder) {
      return new Error("MediaRecorder API is not supported by this browser");
    }
    return null;
  }, []);

  // Check if camera hardware is available
  const checkCameraAvailability = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return false;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((device) => device.kind === "videoinput");
    } catch (err) {
      console.warn("Error checking camera availability:", err);
      return false;
    }
  }, []);

  // Query permission status using Permissions API
  const queryPermissionStatus = useCallback(
    async (type: "camera" | "microphone"): Promise<PermissionState> => {
      try {
        if (!navigator.permissions?.query) {
          return "unknown";
        }

        const permissionName =
          type === "camera" ? "camera" : "microphone";
        const result = await navigator.permissions.query({
          name: permissionName as PermissionName,
        });

        return (result.state as PermissionState) || "unknown";
      } catch (err) {
        console.warn(`Error querying ${type} permission:`, err);
        return "unknown";
      }
    },
    []
  );

  // Initialize permission states on mount
  useEffect(() => {
    const initializePermissions = async () => {
      const cameraAvailable = await checkCameraAvailability();
      setIsCameraAvailable(cameraAvailable);

      const cameraState = await queryPermissionStatus("camera");
      const micState = await queryPermissionStatus("microphone");

      setCameraPermission(cameraState);
      setMicrophonePermission(micState);
    };

    initializePermissions();
  }, [checkCameraAvailability, queryPermissionStatus]);

  // Request camera permission and handle user response
  const requestCameraPermission = useCallback(async (): Promise<PermissionState> => {
    setRecordingError(null);

    try {
      // Check browser support first
      const supportError = checkBrowserSupport();
      if (supportError) {
        setCameraPermission("denied");
        return "denied";
      }

      // Check hardware availability
      const available = await checkCameraAvailability();
      if (!available) {
        setIsCameraAvailable(false);
        const error = new Error("Camera unavailable: no camera hardware detected");
        setRecordingError(error);
        setCameraPermission("denied");
        return "denied";
      }

      // Set timeout for permission request (5 seconds)
      const timeoutPromise = new Promise<PermissionState>((_, reject) => {
        permissionTimeoutRef.current = setTimeout(() => {
          reject(
            new Error("Camera permission request timed out after 5 seconds")
          );
        }, 5000);
      });

      // Request permission with timeout
      const permissionPromise = (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });

          // Clean up the test stream immediately
          stream.getTracks().forEach((track) => track.stop());

          // Update permission state
          const newState = await queryPermissionStatus("camera");
          setCameraPermission(newState);
          return newState;
        } catch (err) {
          let state: PermissionState = "denied";

          if (
            err instanceof DOMException &&
            err.name === "NotAllowedError"
          ) {
            state = "denied";
          } else if (
            err instanceof DOMException &&
            err.name === "NotFoundError"
          ) {
            state = "denied";
            setIsCameraAvailable(false);
            setRecordingError(
              new Error("Camera unavailable: no camera hardware detected")
            );
          } else if (
            err instanceof DOMException &&
            err.name === "TimeoutError"
          ) {
            state = "prompt";
            setRecordingError(new Error("Camera permission request timed out"));
          } else {
            state = "unknown";
            setRecordingError(
              err instanceof Error ? err : new Error("Unknown error")
            );
          }

          setCameraPermission(state);
          return state;
        }
      })();

      const result = await Promise.race([permissionPromise, timeoutPromise]);
      clearTimeout(permissionTimeoutRef.current!);
      return result;
    } catch (err) {
      clearTimeout(permissionTimeoutRef.current!);

      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setRecordingError(error);
      setCameraPermission("denied");
      return "denied";
    }
  }, [checkBrowserSupport, checkCameraAvailability, queryPermissionStatus]);

  // Request microphone permission and handle user response
  const requestMicrophonePermission = useCallback(
    async (): Promise<PermissionState> => {
      setRecordingError(null);

      try {
        // Check browser support first
        const supportError = checkBrowserSupport();
        if (supportError) {
          setMicrophonePermission("denied");
          return "denied";
        }

        // Set timeout for permission request (5 seconds)
        const timeoutPromise = new Promise<PermissionState>((_, reject) => {
          permissionTimeoutRef.current = setTimeout(() => {
            reject(
              new Error("Microphone permission request timed out after 5 seconds")
            );
          }, 5000);
        });

        // Request permission with timeout
        const permissionPromise = (async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });

            // Clean up the test stream immediately
            stream.getTracks().forEach((track) => track.stop());

            // Update permission state
            const newState = await queryPermissionStatus("microphone");
            setMicrophonePermission(newState);
            return newState;
          } catch (err) {
            let state: PermissionState = "denied";

            if (
              err instanceof DOMException &&
              err.name === "NotAllowedError"
            ) {
              state = "denied";
            } else if (
              err instanceof DOMException &&
              err.name === "NotFoundError"
            ) {
              state = "denied";
              setRecordingError(
                new Error("Microphone unavailable: no microphone hardware detected")
              );
            } else if (
              err instanceof DOMException &&
              err.name === "TimeoutError"
            ) {
              state = "prompt";
              setRecordingError(
                new Error("Microphone permission request timed out")
              );
            } else {
              state = "unknown";
              setRecordingError(
                err instanceof Error ? err : new Error("Unknown error")
              );
            }

            setMicrophonePermission(state);
            return state;
          }
        })();

        const result = await Promise.race([
          permissionPromise,
          timeoutPromise,
        ]);
        clearTimeout(permissionTimeoutRef.current!);
        return result;
      } catch (err) {
        clearTimeout(permissionTimeoutRef.current!);

        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        setRecordingError(error);
        setMicrophonePermission("denied");
        return "denied";
      }
    },
    [checkBrowserSupport, queryPermissionStatus]
  );

  // Retry permission request after being denied
  const retryPermissionRequest = useCallback(
    async (type: "camera" | "microphone"): Promise<PermissionState> => {
      if (type === "camera") {
        return requestCameraPermission();
      } else {
        return requestMicrophonePermission();
      }
    },
    [requestCameraPermission, requestMicrophonePermission]
  );

  // Get supported mime type for video
  const getSupportedVideoMimeType = useCallback((): string => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
  }, []);

  // Get supported mime type for audio
  const getSupportedAudioMimeType = useCallback((): string => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
  }, []);

  // Extract codec from MIME type
  const extractCodecFromMimeType = useCallback((mimeType: string): string | null => {
    if (!mimeType) return null;
    
    // Parse MIME type like "video/webm;codecs=vp9,opus" or "audio/webm;codecs=opus"
    const codecMatch = mimeType.match(/codecs=([^,;\s]+)/);
    if (codecMatch) {
      return codecMatch[1];
    }
    
    // Fallback to extracting codec from container type if no explicit codec
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("mp4")) return "h264";
    if (mimeType.includes("ogg")) return "theora";
    
    return null;
  }, []);

  // Validate blob integrity with detailed checks
  const validateBlobIntegrity = useCallback((blob: Blob, expectedMimeType?: string): { valid: boolean; error?: string } => {
    // Check if blob exists and is not empty
    if (!blob) {
      return { valid: false, error: "Blob is null or undefined" };
    }

    if (blob.size === 0) {
      return { valid: false, error: "Blob is empty (corrupted)" };
    }

    // Check if MIME type is set
    if (!blob.type) {
      return { valid: false, error: "Blob MIME type is not set" };
    }

    // Validate MIME type matches expected type if provided
    if (expectedMimeType && blob.type !== expectedMimeType) {
      return { valid: false, error: `Blob MIME type mismatch: expected ${expectedMimeType}, got ${blob.type}` };
    }

    return { valid: true };
  }, []);

  const startRecording = useCallback(
    async (mode: "audio" | "video") => {
      setRecordingError(null);

      // Check browser support
      const supportError = checkBrowserSupport();
      if (supportError) {
        setRecordingError(supportError);
        throw supportError;
      }

      audioChunksRef.current = [];
      videoChunksRef.current = [];

      try {
        if (mode === "video") {
          // Check camera availability first
          const available = await checkCameraAvailability();
          if (!available) {
            setIsCameraAvailable(false);
            const error = new Error(
              "Camera unavailable: no camera hardware detected, falling back to audio-only"
            );
            setRecordingError(error);
            // Fallback to audio-only
            mode = "audio";
          } else if (
            cameraPermission === "denied" ||
            microphonePermission === "denied"
          ) {
            // Request permissions if needed
            if (cameraPermission !== "granted") {
              const cameraResult = await requestCameraPermission();
              if (cameraResult !== "granted") {
                const error = new Error(
                  "Camera permission not granted, falling back to audio-only"
                );
                setRecordingError(error);
                mode = "audio";
              }
            }

            if (mode === "video" && microphonePermission !== "granted") {
              const micResult = await requestMicrophonePermission();
              if (micResult !== "granted") {
                const error = new Error(
                  "Microphone permission not granted, falling back to audio-only"
                );
                setRecordingError(error);
                mode = "audio";
              }
            }
          }
        }

        if (mode === "video") {
          // Try to get video stream with audio
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: true,
            });
            streamRef.current = stream;
            setVideoPreviewStream(stream);
            setRecordingMode("video");

            // Update permission states after successful capture
            const cameraState = await queryPermissionStatus("camera");
            const micState = await queryPermissionStatus("microphone");
            setCameraPermission(cameraState);
            setMicrophonePermission(micState);

            // Create video recorder and track supported codec
            const videoMimeType = getSupportedVideoMimeType();
            const videoCodec = extractCodecFromMimeType(videoMimeType);
            setSupportedVideoCodec(videoCodec);

            const audioCodec = extractCodecFromMimeType(videoMimeType);
            setSupportedAudioCodec(audioCodec);

            const videoRecorder = new MediaRecorder(
              stream,
              videoMimeType ? { mimeType: videoMimeType } : undefined
            );

            videoRecorder.ondataavailable = (e) => {
              if (e.data?.size > 0) videoChunksRef.current.push(e.data);
            };

            videoRecorder.start();
            mediaRecorderRef.current = videoRecorder;
            setIsRecording(true);
          } catch (videoError) {
            // Fallback to audio-only if video permission denied
            console.warn("Video permission denied, falling back to audio-only:", videoError);

            // Determine specific error
            if (
              videoError instanceof DOMException &&
              videoError.name === "NotAllowedError"
            ) {
              setCameraPermission("denied");
              setRecordingError(
                new Error("Camera permission denied, recording in audio-only mode")
              );
            } else if (
              videoError instanceof DOMException &&
              videoError.name === "NotFoundError"
            ) {
              setIsCameraAvailable(false);
              setCameraPermission("denied");
              setRecordingError(
                new Error(
                  "Camera unavailable: no camera hardware detected, recording in audio-only mode"
                )
              );
            } else {
              setRecordingError(
                videoError instanceof Error
                  ? videoError
                  : new Error("Video recording failed, falling back to audio-only")
              );
            }

            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
              audioStreamRef.current = audioStream;
              streamRef.current = audioStream;
              setRecordingMode("audio");

              // Update microphone permission state
              const micState = await queryPermissionStatus("microphone");
              setMicrophonePermission(micState);

              // Track supported audio codec
              const audioMimeType = getSupportedAudioMimeType();
              const audioCodec = extractCodecFromMimeType(audioMimeType);
              setSupportedAudioCodec(audioCodec);

              const audioRecorder = new MediaRecorder(
                audioStream,
                audioMimeType ? { mimeType: audioMimeType } : undefined
              );

              audioRecorder.ondataavailable = (e) => {
                if (e.data?.size > 0) audioChunksRef.current.push(e.data);
              };

              audioRecorder.start();
              mediaRecorderRef.current = audioRecorder;
              setIsRecording(true);
            } catch (audioError) {
              const finalError = new Error("Failed to get audio permission");
              setRecordingError(finalError);
              setMicrophonePermission("denied");
              throw finalError;
            }
          }
        } else {
          // Audio-only mode
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            audioStreamRef.current = audioStream;
            streamRef.current = audioStream;
            setRecordingMode("audio");

            // Update microphone permission state
            const micState = await queryPermissionStatus("microphone");
            setMicrophonePermission(micState);

            // Track supported audio codec
            const audioMimeType = getSupportedAudioMimeType();
            const audioCodec = extractCodecFromMimeType(audioMimeType);
            setSupportedAudioCodec(audioCodec);

            const audioRecorder = new MediaRecorder(
              audioStream,
              audioMimeType ? { mimeType: audioMimeType } : undefined
            );

            audioRecorder.ondataavailable = (e) => {
              if (e.data?.size > 0) audioChunksRef.current.push(e.data);
            };

            audioRecorder.start();
            mediaRecorderRef.current = audioRecorder;
            setIsRecording(true);
          } catch (audioError) {
            const finalError = new Error("Failed to get audio permission");
            setRecordingError(finalError);

            if (
              audioError instanceof DOMException &&
              audioError.name === "NotAllowedError"
            ) {
              setMicrophonePermission("denied");
            }
            throw finalError;
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setRecordingError(error);
        setIsRecording(false);
        throw error;
      }
    },
    [
      checkBrowserSupport,
      getSupportedVideoMimeType,
      getSupportedAudioMimeType,
      checkCameraAvailability,
      cameraPermission,
      microphonePermission,
      requestCameraPermission,
      requestMicrophonePermission,
      queryPermissionStatus,
    ]
  );

  const stopRecording = useCallback(
    (): Promise<{
      videoBlob?: Blob;
      audioBlob: Blob;
      videoCodec?: string;
      audioCodec?: string;
    }> => {
      return new Promise((resolve, reject) => {
        if (!mediaRecorderRef.current) {
          resolve({
            audioBlob: new Blob([], { type: "audio/webm" }),
          });
          return;
        }

        mediaRecorderRef.current.onstop = () => {
          try {
            const audioMimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
            let audioBlob = new Blob(audioChunksRef.current, {
              type: audioMimeType,
            });

            // Extract codec from MIME type
            const audioCodec = extractCodecFromMimeType(audioMimeType);
            recordedAudioCodecRef.current = audioCodec;

            let videoBlob: Blob | undefined;
            let videoCodec: string | null = null;

            if (recordingMode === "video" && videoChunksRef.current.length > 0) {
              const videoMimeType = mediaRecorderRef.current?.mimeType || "video/webm";
              videoBlob = new Blob(videoChunksRef.current, {
                type: videoMimeType,
              });

              // Extract codec from MIME type
              videoCodec = extractCodecFromMimeType(videoMimeType);
              recordedVideoCodecRef.current = videoCodec;

              // Validate video blob integrity
              const videoIntegrityCheck = validateBlobIntegrity(videoBlob, videoMimeType);
              if (!videoIntegrityCheck.valid) {
                const error = new Error(`Video blob validation failed: ${videoIntegrityCheck.error}`);
                setRecordingError(error);
                reject(error);
                return;
              }

              // For video mode, audio is mixed into the video stream
              // Return video blob as both audio and video for convenience
              audioBlob = videoBlob;
            } else {
              // Validate audio blob integrity for audio-only recordings
              const audioIntegrityCheck = validateBlobIntegrity(audioBlob, audioMimeType);
              if (!audioIntegrityCheck.valid) {
                const error = new Error(`Audio blob validation failed: ${audioIntegrityCheck.error}`);
                setRecordingError(error);
                reject(error);
                return;
              }
            }

            // Clean up streams
            streamRef.current?.getTracks().forEach((track) => track.stop());
            audioStreamRef.current?.getTracks().forEach((track) => track.stop());
            videoStreamRef.current?.getTracks().forEach((track) => track.stop());

            streamRef.current = null;
            audioStreamRef.current = null;
            videoStreamRef.current = null;
            setVideoPreviewStream(null);

            setIsRecording(false);
            resolve({
              videoBlob,
              audioBlob,
              videoCodec: videoCodec || undefined,
              audioCodec: audioCodec || undefined,
            });
          } catch (err) {
            const error =
              err instanceof Error ? err : new Error("Failed to stop recording");
            setRecordingError(error);
            reject(error);
          }
        };

        mediaRecorderRef.current.onerror = (err) => {
          const error = new Error(
            `Recording error: ${err.error || "Unknown error"}`
          );
          setRecordingError(error);
          reject(error);
        };

        mediaRecorderRef.current.stop();
      });
    },
    [recordingMode, validateBlobIntegrity, extractCodecFromMimeType]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    }
  }, [isRecording]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
    }
  }, [isRecording]);

  return {
    isRecording,
    recordingMode,
    videoPreviewStream,
    recordingError,
    cameraPermission,
    microphonePermission,
    isCameraAvailable,
    supportedVideoCodec,
    supportedAudioCodec,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    requestCameraPermission,
    requestMicrophonePermission,
    retryPermissionRequest,
  };
};
