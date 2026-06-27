/**
 * Tests for AddMarkerModal Component
 * 
 * Tests cover:
 * - Modal visibility toggle
 * - Adding marker with and without note
 * - Closing modal via close button
 * - Closing modal via escape key
 * - Adding marker via Enter key
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddMarkerModal } from "./AddMarkerModal";

describe("AddMarkerModal", () => {
  const mockOnClose = jest.fn();
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("visibility", () => {
    it("should not render when isOpen is false", () => {
      render(
        <AddMarkerModal
          isOpen={false}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.queryByText("Add Timestamp Marker")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText("Add Timestamp Marker")).toBeInTheDocument();
    });
  });

  describe("timestamp display", () => {
    it("should display current timestamp in MM:SS format", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={125.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      expect(screen.getByText("2:05")).toBeInTheDocument();
    });
  });

  describe("adding marker", () => {
    it("should call onAdd with note when add button is clicked", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const input = screen.getByPlaceholderText(
        /e.g., Stuttered here, needs practice/i
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Stumbled here" } });

      const addButton = screen.getByRole("button", { name: /Add Marker/i });
      fireEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith("Stumbled here");
    });

    it("should call onAdd with undefined when adding without note", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const addButton = screen.getByRole("button", { name: /Add Marker/i });
      fireEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith(undefined);
    });

    it("should trim whitespace from note", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const input = screen.getByPlaceholderText(
        /e.g., Stuttered here, needs practice/i
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "  Test note  " } });

      const addButton = screen.getByRole("button", { name: /Add Marker/i });
      fireEvent.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith("Test note");
    });

    it("should add marker when Enter key is pressed", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const input = screen.getByPlaceholderText(
        /e.g., Stuttered here, needs practice/i
      );
      fireEvent.change(input, { target: { value: "Test note" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockOnAdd).toHaveBeenCalledWith("Test note");
    });
  });

  describe("closing modal", () => {
    it("should call onClose when close button is clicked", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const closeButton = screen.getByRole("button", {
        name: /Close modal/i,
      });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when cancel button is clicked", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should close modal when Escape key is pressed", () => {
      render(
        <AddMarkerModal
          isOpen={true}
          timestamp={45.5}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      const input = screen.getByPlaceholderText(
        /e.g., Stuttered here, needs practice/i
      );
      fireEvent.keyDown(input, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
