/**
 * Tests for useTimestampMarkers Hook
 * 
 * Tests cover:
 * - Creating markers with timestamps and optional notes
 * - Deleting markers by ID
 * - Seeking to markers
 * - Clearing all markers
 * - Persisting markers to localStorage
 * - Loading markers from localStorage
 */

import { renderHook, act } from "@testing-library/react";
import { useTimestampMarkers } from "./useTimestampMarkers";

describe("useTimestampMarkers", () => {
  // Clean localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("addMarker", () => {
    it("should create a marker with timestamp and optional note", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(45.5, "This is a note");
      });

      expect(result.current.markers).toHaveLength(1);
      expect(result.current.markers[0]).toMatchObject({
        timestamp: 45.5,
        note: "This is a note",
      });
      expect(result.current.markers[0].id).toBeDefined();
      expect(result.current.markers[0].createdAt).toBeDefined();
    });

    it("should create a marker without note", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(30);
      });

      expect(result.current.markers).toHaveLength(1);
      expect(result.current.markers[0].note).toBeUndefined();
    });

    it("should sort markers by timestamp", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(100);
        result.current.addMarker(50);
        result.current.addMarker(75);
      });

      expect(result.current.markers).toHaveLength(3);
      expect(result.current.markers[0].timestamp).toBe(50);
      expect(result.current.markers[1].timestamp).toBe(75);
      expect(result.current.markers[2].timestamp).toBe(100);
    });
  });

  describe("deleteMarker", () => {
    it("should delete a marker by ID", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session-delete" }));

      act(() => {
        result.current.addMarker(45.5);
      });

      expect(result.current.markers).toHaveLength(1);
      const markerId = result.current.markers[0].id;

      act(() => {
        result.current.deleteMarker(markerId);
      });

      expect(result.current.markers).toHaveLength(0);
    });

    it("should not error when deleting non-existent marker", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(45.5);
      });

      expect(() => {
        act(() => {
          result.current.deleteMarker("non-existent-id");
        });
      }).not.toThrow();

      expect(result.current.markers).toHaveLength(1);
    });
  });

  describe("clearAllMarkers", () => {
    it("should clear all markers", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(10);
        result.current.addMarker(20);
        result.current.addMarker(30);
      });

      expect(result.current.markers).toHaveLength(3);

      act(() => {
        result.current.clearAllMarkers();
      });

      expect(result.current.markers).toHaveLength(0);
    });
  });

  describe("getMarkerAt", () => {
    it("should find marker at timestamp within tolerance", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(45.5);
      });

      const marker = result.current.getMarkerAt(45.6, 0.5);
      expect(marker).toBeDefined();
      expect(marker?.timestamp).toBe(45.5);
    });

    it("should not find marker outside tolerance", () => {
      const { result } = renderHook(() => useTimestampMarkers({ sessionId: "test-session" }));

      act(() => {
        result.current.addMarker(45.5);
      });

      const marker = result.current.getMarkerAt(46.5, 0.5);
      expect(marker).toBeUndefined();
    });
  });

  describe("localStorage persistence", () => {
    it("should persist markers to localStorage", () => {
      const sessionId = "test-session-persist";
      const { result } = renderHook(() => useTimestampMarkers({ sessionId }));

      act(() => {
        result.current.addMarker(45.5, "Test marker");
      });

      const stored = localStorage.getItem(`video-markers-${sessionId}`);
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].timestamp).toBe(45.5);
      expect(parsed[0].note).toBe("Test marker");
    });

    it("should load markers from localStorage on mount", () => {
      const sessionId = "test-session-load";
      const storedMarkers = [
        {
          id: "marker-1",
          timestamp: 30,
          note: "First marker",
          createdAt: new Date().toISOString(),
        },
        {
          id: "marker-2",
          timestamp: 60,
          note: "Second marker",
          createdAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem(`video-markers-${sessionId}`, JSON.stringify(storedMarkers));

      const { result } = renderHook(() => useTimestampMarkers({ sessionId }));

      expect(result.current.markers).toHaveLength(2);
      expect(result.current.markers[0].timestamp).toBe(30);
      expect(result.current.markers[1].timestamp).toBe(60);
    });

    it("should handle corrupted localStorage data gracefully", () => {
      const sessionId = "test-session-corrupt";
      localStorage.setItem(`video-markers-${sessionId}`, "invalid json{");

      const { result } = renderHook(() => useTimestampMarkers({ sessionId }));

      expect(result.current.markers).toHaveLength(0);
    });
  });

  describe("seekToMarker callback", () => {
    it("should call onSeek callback when seeking to marker", () => {
      const mockOnSeek = jest.fn();
      const { result } = renderHook(() =>
        useTimestampMarkers({ sessionId: "test-session-seek", onSeek: mockOnSeek })
      );

      act(() => {
        result.current.addMarker(45.5, "Test");
      });

      expect(result.current.markers).toHaveLength(1);
      const marker = result.current.markers[0];

      act(() => {
        result.current.seekToMarker(marker);
      });

      expect(mockOnSeek).toHaveBeenCalledWith(45.5);
    });
  });
});
