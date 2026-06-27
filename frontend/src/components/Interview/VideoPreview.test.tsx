import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VideoPreview, VideoPreviewProps } from "./VideoPreview";

/**
 * Test Suite for VideoPreview Component
 *
 * Tests all sub-tasks:
 * - 2.3.1: Display live video stream using <video> element with autoplay/muted
 * - 2.3.2: Add "Recording" badge visibility tied to isRecording prop
 * - 2.3.3: Add mode indicator badge ("Audio-Only" or "Video")
 * - 2.3.4: Handle null/undefined mediaStream gracefully
 * - 2.3.5: Display error messages if stream unavailable
 * - 2.3.6: Size appropriately for interview UI layout
 */

describe("VideoPreview Component", () => {
  // Mock MediaStream before tests
  beforeAll(() => {
    if (!global.MediaStream) {
      // @ts-ignore
      global.MediaStream = class MediaStream {
        id: string;
        active: boolean;
        tracks: any[] = [];

        constructor() {
          this.id = Math.random().toString(36);
          this.active = true;
        }

        addTrack(track: any) {
          this.tracks.push(track);
        }

        getAudioTracks() {
          return this.tracks.filter(t => t.kind === "audio");
        }

        getVideoTracks() {
          return this.tracks.filter(t => t.kind === "video");
        }

        getTracks() {
          return this.tracks;
        }

        removeTrack(track: any) {
          this.tracks = this.tracks.filter(t => t !== track);
        }
      };
    }
  });

  // Helper to create a mock MediaStream
  const createMockMediaStream = (): MediaStream => {
    // @ts-ignore
    const stream = new MediaStream();
    
    // Create mock video track
    const mockVideoTrack = {
      kind: "video" as const,
      id: "mock-video-" + Math.random(),
      enabled: true,
      readyState: "live" as const,
      stop: jest.fn(),
    } as unknown as MediaStreamTrack;
    
    // Create mock audio track
    const mockAudioTrack = {
      kind: "audio" as const,
      id: "mock-audio-" + Math.random(),
      enabled: true,
      readyState: "live" as const,
      stop: jest.fn(),
    } as unknown as MediaStreamTrack;

    // Add tracks to stream
    stream.addTrack(mockVideoTrack);
    stream.addTrack(mockAudioTrack);

    return stream;
  };

  describe("Sub-task 2.3.1: Live Video Stream Display", () => {
    it("should render video element when mediaStream is provided and mode is video", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoElement = screen.getByRole("region", { name: /live video preview/i });
      expect(videoElement).toBeInTheDocument();

      // Check that video element exists within the region
      const video = videoElement.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("autoplay");
      // Check muted property
      expect((video as HTMLVideoElement).muted).toBe(true);
    });

    it("should attach mediaStream to video element srcObject", () => {
      const mockStream = createMockMediaStream();
      const { rerender } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoElement = screen.getByRole("region", { name: /live video preview/i });
      const video = videoElement.querySelector("video") as HTMLVideoElement;

      // MediaStream should be attached
      expect(video.srcObject).toBe(mockStream);
    });

    it("should have autoplay attribute on video element", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoElement = screen.getByRole("region", { name: /live video preview/i });
      const video = videoElement.querySelector("video") as HTMLVideoElement;
      expect(video).toHaveAttribute("autoplay");
    });

    it("should have muted attribute on video element", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoElement = screen.getByRole("region", { name: /live video preview/i });
      const video = videoElement.querySelector("video") as HTMLVideoElement;
      // Check muted property instead of attribute
      expect(video.muted).toBe(true);
    });

    it("should apply mirror transform to video for better UX", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoElement = screen.getByRole("region", { name: /live video preview/i });
      const video = videoElement.querySelector("video") as HTMLVideoElement;
      const style = window.getComputedStyle(video);
      expect(video.style.transform).toContain("scaleX(-1)");
    });
  });

  describe("Sub-task 2.3.2: Recording Badge Visibility", () => {
    it("should display Recording badge when isRecording is true", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      // Look for the recording indicator with the specific text
      const recordingBadge = screen.getByText(/● Recording/i);
      expect(recordingBadge).toBeInTheDocument();
    });

    it("should not display Recording badge when isRecording is false", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      // Recording badge should not be present
      const recordingBadge = screen.queryByText(/● Recording/i);
      expect(recordingBadge).not.toBeInTheDocument();
    });

    it("should position Recording badge in top-left corner", () => {
      const mockStream = createMockMediaStream();
      const { container } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      const recordingBadge = screen.getByText(/● Recording/i);
      const parentDiv = recordingBadge.closest("div");
      const style = window.getComputedStyle(parentDiv!);

      // Check that badge is positioned absolutely in top-left
      expect(parentDiv).toHaveStyle({ position: "absolute", top: "1rem", left: "1rem" });
    });

    it("should have pulsing animation on recording indicator", () => {
      const mockStream = createMockMediaStream();
      const { container } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      // Find the pulsing dot element
      const recordingDiv = screen.getByText(/● Recording/i).parentElement;
      const pulseDot = recordingDiv?.querySelector("div");

      expect(pulseDot).toHaveStyle({ animation: "pulse 1.5s ease-in-out infinite" });
    });

    it("should toggle Recording badge when isRecording prop changes", () => {
      const mockStream = createMockMediaStream();
      const { rerender } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(screen.queryByText(/● Recording/i)).not.toBeInTheDocument();

      rerender(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      expect(screen.getByText(/● Recording/i)).toBeInTheDocument();
    });
  });

  describe("Sub-task 2.3.3: Mode Indicator Badge", () => {
    it("should display 'Video' badge when recordingMode is 'video'", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      // Look for the Video mode badge (uppercase)
      const videoBadge = screen.getByText(/^Video$/i);
      expect(videoBadge).toBeInTheDocument();
    });

    it("should display 'Audio-Only' badge when recordingMode is 'audio'", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="audio"
          isRecording={false}
        />
      );

      // Find the badge specifically, not the audio-only mode placeholder
      const audioBadges = screen.getAllByText(/Audio-Only/i);
      const badge = audioBadges.find(el => el.style.textTransform === "uppercase");
      expect(badge).toBeInTheDocument();
    });

    it("should position mode badge in top-right corner", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoBadge = screen.getByText(/^Video$/i);
      const parentDiv = videoBadge.closest("div");

      expect(parentDiv).toHaveStyle({ position: "absolute", top: "1rem", right: "1rem" });
    });

    it("should have uppercase text for mode badge", () => {
      const mockStream = createMockMediaStream();
      const { container } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoBadge = screen.getByText(/^Video$/i);
      const parentDiv = videoBadge.closest("div");
      expect(parentDiv).toHaveStyle({ textTransform: "uppercase" });
    });

    it("should update mode badge when recordingMode prop changes", () => {
      const mockStream = createMockMediaStream();
      const { rerender } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(screen.getByText(/^Video$/i)).toBeInTheDocument();
      const audioBadges = screen.queryAllByText(/Audio-Only/i);
      expect(audioBadges.length).toBe(0);

      rerender(
        <VideoPreview
          mediaStream={null}
          recordingMode="audio"
          isRecording={false}
        />
      );

      expect(screen.queryByText(/^Video$/i)).not.toBeInTheDocument();
      // Check for Audio-Only badge (the uppercase one)
      const allAudioOnlyElements = screen.getAllByText(/Audio-Only/i);
      const badge = allAudioOnlyElements.find(el => el.style.textTransform === "uppercase");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Sub-task 2.3.4: Null/Undefined MediaStream Handling", () => {
    it("should handle null mediaStream gracefully in video mode", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      // Should display error message instead of crashing
      expect(screen.getByText(/Camera Unavailable/i)).toBeInTheDocument();
    });

    it("should handle undefined mediaStream gracefully in video mode", () => {
      render(
        <VideoPreview
          mediaStream={undefined}
          recordingMode="video"
          isRecording={false}
        />
      );

      // Should display error message instead of crashing
      expect(screen.getByText(/Camera Unavailable/i)).toBeInTheDocument();
    });

    it("should show audio-only placeholder when mediaStream is null in audio mode", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="audio"
          isRecording={false}
        />
      );

      // Should display audio-only placeholder
      expect(screen.getByText(/Audio-Only Mode/i)).toBeInTheDocument();
    });

    it("should not render video element when mediaStream is null", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoRegion = screen.getByRole("region", { name: /live video preview/i });
      const video = videoRegion.querySelector("video");
      expect(video).not.toBeInTheDocument();
    });

    it("should clear video element when mediaStream changes from valid to null", () => {
      const mockStream = createMockMediaStream();
      const { rerender } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoRegion = screen.getByRole("region", { name: /live video preview/i });
      let video = videoRegion.querySelector("video") as HTMLVideoElement;
      expect(video).toBeInTheDocument();

      rerender(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      // Video element should be removed and error displayed
      expect(screen.getByText(/Camera Unavailable/i)).toBeInTheDocument();
    });
  });

  describe("Sub-task 2.3.5: Error Messages", () => {
    it("should display error message when stream unavailable in video mode", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(screen.getByText(/Camera Unavailable/i)).toBeInTheDocument();
    });

    it("should display helpful guidance in error message", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(
        screen.getByText(/Please enable your camera and grant permission/i)
      ).toBeInTheDocument();
    });

    it("should display error icon for unavailable camera", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      const errorContainer = screen.getByText(/Camera Unavailable/i).closest("div");
      // Error container should be visible
      expect(errorContainer).toBeVisible();
    });

    it("should have proper ARIA attributes for error state", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      // Get the error status div (the one with aria-atomic)
      const statusDivs = screen.getAllByRole("status", { hidden: true });
      const errorStatusDiv = statusDivs[0]; // The error div should be first
      expect(errorStatusDiv).toBeInTheDocument();
      expect(errorStatusDiv).toHaveAttribute("aria-live", "polite");
      expect(errorStatusDiv).toHaveAttribute("aria-atomic", "true");
    });

    it("should not show error message when stream is available in video mode", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(screen.queryByText(/Camera Unavailable/i)).not.toBeInTheDocument();
    });
  });

  describe("Sub-task 2.3.6: Layout and Sizing", () => {
    it("should have responsive container with max-width for interview layout", () => {
      const mockStream = createMockMediaStream();
      const { container } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const outerDiv = container.querySelector("div");
      expect(outerDiv).toHaveStyle({
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "640px",
        margin: "0 auto",
      });
    });

    it("should maintain 16:9 aspect ratio", () => {
      const mockStream = createMockMediaStream();
      const { container } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoContainer = screen.getByRole("region", { name: /live video preview/i });
      // Check that aspectRatio is set
      expect(videoContainer.style.aspectRatio).toBe("16 / 9");
    });

    it("should have rounded corners for interview UI", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoContainer = screen.getByRole("region", { name: /live video preview/i });
      expect(videoContainer.style.borderRadius).toBe("12px");
    });

    it("should have proper border styling", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoContainer = screen.getByRole("region", { name: /live video preview/i });
      expect(videoContainer.style.border).toBe("2px solid rgba(99, 102, 241, 0.3)");
    });

    it("should be mobile-responsive with proper sizing", () => {
      const mockStream = createMockMediaStream();
      const { container } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const outerDiv = container.querySelector("div");
      // Component should be 100% width for responsive layout
      expect(outerDiv).toHaveStyle({ width: "100%" });
    });

    it("should include information text below video", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(screen.getByText(/Live preview • Camera enabled • Ready to record/i)).toBeInTheDocument();
    });

    it("should display different info text for audio-only mode", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="audio"
          isRecording={false}
        />
      );

      expect(
        screen.getByText(/Audio mode • Camera disabled • Audio recording active/i)
      ).toBeInTheDocument();
    });

    it("should display fallback info text when camera unavailable", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={false}
        />
      );

      expect(
        screen.getByText(/Camera not available • Fallback to audio recommended/i)
      ).toBeInTheDocument();
    });

    it("should have proper overflow handling", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoContainer = screen.getByRole("region", { name: /live video preview/i });
      expect(videoContainer.style.overflow).toBe("hidden");
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria labels for video region", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const region = screen.getByRole("region", { name: /live video preview/i });
      expect(region).toHaveAttribute("aria-label");
    });

    it("should have aria label for recording indicator", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      const recordingStatus = screen.getByText(/● Recording/i).closest("div");
      expect(recordingStatus).toHaveAttribute("aria-label");
    });

    it("should have aria label for mode indicator", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoBadge = screen.getByText(/^Video$/i);
      const parentDiv = videoBadge.closest("div");
      expect(parentDiv).toHaveAttribute("aria-label");
    });

    it("should have alt-like labels for video element", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={false}
        />
      );

      const videoRegion = screen.getByRole("region", { name: /live video preview/i });
      const video = videoRegion.querySelector("video");
      expect(video).toHaveAttribute("aria-label", "Live video stream from webcam");
    });

    it("should have status role for information display", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="audio"
          isRecording={false}
        />
      );

      const statusArea = screen.getByText(/Audio mode • Camera disabled/i).closest("div");
      expect(statusArea).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Integration", () => {
    it("should render correctly with all props in video recording state", () => {
      const mockStream = createMockMediaStream();
      render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      // All elements should be present
      expect(screen.getByRole("region", { name: /live video preview/i })).toBeInTheDocument();
      expect(screen.getByText(/● Recording/i)).toBeInTheDocument();
      expect(screen.getByText(/^Video$/i)).toBeInTheDocument();
      expect(screen.getByText(/Live preview • Camera enabled/i)).toBeInTheDocument();
    });

    it("should render correctly in audio-only recording state", () => {
      render(
        <VideoPreview
          mediaStream={null}
          recordingMode="audio"
          isRecording={true}
        />
      );

      expect(screen.getByText(/Audio-Only Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/● Recording/i)).toBeInTheDocument();
      // Find the badge specifically, not the audio-only mode placeholder
      const audioBadges = screen.getAllByText(/Audio-Only/i);
      const badge = audioBadges.find(el => el.style.textTransform === "uppercase");
      expect(badge).toBeInTheDocument();
    });

    it("should render correctly when camera fails after initial video mode", () => {
      const mockStream = createMockMediaStream();
      const { rerender } = render(
        <VideoPreview
          mediaStream={mockStream}
          recordingMode="video"
          isRecording={true}
        />
      );

      // Initially recording with video
      expect(screen.getByText(/● Recording/i)).toBeInTheDocument();

      // Camera fails
      rerender(
        <VideoPreview
          mediaStream={null}
          recordingMode="video"
          isRecording={true}
        />
      );

      // Should show error but keep recording indicator
      expect(screen.getByText(/Camera Unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/● Recording/i)).toBeInTheDocument();
    });
  });
});
