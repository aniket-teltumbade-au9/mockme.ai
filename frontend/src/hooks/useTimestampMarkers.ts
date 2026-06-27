/**
 * useTimestampMarkers Hook
 * 
 * Manages video timestamp markers for self-review during interview playback.
 * Provides functionality to:
 * - Create markers with timestamp and optional note
 * - Display markers as a list
 * - Seek video to marked timestamp on click
 * - Delete markers
 * - Persist markers to localStorage
 * 
 * Implements sub-tasks 3.3.2 through 3.3.6
 */

import { useState, useCallback, useEffect } from "react";

export interface TimestampMarker {
  id: string;
  timestamp: number; // seconds
  note?: string;
  createdAt: string; // ISO timestamp
}

interface UseTimestampMarkersOptions {
  sessionId?: string;
  onSeek?: (timestamp: number) => void;
}

/**
 * Hook for managing video timestamp markers
 * Provides marker creation, deletion, listing, and persistence
 */
export const useTimestampMarkers = (
  options: UseTimestampMarkersOptions = {}
) => {
  const { sessionId = "default", onSeek } = options;
  const [markers, setMarkers] = useState<TimestampMarker[]>([]);

  // LocalStorage key for persisting markers
  const storageKey = `video-markers-${sessionId}`;

  // Load markers from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMarkers(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load markers from localStorage:", error);
    }
  }, [storageKey]);

  // Save markers to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(markers));
    } catch (error) {
      console.error("Failed to save markers to localStorage:", error);
    }
  }, [markers, storageKey]);

  /**
   * Create a new marker at the current video time
   * Implements sub-task 3.3.2
   */
  const addMarker = useCallback(
    (timestamp: number, note?: string) => {
      const newMarker: TimestampMarker = {
        id: `marker-${Date.now()}-${Math.random()}`,
        timestamp,
        note,
        createdAt: new Date().toISOString(),
      };

      setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.timestamp - b.timestamp));
    },
    []
  );

  /**
   * Delete a marker by ID
   * Implements sub-task 3.3.5
   */
  const deleteMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
  }, []);

  /**
   * Seek video to a marked timestamp
   * Implements sub-task 3.3.4
   */
  const seekToMarker = useCallback(
    (marker: TimestampMarker) => {
      onSeek?.(marker.timestamp);
    },
    [onSeek]
  );

  /**
   * Clear all markers
   */
  const clearAllMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  /**
   * Get marker at specific timestamp (within tolerance)
   */
  const getMarkerAt = useCallback(
    (timestamp: number, tolerance: number = 0.5) => {
      return markers.find((m) => Math.abs(m.timestamp - timestamp) < tolerance);
    },
    [markers]
  );

  return {
    markers,
    addMarker,
    deleteMarker,
    seekToMarker,
    clearAllMarkers,
    getMarkerAt,
  };
};
