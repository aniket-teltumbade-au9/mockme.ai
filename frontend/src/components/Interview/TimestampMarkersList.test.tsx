/**
 * Tests for TimestampMarkersList Component
 * 
 * Tests cover:
 * - Displaying empty state when no markers
 * - Rendering markers with timestamp and notes
 * - Clicking markers to seek
 * - Deleting markers
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimestampMarkersList } from "./TimestampMarkersList";
import { TimestampMarker } from "../../hooks/useTimestampMarkers";

describe("TimestampMarkersList", () => {
  const mockMarkers: TimestampMarker[] = [
    {
      id: "marker-1",
      timestamp: 45.5,
      note: "Stumbled on this answer",
      createdAt: new Date().toISOString(),
    },
    {
      id: "marker-2",
      timestamp: 120,
      note: "Spoke too fast",
      createdAt: new Date().toISOString(),
    },
    {
      id: "marker-3",
      timestamp: 200,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockOnMarkerClick = jest.fn();
  const mockOnMarkerDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("empty state", () => {
    it("should display empty state message when no markers", () => {
      render(
        <TimestampMarkersList
          markers={[]}
          currentTime={0}
          onMarkerClick={mockOnMarkerClick}
          onMarkerDelete={mockOnMarkerDelete}
        />
      );

      expect(screen.getByText(/No timestamps marked yet/i)).toBeInTheDocument();
    });
  });

  describe("rendering markers", () => {
    it("should render all markers with timestamp and note", () => {
      render(
        <TimestampMarkersList
          markers={mockMarkers}
          currentTime={0}
          onMarkerClick={mockOnMarkerClick}
          onMarkerDelete={mockOnMarkerDelete}
        />
      );

      expect(screen.getByText("0:45")).toBeInTheDocument();
      expect(screen.getByText("2:00")).toBeInTheDocument();
      expect(screen.getByText("3:20")).toBeInTheDocument();

      expect(screen.getByText("Stumbled on this answer")).toBeInTheDocument();
      expect(screen.getByText("Spoke too fast")).toBeInTheDocument();
    });
  });

  describe("marker interactions", () => {
    it("should call onMarkerClick when marker is clicked", () => {
      render(
        <TimestampMarkersList
          markers={mockMarkers}
          currentTime={0}
          onMarkerClick={mockOnMarkerClick}
          onMarkerDelete={mockOnMarkerDelete}
        />
      );

      const markerButton = screen.getByRole("button", {
        name: /Seek to 0:45: Stumbled on this answer/i,
      });

      fireEvent.click(markerButton);

      expect(mockOnMarkerClick).toHaveBeenCalledWith(mockMarkers[0]);
    });

    it("should call onMarkerDelete when delete button is clicked", () => {
      render(
        <TimestampMarkersList
          markers={mockMarkers}
          currentTime={0}
          onMarkerClick={mockOnMarkerClick}
          onMarkerDelete={mockOnMarkerDelete}
        />
      );

      const deleteButtons = screen.getAllByRole("button", {
        name: /Delete marker/i,
      });

      fireEvent.click(deleteButtons[0]);

      expect(mockOnMarkerDelete).toHaveBeenCalledWith("marker-1");
    });

    it("should not call onMarkerClick when delete button is clicked", () => {
      render(
        <TimestampMarkersList
          markers={mockMarkers}
          currentTime={0}
          onMarkerClick={mockOnMarkerClick}
          onMarkerDelete={mockOnMarkerDelete}
        />
      );

      const deleteButtons = screen.getAllByRole("button", {
        name: /Delete marker/i,
      });

      fireEvent.click(deleteButtons[0]);

      expect(mockOnMarkerClick).not.toHaveBeenCalled();
    });
  });
});
