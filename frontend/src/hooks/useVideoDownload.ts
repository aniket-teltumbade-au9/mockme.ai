/**
 * useVideoDownload Hook
 * 
 * Handles video download functionality including:
 * - Filename generation with sessionId and date
 * - Browser file download triggering
 * - Download progress tracking
 * - Error handling with user-friendly messages
 *
 * Validates: Task 3.4 - Add video download functionality
 * Sub-tasks:
 * - 3.4.1 Download button (UI component level)
 * - 3.4.2 Filename generation with sessionId and date
 * - 3.4.3 Trigger browser file download
 * - 3.4.4 Show download progress indication
 * - 3.4.5 Handle download errors gracefully
 */

import { useState, useCallback } from "react";

/**
 * Download progress state
 */
export interface DownloadProgress {
  isDownloading: boolean;
  progress: number; // 0-100
  error: string | null;
}

/**
 * useVideoDownload Hook
 *
 * Provides download functionality for video files with progress tracking and error handling.
 *
 * @param videoUrl - The URL of the video file to download
 * @param sessionId - The session ID for filename generation
 * @returns Download state and handlers
 *
 * @example
 * ```tsx
 * const { isDownloading, progress, error, downloadVideo } = useVideoDownload(videoUrl, sessionId);
 *
 * return (
 *   <>
 *     {error && <div>{error}</div>}
 *     {isDownloading && <div>Downloading: {progress}%</div>}
 *     <button onClick={downloadVideo} disabled={isDownloading}>
 *       Download
 *     </button>
 *   </>
 * );
 * ```
 */
export const useVideoDownload = (videoUrl: string, sessionId: string) => {
  const [downloadState, setDownloadState] = useState<DownloadProgress>({
    isDownloading: false,
    progress: 0,
    error: null,
  });

  /**
   * Generate filename with sessionId and date
   * Format: interview-{sessionId}-{YYYY-MM-DD}.mp4
   * Sub-task 3.4.2
   */
  const generateFilename = useCallback((): string => {
    const date = new Date();
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const shortSessionId = sessionId.substring(0, 8); // Use first 8 chars of sessionId
    return `interview-${shortSessionId}-${dateStr}.mp4`;
  }, [sessionId]);

  /**
   * Download video file
   * Sub-tasks: 3.4.2, 3.4.3, 3.4.4, 3.4.5
   *
   * Process:
   * 1. Generate appropriate filename (3.4.2)
   * 2. Fetch video from URL with progress tracking (3.4.4)
   * 3. Create blob and trigger browser download (3.4.3)
   * 4. Handle errors gracefully (3.4.5)
   */
  const downloadVideo = useCallback(async (): Promise<void> => {
    // Validate inputs
    if (!videoUrl) {
      setDownloadState((prev) => ({
        ...prev,
        error: "Video URL not available",
      }));
      return;
    }

    if (!sessionId) {
      setDownloadState((prev) => ({
        ...prev,
        error: "Session ID not available",
      }));
      return;
    }

    // Start download
    setDownloadState({
      isDownloading: true,
      progress: 0,
      error: null,
    });

    try {
      // Fetch video with progress tracking (Sub-task 3.4.4)
      const response = await fetch(videoUrl);

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(
          `Failed to download video: HTTP ${response.status} ${response.statusText}`
        );
      }

      // Get total file size for progress calculation
      const contentLength = response.headers.get("content-length");
      const total = parseInt(contentLength || "0", 10);

      // If we have a content length, track progress
      if (total > 0 && response.body) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        // Read chunks and track progress
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          // Update progress (Sub-task 3.4.4)
          const progress = Math.round((receivedLength / total) * 100);
          setDownloadState((prev) => ({
            ...prev,
            progress,
          }));
        }

        // Create blob from chunks
        const blob = new Blob(chunks, { type: "video/mp4" });

        // Trigger browser download (Sub-task 3.4.3)
        const blobUrl = URL.createObjectURL(blob);
        const filename = generateFilename();

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL after download
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);

        // Mark download as complete
        setDownloadState({
          isDownloading: false,
          progress: 100,
          error: null,
        });

        // Reset progress after a short delay for UX feedback
        setTimeout(() => {
          setDownloadState((prev) => ({
            ...prev,
            progress: 0,
          }));
        }, 1500);
      } else {
        // Fallback for when content-length is not available
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const filename = generateFilename();

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);

        // Mark complete
        setDownloadState({
          isDownloading: false,
          progress: 100,
          error: null,
        });

        setTimeout(() => {
          setDownloadState((prev) => ({
            ...prev,
            progress: 0,
          }));
        }, 1500);
      }
    } catch (err) {
      // Handle download errors gracefully (Sub-task 3.4.5)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to download video";

      console.error("Download error:", err);

      setDownloadState({
        isDownloading: false,
        progress: 0,
        error: errorMessage,
      });

      // Clear error after 5 seconds
      setTimeout(() => {
        setDownloadState((prev) => ({
          ...prev,
          error: null,
        }));
      }, 5000);
    }
  }, [videoUrl, sessionId, generateFilename]);

  return {
    isDownloading: downloadState.isDownloading,
    progress: downloadState.progress,
    error: downloadState.error,
    downloadVideo,
    generateFilename,
  };
};
