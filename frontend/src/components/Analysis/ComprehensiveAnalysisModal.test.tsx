import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { ComprehensiveAnalysisModal, ImprovementPlan } from "./ComprehensiveAnalysisModal";
import { InterviewRecord } from "@/types/interview";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock apiConfig
jest.mock("@/utils/apiConfig", () => ({
  API_BASE: "http://localhost:3000",
  authHeaders: () => ({ Authorization: "Bearer test" }),
}));

describe("ComprehensiveAnalysisModal", () => {
  const mockSessionId = "test-session-123";
  const mockInterview: InterviewRecord = {
    sessionId: mockSessionId,
    created_at: "2024-01-15T10:00:00Z",
    finalized: true,
  };

  const mockImprovementPlan: ImprovementPlan = {
    session_id: mockSessionId,
    session_date: "2024-01-15",
    overall_score: 72,
    hire_verdict: "Maybe",
    technical_analysis: {
      gaps: [
        {
          category: "System Design",
          priority: "Critical",
          frequency: 3,
          impact_score: 92,
        },
      ],
    },
    communication_analysis: {
      gaps: [
        {
          category: "Clarity",
          severity: "High",
        },
      ],
    },
    holistic_guidance: {
      gap_relationships: [],
      recommended_sequence: [],
    },
    transformation_analysis: {
      critical_moment: "During system design discussion",
      candidate_original: "Not sure...",
      elite_response: "Here's the approach...",
      why_better: "More structured and clear",
    },
    resources_analysis: {
      resources: [],
    },
    generated_at: "2024-01-15T10:30:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render nothing when isOpen is false", () => {
      const { container } = render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={false}
          onClose={jest.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should show loading spinner when fetching", () => {
      mockedAxios.get.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText("Loading analysis...")).toBeInTheDocument();
    });

    it("should render modal header with session info when open", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Interview Analysis")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Score: 72\/100/)).toBeInTheDocument();
        expect(screen.getByText("Maybe")).toBeInTheDocument();
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch improvement plan on mount when isOpen", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `http://localhost:3000/analysis/${mockSessionId}`,
          { headers: { Authorization: "Bearer test" } }
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to load analysis/)).toBeInTheDocument();
      });
    });

    it("should display error message and retry button on failure", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Failed"));

      const { rerender } = render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });

      // Click retry button
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      fireEvent.click(screen.getByText("Retry"));

      await waitFor(() => {
        expect(screen.getByText(/Score: 72\/100/)).toBeInTheDocument();
      });
    });
  });

  describe("Tab Navigation", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });
    });

    it("should render all 5 tabs", async () => {
      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Technical")).toBeInTheDocument();
        expect(screen.getByText("Communication")).toBeInTheDocument();
        expect(screen.getByText("Holistic")).toBeInTheDocument();
        expect(screen.getByText("Transformation Moments")).toBeInTheDocument();
        expect(screen.getByText("Resources")).toBeInTheDocument();
      });
    });

    it("should display technical tab content by default", async () => {
      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Technical Analysis")).toBeInTheDocument();
      });
    });

    it("should switch tabs when clicking tab buttons", async () => {
      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Technical Analysis")).toBeInTheDocument();
      });

      // Click Communication tab
      const communicationTab = screen.getAllByText("Communication")[0];
      fireEvent.click(communicationTab);

      await waitFor(() => {
        expect(screen.getByText("Communication Assessment")).toBeInTheDocument();
      });

      // Click Holistic tab
      const holisticTab = screen.getAllByText("Holistic")[0];
      fireEvent.click(holisticTab);

      await waitFor(() => {
        expect(screen.getByText("Holistic View")).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    beforeEach(() => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });
    });

    it("should close modal when close button clicked", async () => {
      const onClose = jest.fn();
      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Interview Analysis")).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      fireEvent.click(closeButtons[1]); // X button in top right

      expect(onClose).toHaveBeenCalled();
    });

    it("should close modal when clicking outside", async () => {
      const onClose = jest.fn();
      const { container } = render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Interview Analysis")).toBeInTheDocument();
      });

      // Click the backdrop
      const backdrop = container.querySelector(".fixed.inset-0");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it("should not close when clicking inside modal content", async () => {
      const onClose = jest.fn();
      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Interview Analysis")).toBeInTheDocument();
      });

      // Click inside the modal
      const content = screen.getByText("Technical Analysis");
      fireEvent.click(content);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("should refresh plan when Refresh button clicked", async () => {
      const { rerender } = render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Interview Analysis")).toBeInTheDocument();
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      const refreshButton = screen.getByText("Refresh");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Session Metadata Display", () => {
    it("should display session date, score, and verdict", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText("Score: 72/100")).toBeInTheDocument();
        expect(screen.getByText("Maybe")).toBeInTheDocument();
      });
    });

    it("should show correct verdict color", async () => {
      const hireVerdict = { ...mockImprovementPlan, hire_verdict: "Hire" };
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: hireVerdict },
      });

      render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        const verdict = screen.getByText("Hire");
        expect(verdict).toHaveClass("text-emerald-400");
      });
    });
  });

  describe("Props Validation", () => {
    it("should only fetch once when modal opens", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      const { rerender } = render(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });

      // Re-render without changes
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, plan: mockImprovementPlan },
      });

      rerender(
        <ComprehensiveAnalysisModal
          sessionId={mockSessionId}
          interview={mockInterview}
          isOpen={true}
          onClose={jest.fn()}
        />
      );

      // Should still be 1 (not fetched again)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});
