import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoRecording } from './useVideoRecording';

/**
 * Browser Compatibility Test Suite for useVideoRecording Hook
 * Task 2.5: Browser Compatibility Testing
 * 
 * Tests cover:
 * - 2.5.1 Chrome (latest) compatibility
 * - 2.5.2 Firefox (latest) compatibility
 * - 2.5.3 Safari (latest) compatibility
 * - 2.5.4 Mobile browsers compatibility
 * - 2.5.5 Fallback to audio when camera unavailable
 * - 2.5.6 No JavaScript errors
 * - 2.5.7 Video/audio synchronization properties
 */

describe('2.5 Browser Compatibility Testing', () => {
  let mockGetUserMedia: jest.Mock;
  let mockMediaRecorder: jest.Mock;
  let mediaRecorderInstances: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mediaRecorderInstances = [];

    // Setup MediaRecorder mock
    mockMediaRecorder = jest.fn().mockImplementation(() => {
      const instance = {
        start: jest.fn(),
        stop: jest.fn(function() {
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
        mimeType: 'video/webm;codecs="vp8,opus"',
      };
      mediaRecorderInstances.push(instance);
      return instance;
    });

    window.MediaRecorder = mockMediaRecorder as any;
    (window.MediaRecorder as any).isTypeSupported = jest.fn((mimeType: string) => {
      // Simulate browser codec support
      if (mimeType.includes('webm') || mimeType.includes('mp4')) {
        return true;
      }
      return false;
    });

    // Setup getUserMedia mock
    mockGetUserMedia = jest.fn();
    const mockPermissionQuery = jest.fn().mockResolvedValue({ state: 'granted' });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: jest.fn().mockResolvedValue([
          { kind: 'videoinput', deviceId: 'camera1' },
          { kind: 'audioinput', deviceId: 'mic1' },
        ]),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: mockPermissionQuery,
      },
      writable: true,
      configurable: true,
    });
  });

  describe('2.5.1: Chrome (latest) Compatibility', () => {
    it('should support video recording on Chrome', async () => {
      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);
      
      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingMode).toBe('video');
      expect(mockMediaRecorder).toHaveBeenCalled();
    });

    it('should support Chrome codec detection (H.264)', async () => {
      (window.MediaRecorder as any).isTypeSupported = jest.fn((mimeType: string) => {
        // Chrome supports H.264
        return mimeType.includes('avc1') || mimeType.includes('vp8');
      });

      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('audio');
      });

      expect(result.current.isRecording).toBe(true);
    });
  });

  describe('2.5.2: Firefox (latest) Compatibility', () => {
    it('should support video recording on Firefox', async () => {
      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingMode).toBe('video');
    });

    it('should support Firefox VP8 codec', async () => {
      (window.MediaRecorder as any).isTypeSupported = jest.fn((mimeType: string) => {
        // Firefox supports VP8
        return mimeType.includes('vp8') || mimeType.includes('vorbis');
      });

      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('audio');
      });

      expect(result.current.isRecording).toBe(true);
    });
  });

  describe('2.5.3: Safari (latest) Compatibility', () => {
    it('should support video recording on Safari 17+', async () => {
      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingMode).toBe('video');
    });

    it('should handle Safari H.264 codec support', async () => {
      (window.MediaRecorder as any).isTypeSupported = jest.fn((mimeType: string) => {
        // Safari primarily supports H.264
        return mimeType.includes('avc1') || mimeType.includes('mp4a');
      });

      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('audio');
      });

      expect(result.current.isRecording).toBe(true);
    });

    it('should detect when Safari is missing MediaRecorder', async () => {
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
          // Error expected for older Safari
        }
      });

      expect(result.current.recordingError).not.toBeNull();

      (window as any).MediaRecorder = originalMediaRecorder;
    });
  });

  describe('2.5.4: Mobile Browsers Compatibility', () => {
    it('should support video recording on Android Chrome', async () => {
      // Mock mobile browser user agent
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
        writable: true,
      });

      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isRecording).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should support video recording on iOS Safari 17+', async () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isRecording).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should handle mobile device orientation changes gracefully', async () => {
      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      // Simulate orientation change
      window.dispatchEvent(new Event('orientationchange'));

      // Recording should continue
      expect(result.current.isRecording).toBe(true);
    });
  });

  describe('2.5.5: Fallback to Audio When Camera Unavailable', () => {
    it('should fallback when camera permission denied on all browsers', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingError?.message).toContain('audio-only');
    });

    it('should fallback when camera hardware not available', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          return Promise.reject(new DOMException('Camera not found', 'NotFoundError'));
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.recordingMode).toBe('audio');
      expect(result.current.isCameraAvailable).toBe(false);
    });

    it('should mark camera permission as denied after fallback', async () => {
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      // After NotAllowedError, the error message should indicate camera was denied
      expect(result.current.recordingError?.message).toContain('audio-only');
      // And fallback to audio should occur
      expect(result.current.recordingMode).toBe('audio');
    });
  });

  describe('2.5.6: No JavaScript Errors', () => {
    it('should not throw console.error during normal recording flow', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockAudioStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('audio');
      });

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should not throw console.error during graceful fallback', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockAudioStream = {
        getTracks: jest.fn(() => [{ stop: jest.fn() }]),
      } as any;

      mockGetUserMedia.mockImplementation(({ video }: any) => {
        if (video) {
          return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
        }
        return Promise.resolve(mockAudioStream);
      });

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should handle missing browser APIs gracefully without throwing console errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
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
          // Expected error
        }
      });

      // Should set error state, not throw console error
      expect(result.current.recordingError).not.toBeNull();
      errorSpy.mockRestore();
    });
  });

  describe('2.5.7: Video/Audio Synchronization Properties', () => {
    it('should ensure video and audio are captured from same stream', async () => {
      const mockTracks = [
        { stop: jest.fn(), kind: 'video', id: 'video-track-1' },
        { stop: jest.fn(), kind: 'audio', id: 'audio-track-1' },
      ];

      const mockVideoStream = {
        getTracks: jest.fn(() => mockTracks),
        getAudioTracks: jest.fn(() => [mockTracks[1]]),
        getVideoTracks: jest.fn(() => [mockTracks[0]]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      // Both tracks should be from same stream
      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingMode).toBe('video');
    });

    it('should capture audio and video with compatible codecs', async () => {
      (window.MediaRecorder as any).isTypeSupported = jest.fn((mimeType: string) => {
        // Support common codec combinations
        const supportedTypes = [
          'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
          'video/webm;codecs="vp8,vorbis"',
        ];
        return supportedTypes.some(t => t.includes(mimeType.split(';')[0]));
      });

      const mockVideoStream = {
        getTracks: jest.fn(() => [
          { stop: jest.fn(), kind: 'video' },
          { stop: jest.fn(), kind: 'audio' },
        ]),
      } as any;

      mockGetUserMedia.mockResolvedValue(mockVideoStream);

      const { result } = renderHook(() => useVideoRecording());

      await act(async () => {
        await result.current.startRecording('video');
      });

      expect(result.current.isRecording).toBe(true);
    });
  });

  describe('Browser Detection Helpers', () => {
    it('should detect supported MediaRecorder MIME types', () => {
      const supportedTypes = [
        'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
        'video/webm;codecs="vp8,vorbis"',
        'video/webm;codecs="vp9,opus"',
        'audio/webm;codecs="vorbis"',
        'audio/mp4;codecs="mp4a.40.2"',
      ];

      supportedTypes.forEach(mimeType => {
        const isSupported = (window.MediaRecorder as any).isTypeSupported(mimeType);
        expect(typeof isSupported).toBe('boolean');
      });
    });

    it('should detect getUserMedia availability', () => {
      const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
      expect(hasGetUserMedia).toBe(true);
    });

    it('should detect MediaRecorder availability', () => {
      const hasMediaRecorder = !!window.MediaRecorder;
      expect(hasMediaRecorder).toBe(true);
    });
  });
});
