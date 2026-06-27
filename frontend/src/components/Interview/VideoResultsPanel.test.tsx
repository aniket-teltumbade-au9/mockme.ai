import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  VideoResultsPanel,
  VideoResultsPanelProps,
  PerformanceAnalysis,
} from "./VideoResultsPanel";
import { VideoMetadata } from "./VideoPlayer";

// Mock VideoPlayer to avoid complex dependencies
jest.mock("./VideoPlayer", () => ({
  VideoPlayer: ({ videoUrl, videoMetadata }: any) => (
    <div data-testid="video-player">
      <video src={videoUrl} aria-label="Interview video playback" />
      <button aria-label="Play video">Play</button>
      <div>{videoMetadata.duration}</div>
    </div>
  ),
}));

/**
 * Mock video metadata for testing
 */
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

/**
 * Mock performance analysis data for testing
 */
const mockPerformanceAnalysis: PerformanceAnalysis = {
  overall_score: 7.5,
  hire_verdict: "Strong candidate, move to next round",
  communication_assessment: {
    overall_score: 8,
    clarity: 8,
    structure: 7,
    confidence: 7.5,
    strengths: ["Clear explanation", "Good pacing"],
    gaps: ["Could use more examples"],
    summary: "Good communication overall",
  },
  skill_gaps: ["System design", "Database optimization"],
};

/**
 * Default props for VideoResultsPanel
 */
const defaultProps: VideoResultsPanelProps = {
  videoMetadata: mockVideoMetadata,
  performanceAnalysis: mockPerformanceAnalysis,
  recordingMode: "video",
  onDownload: jest.fn(),
  onRetryInterview: jest.fn(),
};

