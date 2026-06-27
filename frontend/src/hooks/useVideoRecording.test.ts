import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoRecording } from './useVideoRecording';

/**
 * Test suite for useVideoRecording hook
 * Validates recording functionality, permission handling, fallback behavior, and browser compatibility
 * 
 * **Validates: Requirements 7.1, 7.2**
 */

describe('useVideoRecording', () => {
  let mockGetUserMedia: jest.Mock;
  let mockEnumerateDevices: jest.Mock;
  let mockPermissionQuery: jest.Mock;
  let mediaRecorderInstances: any[] = [];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mediaRecorderInstances = [];

    // Mock MediaRecorder with proper callbacks
    const mockMediaRecorder = jest.fn().mockImplementation(() => {
      const instance = {
        start: jest.fn(),
        stop: jest.fn(function() {
          // Trigger onstop callback after stop is called
          if (this.onstop) {
            setTimeout(() => this.onstop(), 0);
          }
        }),
        pause: jest.fn(),
        resume: jest.fn(),
        state: 'recording',
        onerror: null,
        ondataavailable: null,
        onstop: null,
        mimeType: 'audio/webm',
      };
      mediaRecorderInstances.push(instance);
      return instance;
    });

    window.MediaRecorder = mockMediaRecorder as any;

    // Mock getUserMedia
    mockGetUserMedia = jest.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: jest.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    });

    // Mock Permissions API
    mockPermissionQuery = jest.fn();
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: mockPermissionQuery,
      },
      writable: true,
      configurable: true,
    });

    // Mock supportedTypes checking
    (window.MediaRecorder as any).isTypeSupported = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('2.1.5: Fallback to audio-only on permission denial', () => {
    it('should fallback to audio-only when camera permission is denied', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      // Video permission denied with NotAllowedError
      mockGetUserMedia.mockImplementation(({ video, audio }: any) => {
        if (video && audio) {
          // Video + audio request fails
          const error = new DOMException('Permission denied', 'NotAllowedError');
          return Promise.reject(error);
        }
        // Audio-only request succeeds
        return Promise.resolve(mockAudioStream);
      });

      mockPermissionQuery.mockResolvedValue({ state: 'denied' });

      const { result } = renderHook(() => useVideoRecording());

      // Start recording in video mode
      await act(async () => {
        await result.current.startRecording('video');
      });

      // Should have fallback error message
      expect(result.current.recordingError).not.toBeNull();
      expect(result.current.recordingError?.message).toContain('audio-only');

      // Should be in audio mode
      expect(result.current.recordingMode).toBe('audio');

      // Should still be recording
      expect(result.current.isRecording).toBe(true);

      // Should have audio stream but no video preview
      expect(result.current.videoPreviewStream).toBeNull();
    });

    it('should set camera permission to denied when NotAllowedError is caught', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          const error = new DOMException('Permission denied', 'NotAllowedError');
          return Promise.reject(error);
        }
        return Promise.resolve(mockAudioStream);
      });

      // Permission query will return denied state after request
      mockPermissionQuery.mockResolvedValue({ state: 'denied' });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      // Camera permission should be marked as denied after the attempt
      await waitFor(() => {
        expect(result.current.cameraPermission).toBe('denied');
      });
    });

    it('should continue with audio when video is unavailable (NotFoundError)', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          const error = new DOMException('Camera not found', 'NotFoundError');
          return Promise.reject(error);
        }
        return Promise.resolve(mockAudioStream);
      });

      mockEnumerateDevices = jest.fn().mockResolvedValue([
        { kind: 'audioinput', deviceId: 'audio1' },
        // No videoinput devices
      ]);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.recordingError).not.toBeNull();
      expect(result.current.recordingError?.message).toContain('audio-only');
    });

    it('should set isCameraAvailable to false when camera hardware not found', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          const error = new DOMException('Camera not found', 'NotFoundError');
          return Promise.reject(error);
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isCameraAvailable).toBe(false);
    });

    it('should return audio recording when fallback to audio occurs', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          const error = new DOMException('Permission denied', 'NotAllowedError');
          return Promise.reject(error);
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      // Start in video mode (will fallback to audio)
      await act(async () => {
        await result.current.startRecording('video');
      });

      // Verify fallback occurred
      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.isRecording).toBe(true);

      // Verify recording error indicates fallback
      expect(result.current.recordingError?.message).toContain('audio-only');
    });

    it('should handle microphone permission denial during audio fallback', async () => {
      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          // Video fails
          const error = new DOMException('Permission denied', 'NotAllowedError');
          return Promise.reject(error);
        }
        // Audio also fails
        const error = new DOMException('Permission denied', 'NotAllowedError');
        return Promise.reject(error);
      });

      const { result } = renderHook(() => useVideoRecording());

      // Attempt to record - will try video first, then audio, both will fail
      await act(async () => {
        try {
          await result.current.startRecording('video');
        } catch (e) {
          // Error is expected when both video and audio permissions are denied
        }
      });

      // Recording should not be active since all permissions failed
      expect(result.current.isRecording).toBe(false);
      
      // At minimum, recordingError should indicate the problem
      expect(result.current.recordingError).not.toBeNull();
    });

    it('should fallback to audio when camera is not available at hardware level', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          const error = new DOMException('Camera not found', 'NotFoundError');
          return Promise.reject(error);
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      // Should fallback to audio successfully
      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.isRecording).toBe(true);

      // Error message should indicate reason
      expect(result.current.recordingError?.message).toContain(
        'audio-only'
      );
    });

    it('should not attempt video when explicitly requesting audio mode', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video, audio }: any) => {
        // Video should not be requested at all
        expect(video).toBeUndefined();
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('audio');
      });

      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingError).toBeNull();
    });

    it('should update camera permission state after fallback attempt', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          const error = new DOMException('Permission denied', 'NotAllowedError');
          return Promise.reject(error);
        }
        return Promise.resolve(mockAudioStream);
      });

      mockPermissionQuery.mockResolvedValue({ state: 'denied' });

      const { result } = renderHook(() => useVideoRecording());

      // Initially unknown
      expect(result.current.cameraPermission).toBe('unknown');

      await act(async () => {
        await result.current.startRecording('video');
      });

      // After attempting video, should be denied
      expect(result.current.cameraPermission).toBe('denied');
    });
  });

  describe('Hook initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useVideoRecording());

      expect(result.current.isRecording).toBe(false);
      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.videoPreviewStream).toBeNull();
      expect(result.current.recordingError).toBeNull();
      expect(result.current.cameraPermission).toBe('unknown');
      expect(result.current.microphonePermission).toBe('unknown');
    });

    it('should return all required methods', () => {
      const { result } = renderHook(() => useVideoRecording());

      expect(typeof result.current.startRecording).toBe('function');
      expect(typeof result.current.stopRecording).toBe('function');
      expect(typeof result.current.pauseRecording).toBe('function');
      expect(typeof result.current.resumeRecording).toBe('function');
      expect(typeof result.current.requestCameraPermission).toBe('function');
      expect(typeof result.current.requestMicrophonePermission).toBe('function');
      expect(typeof result.current.retryPermissionRequest).toBe('function');
    });
  });

  describe('Browser compatibility', () => {
    it('should detect missing getUserMedia API', async () => {
      const { mediaDevices } = navigator;
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useVideoRecording());

      await expect(async () => {
        await act(async () => {
          await result.current.startRecording('audio');
        });
      }).rejects.toThrow('getUserMedia API is not supported');

      Object.defineProperty(navigator, 'mediaDevices', {
        value: mediaDevices,
        writable: true,
      });
    });

    it('should detect missing MediaRecorder API', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      // Set MediaRecorder to undefined
      const originalMediaRecorder = window.MediaRecorder;
      (window as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useVideoRecording());

      await expect(async () => {
        await act(async () => {
          await result.current.startRecording('audio');
        });
      }).rejects.toThrow('MediaRecorder API is not supported');

      // Restore MediaRecorder
      (window as any).MediaRecorder = originalMediaRecorder;
    });

    it('should return unsupported browser error through recordingError state', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        try {
          await result.current.startRecording('audio');
        } catch (e) {
          // Error expected
        }
      });

      expect(result.current.recordingError).not.toBeNull();
      expect(result.current.recordingError?.message).toContain(
        'getUserMedia API is not supported'
      );
    });

    it('should set recordingMode to audio and recordingError when MediaRecorder missing', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const originalMediaRecorder = window.MediaRecorder;
      (window as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        try {
          await result.current.startRecording('audio');
        } catch (e) {
          // Error expected
        }
      });

      expect(result.current.recordingError).not.toBeNull();
      expect(result.current.recordingError?.message).toContain(
        'MediaRecorder API is not supported'
      );

      (window as any).MediaRecorder = originalMediaRecorder;
    });

    it('should allow component to check recordingError for unsupported browser', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const originalMediaRecorder = window.MediaRecorder;
      (window as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        try {
          await result.current.startRecording('audio');
        } catch (e) {
          // Expected
        }
      });

      // Component can check error state to display appropriate message
      const hasError = result.current.recordingError !== null;
      const isUnsupportedBrowser = result.current.recordingError?.message.includes(
        'API is not supported'
      );

      expect(hasError).toBe(true);
      expect(isUnsupportedBrowser).toBe(true);

      (window as any).MediaRecorder = originalMediaRecorder;
    });

    it('should not start recording if browser is unsupported (getUserMedia missing)', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        try {
          await result.current.startRecording('audio');
        } catch (e) {
          // Error expected
        }
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.recordingError).not.toBeNull();
    });

    it('should not start recording if browser is unsupported (MediaRecorder missing)', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const originalMediaRecorder = window.MediaRecorder;
      (window as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        try {
          await result.current.startRecording('audio');
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.recordingError).not.toBeNull();

      (window as any).MediaRecorder = originalMediaRecorder;
    });

    it('should provide clear error messages for graceful handling', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const originalMediaRecorder = window.MediaRecorder;
      (window as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        try {
          await result.current.startRecording('audio');
        } catch (e) {
          // Expected
        }
      });

      // Error message should be specific and helpful
      const errorMessage = result.current.recordingError?.message || '';
      expect(errorMessage.length > 0).toBe(true);
      expect(errorMessage).toMatch(/API is not supported/);

      (window as any).MediaRecorder = originalMediaRecorder;
    });
  });
});
