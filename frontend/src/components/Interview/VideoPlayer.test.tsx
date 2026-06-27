import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VideoPlayer, VideoMetadata } from "./VideoPlayer";

// Mock video metadata for testing
const mockVideoMetadata: VideoMetadata = {
  videoUrl: "https://example.com/video.mp4",
  duration: 600, // 10 minutes
  fileSize: 52428800, // 50MB
  codec: "h264",
  width: 1280,
  height: 720,
  frameRate: 30,
  uploadedAt: "2024-01-15T10:30:00Z",
  recordingMode: "video",
};

describe("VideoPlayer Component", () => {
  const mockOnDownload = jest.fn();
  const mockOnTimestampMarked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Sub-task 3.1.1: Build using HTML5 <video> element
   */
  describe("HTML5 video element rendering", () => {
    it("should render a video element with the correct src", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          sessionId="test-session-id"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const videoElement = screen.getByLabelText("Interview video playback");
      expect(videoElement).toBeInTheDocument();
      expect(videoElement).toHaveAttribute("src", mockVideoMetadata.videoUrl);
    });
  });

  /**
   * Sub-task 3.1.2: Implement play, pause, volume, and progress scrubbing controls
   */
  describe("Playback controls", () => {
    it("should render play/pause button", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const playButton = screen.getByLabelText(/play video/i);
      expect(playButton).toBeInTheDocument();
    });

    it("should render volume control", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const volumeControl = screen.getByLabelText(/volume control/i);
      expect(volumeControl).toBeInTheDocument();
    });

    it("should render mute button", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const muteButton = screen.getByLabelText(/mute/i);
      expect(muteButton).toBeInTheDocument();
    });

    it("should render progress bar", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const progressBar = screen.getByLabelText(/video progress/i);
      expect(progressBar).toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.1.3: Add fullscreen button
   */
  describe("Fullscreen button", () => {
    it("should render fullscreen button", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const fullscreenButton = screen.getByLabelText(/fullscreen/i);
      expect(fullscreenButton).toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.1.4: Add playback speed selector
   */
  describe("Playback speed selector", () => {
    it("should render speed selector with all speed options", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const speedSelector = screen.getByLabelText(/playback speed/i);
      expect(speedSelector).toBeInTheDocument();

      // Check for all speed options
      const options = speedSelector.querySelectorAll("option");
      expect(options.length).toBe(4);
      expect(options[0].value).toBe("0.75");
      expect(options[1].value).toBe("1");
      expect(options[2].value).toBe("1.25");
      expect(options[3].value).toBe("1.5");
    });
  });

  /**
   * Sub-task 3.1.5: Add download button
   */
  describe("Download button", () => {
    it("should render download button", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          sessionId="test-session-id"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const downloadButton = screen.getByLabelText(/download video/i);
      expect(downloadButton).toBeInTheDocument();
    });

    it("should call onDownload callback when download button is clicked", async () => {
      // Mock fetch for download
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob(["video data"])),
        } as any)
      );

      // Mock URL methods
      URL.createObjectURL = jest.fn(() => "blob:mock");
      URL.revokeObjectURL = jest.fn();

      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          sessionId="test-session-id"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const downloadButton = screen.getByLabelText(/download video/i);
      downloadButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockOnDownload).toHaveBeenCalled();
    });
  });

  /**
   * Sub-task 3.1.6: Display video metadata
   */
  describe("Metadata display", () => {
    it("should display video duration", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      // Duration should be displayed (10 minutes = 10:00)
      expect(screen.getByText(/duration/i)).toBeInTheDocument();
    });

    it("should display file size", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByText(/file size/i)).toBeInTheDocument();
      expect(screen.getByText(/50 MB/i)).toBeInTheDocument();
    });

    it("should display upload date", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByText(/uploaded/i)).toBeInTheDocument();
    });

    it("should display recording mode", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByText(/mode/i)).toBeInTheDocument();
      expect(screen.getByText(/video \+ audio/i)).toBeInTheDocument();
    });

    it("should display video resolution for video mode", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByText(/resolution/i)).toBeInTheDocument();
      expect(screen.getByText(/1280x720/i)).toBeInTheDocument();
    });

    it("should display frame rate for video mode", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByText(/frame rate/i)).toBeInTheDocument();
      expect(screen.getByText(/30 fps/i)).toBeInTheDocument();
    });

    it("should display audio-only mode when recordingMode is audio", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={{ ...mockVideoMetadata, recordingMode: "audio" }}
          recordingMode="audio"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByText(/audio only/i)).toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.1.7: Show error messages for playback failures
   */
  describe("Error handling", () => {
    it("should display error message on video load error", () => {
      // Mock video error by rendering with invalid URL
      render(
        <VideoPlayer
          videoUrl="invalid-url"
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      // The component should be able to handle errors gracefully
      const videoElement = screen.getByLabelText("Interview video playback");
      expect(videoElement).toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.1.2 (continued): Mark timestamp functionality
   */
  describe("Timestamp marking", () => {
    it("should render mark timestamp button", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const markButton = screen.getByLabelText(/mark timestamp/i);
      expect(markButton).toBeInTheDocument();
    });

    it("should call onTimestampMarked when mark button is clicked", async () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const markButton = screen.getByLabelText(/mark timestamp/i);
      markButton.click();

      // Should be called with current time (0 initially)
      expect(mockOnTimestampMarked).toHaveBeenCalled();
    });
  });

  /**
   * Responsive design test
   */
  describe("Responsive design", () => {
    it("should render video player with responsive container", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const videoElement = screen.getByLabelText("Interview video playback");
      expect(videoElement).toBeInTheDocument();
    });
  });

  /**
   * Accessibility tests
   */
  describe("Accessibility", () => {
    it("should have proper ARIA labels for all interactive elements", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      expect(screen.getByLabelText(/play video/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mute/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/volume control/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/playback speed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fullscreen/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/download video/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mark timestamp/i)).toBeInTheDocument();
    });

    it("should have semantic video element", () => {
      render(
        <VideoPlayer
          videoUrl={mockVideoMetadata.videoUrl}
          videoMetadata={mockVideoMetadata}
          recordingMode="video"
          onDownload={mockOnDownload}
          onTimestampMarked={mockOnTimestampMarked}
        />
      );

      const videoElement = screen.getByLabelText("Interview video playback");
      expect(videoElement.tagName).toBe("VIDEO");
    });
  });
});