describe("VideoResultsPanel Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Sub-task 3.2.1: Compose VideoPlayer on left/top section
   */
  describe("VideoPlayer composition", () => {
    it("should render VideoPlayer component", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      // The VideoPlayer component is composed, but we can verify by checking for elements it creates
      const playButton = screen.getByLabelText("Play video");
      expect(playButton).toBeInTheDocument();
    });

    it("should pass correct metadata to VideoPlayer", () => {
      const { container } = render(<VideoResultsPanel {...defaultProps} />);

      // Check that metadata is displayed in the VideoPlayer
      expect(screen.getByText("600")).toBeInTheDocument(); // Duration in seconds
    });
  });

  /**
   * Sub-task 3.2.2: Display recording metadata panel
   */
  describe("Recording metadata display", () => {
    it("should display recording metadata panel", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const metadataHeader = screen.getByText("RECORDING METADATA");
      expect(metadataHeader).toBeInTheDocument();
    });

    it("should display duration correctly", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      // Duration should be formatted as MM:SS
      expect(screen.getByText("10:00")).toBeInTheDocument();
    });

    it("should display recording mode as video", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      expect(screen.getByText("Video + Audio")).toBeInTheDocument();
    });

    it("should display recording mode as audio-only when recordingMode is audio", () => {
      const props = { ...defaultProps, recordingMode: "audio" as const };
      render(<VideoResultsPanel {...props} />);

      expect(screen.getByText("Audio Only")).toBeInTheDocument();
    });

    it("should display file size in MB", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const fileSizeMB = (mockVideoMetadata.fileSize / 1024 / 1024).toFixed(2);
      expect(screen.getByText(`${fileSizeMB} MB`)).toBeInTheDocument();
    });

    it("should display upload date", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      // Date should be formatted
      const dateText = new Date(mockVideoMetadata.uploadedAt).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric", year: "numeric" }
      );
      expect(screen.getByText(dateText)).toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.2.3: Place existing performance analysis on right side
   */
  describe("Performance analysis display", () => {
    it("should display performance analysis section", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const analysisHeader = screen.getByText("PERFORMANCE ANALYSIS");
      expect(analysisHeader).toBeInTheDocument();
    });

    it("should display overall score", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      // Use getAllByText since there may be multiple 7.5 values
      const scores = screen.getAllByText("7.5");
      expect(scores.length).toBeGreaterThan(0);
    });

    it("should display hire verdict", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      expect(
        screen.getByText("Strong candidate, move to next round")
      ).toBeInTheDocument();
    });

    it("should display communication assessment scores", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      expect(screen.getByText("COMMUNICATION")).toBeInTheDocument();
    });

    it("should display skill gaps", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      expect(screen.getByText("System design")).toBeInTheDocument();
      expect(screen.getByText("Database optimization")).toBeInTheDocument();
    });

    it("should allow collapsing the analysis section", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      // The button that expands/collapses contains the header and chevron icon
      const performanceHeader = screen.getByText("PERFORMANCE ANALYSIS");
      const expandButton = performanceHeader.closest("button");
      
      expect(expandButton).toBeInTheDocument();
      
      // Before clicking, analysis content should be visible
      expect(screen.getByText("Overall Score")).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(expandButton!);
      
      // After clicking, content should be hidden
      expect(screen.queryByText("Overall Score")).not.toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.2.4: Create timestamp markers section with mark/list/delete
   */
  describe("Timestamp markers functionality", () => {
    it("should display timestamp markers section", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const markersHeader = screen.getByText("TIMESTAMP MARKERS");
      expect(markersHeader).toBeInTheDocument();
    });

    it("should show empty state when no markers", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      expect(
        screen.getByText(/No markers yet/)
      ).toBeInTheDocument();
    });

    it("should allow adding a marker with note", async () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText("Add note (optional)...");
      const markButton = screen.getByText("Mark");

      fireEvent.change(input, { target: { value: "Test marker note" } });
      fireEvent.click(markButton);

      await waitFor(() => {
        // Marker timestamp should appear
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });

      // Now click to expand and verify note is there
      const markerTime = screen.getByText("0:00");
      const markerItem = markerTime.closest("div");
      fireEvent.click(markerItem!);

      await waitFor(() => {
        expect(screen.getByText("Test marker note")).toBeInTheDocument();
      });
    });

    it("should add marker on Enter key in note input", async () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText("Add note (optional)...");

      fireEvent.change(input, { target: { value: "Enter key test" } });
      fireEvent.keyPress(input, { key: "Enter", code: 13, charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });

      // Expand marker
      const markerTime = screen.getByText("0:00");
      const markerItem = markerTime.closest("div");
      fireEvent.click(markerItem!);

      await waitFor(() => {
        expect(screen.getByText("Enter key test")).toBeInTheDocument();
      });
    });

    it("should display marker timestamp", async () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText("Add note (optional)...");
      const markButton = screen.getByText("Mark");

      fireEvent.change(input, { target: { value: "Test marker" } });
      fireEvent.click(markButton);

      await waitFor(() => {
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });
    });

    it("should allow deleting a marker", async () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText("Add note (optional)...");
      const markButton = screen.getByText("Mark");

      fireEvent.change(input, { target: { value: "To delete" } });
      fireEvent.click(markButton);

      await waitFor(() => {
        const markerList = screen.getByText("To delete").closest("div");
        expect(markerList).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /delete marker/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        // After deletion, the marker content should not be there
        expect(screen.queryByText("To delete")).not.toBeInTheDocument();
      });
    });

    it("should expand/collapse marker details", async () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText("Add note (optional)...");
      const markButton = screen.getByText("Mark");

      fireEvent.change(input, { target: { value: "Expandable marker" } });
      fireEvent.click(markButton);

      await waitFor(() => {
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });

      // Marker note should be hidden initially (not expanded)
      expect(screen.queryByText("Expandable marker")).not.toBeInTheDocument();

      // Click on the marker to expand
      const markerTime = screen.getAllByText("0:00")[1]; // The second one is the marker, not the button
      const markerContainer = markerTime.closest("div")?.parentElement;
      fireEvent.click(markerContainer!);

      // After click, note should be visible
      await waitFor(() => {
        expect(screen.getByText("Expandable marker")).toBeInTheDocument();
      });
    });

    it("should clear note input after adding marker", async () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText(
        "Add note (optional)..."
      ) as HTMLInputElement;
      const markButton = screen.getByText("Mark");

      fireEvent.change(input, { target: { value: "Test note" } });
      fireEvent.click(markButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  /**
   * Sub-task 3.2.5: Add notes/comments area for self-review
   */
  describe("Self-review notes area", () => {
    it("should display self-review notes section", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const notesHeader = screen.getByText("SELF-REVIEW NOTES");
      expect(notesHeader).toBeInTheDocument();
    });

    it("should display notes textarea", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        /Add your self-review notes/
      );
      expect(textarea).toBeInTheDocument();
    });

    it("should update notes state when typing", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        /Add your self-review notes/
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, {
        target: { value: "This is my self-review" },
      });

      expect(textarea.value).toBe("This is my self-review");
    });

    it("should display character count", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Add your self-review notes/);

      fireEvent.change(textarea, {
        target: { value: "ABC" },
      });

      expect(screen.getByText("3 characters")).toBeInTheDocument();
    });

    it("should persist notes when component re-renders", () => {
      const { rerender } = render(
        <VideoResultsPanel {...defaultProps} />
      );

      const textarea = screen.getByPlaceholderText(
        /Add your self-review notes/
      ) as HTMLTextAreaElement;

      fireEvent.change(textarea, {
        target: { value: "My notes" },
      });

      rerender(<VideoResultsPanel {...defaultProps} />);

      expect(textarea.value).toBe("My notes");
    });
  });

  /**
   * Sub-task 3.2.6: Implement responsive layout
   */
  describe("Responsive layout", () => {
    it("should render grid layout", () => {
      const { container } = render(<VideoResultsPanel {...defaultProps} />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ display: "flex", flexDirection: "column" });
    });

    it("should render video and analysis sections", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      // Check for VideoPlayer (which shows play button)
      expect(screen.getByLabelText("Play video")).toBeInTheDocument();

      // Check for analysis section
      expect(screen.getByText("PERFORMANCE ANALYSIS")).toBeInTheDocument();
    });
  });

  /**
   * Sub-task 3.2.7: Add "Retry Interview" button
   */
  describe("Retry Interview button", () => {
    it("should display Retry Interview button when callback provided", () => {
      render(<VideoResultsPanel {...defaultProps} />);

      const retryButton = screen.getByRole("button", {
        name: /Retry Interview/i,
      });
      expect(retryButton).toBeInTheDocument();
    });

    it("should call onRetryInterview when button clicked", () => {
      const onRetryInterview = jest.fn();
      const props = { ...defaultProps, onRetryInterview };

      render(<VideoResultsPanel {...props} />);

      const retryButton = screen.getByRole("button", {
        name: /Retry Interview/i,
      });
      fireEvent.click(retryButton);

      expect(onRetryInterview).toHaveBeenCalledTimes(1);
    });

    it("should not display Retry Interview button when callback not provided", () => {
      const props = { ...defaultProps, onRetryInterview: undefined };
      render(<VideoResultsPanel {...props} />);

      const retryButton = screen.queryByRole("button", {
        name: /Retry Interview/i,
      });
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  /**
   * Integration tests
   */
  describe("Integration", () => {
    it("should handle complete workflow", async () => {
      const onDownload = jest.fn();
      const onRetryInterview = jest.fn();

      render(
        <VideoResultsPanel
          {...defaultProps}
          onDownload={onDownload}
          onRetryInterview={onRetryInterview}
        />
      );

      // Add markers
      const input = screen.getByPlaceholderText("Add note (optional)...");
      const markButton = screen.getByText("Mark");

      fireEvent.change(input, { target: { value: "Marker 1" } });
      fireEvent.click(markButton);

      await waitFor(() => {
        expect(screen.getByText("Marker 1")).toBeInTheDocument();
      });

      // Add notes
      const textarea = screen.getByPlaceholderText(/Add your self-review notes/);
      fireEvent.change(textarea, { target: { value: "My review" } });

      expect(textarea).toHaveValue("My review");

      // Verify analysis is shown
      expect(screen.getByText("PERFORMANCE ANALYSIS")).toBeInTheDocument();
    });

    it("should render without performance analysis", () => {
      const props = { ...defaultProps, performanceAnalysis: undefined };
      render(<VideoResultsPanel {...props} />);

      expect(screen.queryByText("PERFORMANCE ANALYSIS")).not.toBeInTheDocument();
      expect(screen.getByText("RECORDING METADATA")).toBeInTheDocument();
    });
  });
});
