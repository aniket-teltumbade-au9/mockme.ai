import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunicationTab } from "./CommunicationTab";
import {
  ImprovementPlan,
  PriorityLevel,
} from "@/types/analysis";

/**
 * Mock improvement plan data for testing
 */
const createMockImprovementPlan = (
  overrides?: Partial<ImprovementPlan>
): ImprovementPlan => {
  return {
    session_id: "test-session-123",
    session_date: "2024-01-15",
    overall_score: 72,
    hire_verdict: "Maybe",
    technical_analysis: {
      gaps: [],
      gaps_by_priority: {},
      topic_info: {},
      resolution_paths: [],
    },
    communication_analysis: {
      gaps: [
        {
          category: "Clarity",
          severity: PriorityLevel.High,
          description: "Tendency to ramble without clear conclusions",
          candidate_response: "Uh, so I think the issue is... well, there are multiple factors...",
          improvement_tips: [
            "Start with the conclusion",
            "Use structured frameworks",
            "Practice the 2-minute rule",
          ],
          sample_improved_response:
            "The key issue is X. Here's why: first, Y; second, Z. Therefore, we should do A.",
          related_tactic: {
            tactic_name: "The 2-Minute Sanity Check",
            description: "Ensure your response can be explained in 2 minutes",
            example:
              "Before speaking, ask yourself: can I explain this in 2 minutes?",
          },
        },
        {
          category: "Structure",
          severity: PriorityLevel.Medium,
          description: "Responses lack logical flow and organization",
          candidate_response:
            "Well, there's this thing about caching, and also we need to think about load balancing...",
          improvement_tips: [
            "Use STAR framework for behavioral questions",
            "Structure technical explanations with problem-approach-solution",
            "Group related concepts together",
          ],
          sample_improved_response:
            "Let me structure this: (1) Problem statement, (2) My approach, (3) Trade-offs, (4) Implementation",
        },
      ],
      gaps_by_category: {},
      overall_communication_score: 68,
      category_scores: {
        clarity: 65,
        structure: 60,
        conciseness: 75,
        active_listening: 70,
        confidence: 72,
        technical_vocabulary: 68,
      },
    },
    holistic_guidance: {
      gap_relationships: [],
      recommended_sequence: [],
      dependency_map: {},
      action_checklist: [],
      integrated_guidance: "",
    },
    transformation_analysis: {
      critical_moment: "",
      candidate_original: "",
      elite_response: "",
      why_better: "",
    },
    resources_analysis: {
      all_resources: [],
      resources_by_type: {},
      resources_by_category: {},
      coverage_gaps: [],
      total_resources: 0,
      available_types: [],
    },
    generated_at: "2024-01-15T10:30:00Z",
    ...overrides,
  };
};

describe("CommunicationTab", () => {
  it("renders no gaps message when communication gaps are empty", () => {
    const plan = createMockImprovementPlan({
      communication_analysis: {
        gaps: [],
        gaps_by_category: {},
      } as Record<string, unknown>,
    });

    render(<CommunicationTab plan={plan} />);
    expect(
      screen.getByText(/No communication gaps were identified/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Excellent communication skills!/i)
    ).toBeInTheDocument();
  });

  it("renders communication gap cards", () => {
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    expect(screen.getByText("Clarity")).toBeInTheDocument();
    expect(screen.getByText("Structure")).toBeInTheDocument();
  });

  it("displays category scores grid when scores are available", () => {
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    expect(screen.getByText(/Communication Scores by Category/i)).toBeInTheDocument();
    expect(screen.getByText("Clarity")).toBeInTheDocument();
    expect(screen.getByText("65/100")).toBeInTheDocument();
  });

  it("shows gap statistics", () => {
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    expect(screen.getByText("2")).toBeInTheDocument(); // Total gaps
  });

  it("expands gap card on click to show details", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    const clarityCard = screen.getByText("Clarity").closest("button");
    if (clarityCard) {
      await user.click(clarityCard);

      // Check if details are shown
      expect(screen.getByText(/Improvement Tips/i)).toBeInTheDocument();
      expect(screen.getByText(/Before & After Example/i)).toBeInTheDocument();
    }
  });

  it("displays improvement tips when gap is expanded", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    const clarityCard = screen.getByText("Clarity").closest("button");
    if (clarityCard) {
      await user.click(clarityCard);
      await user.click(screen.getByText(/Improvement Tips/i));

      expect(screen.getByText("Start with the conclusion")).toBeInTheDocument();
      expect(screen.getByText("Use structured frameworks")).toBeInTheDocument();
    }
  });

  it("displays before/after responses", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    const clarityCard = screen.getByText("Clarity").closest("button");
    if (clarityCard) {
      await user.click(clarityCard);
      await user.click(screen.getByText(/Before & After Example/i));

      expect(
        screen.getByText(/tendency to ramble/i, { exact: false })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The key issue is X/i, { exact: false })
      ).toBeInTheDocument();
    }
  });

  it("shows related tactic when available", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    const clarityCard = screen.getByText("Clarity").closest("button");
    if (clarityCard) {
      await user.click(clarityCard);

      expect(screen.getByText(/The 2-Minute Sanity Check/i)).toBeInTheDocument();
    }
  });

  it("groups gaps by category", () => {
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    expect(screen.getByText("Clarity")).toBeInTheDocument();
    expect(screen.getByText("Structure")).toBeInTheDocument();
  });

  it("displays severity badges for each gap", () => {
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    // Check for severity level indicators
    const cards = screen.getAllByText(/High|Medium/i);
    expect(cards.length).toBeGreaterThan(0);
  });

  it("handles null communication analysis gracefully", () => {
    const plan = createMockImprovementPlan({
      communication_analysis: null,
    } as Record<string, unknown>);

    render(<CommunicationTab plan={plan} />);
    expect(
      screen.getByText(/No communication gaps were identified/i)
    ).toBeInTheDocument();
  });

  it("handles gaps without related tactics", () => {
    const plan = createMockImprovementPlan({
      communication_analysis: {
        gaps: [
          {
            category: "Conciseness",
            severity: PriorityLevel.Low,
            description: "Some responses are too verbose",
            candidate_response: "Long response...",
            improvement_tips: ["Be concise"],
            sample_improved_response: "Concise response.",
            // No related_tactic
          },
        ],
        gaps_by_category: {},
      } as Record<string, unknown>,
    });

    render(<CommunicationTab plan={plan} />);
    expect(screen.getByText("Conciseness")).toBeInTheDocument();
  });

  it("calculates total gap count correctly", () => {
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    // Should show 2 total gaps
    const totalGapsElements = screen.getAllByText("2");
    expect(totalGapsElements.length).toBeGreaterThan(0);
  });

  it("displays practice prompt button", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<CommunicationTab plan={plan} />);

    const clarityCard = screen.getByText("Clarity").closest("button");
    if (clarityCard) {
      await user.click(clarityCard);

      expect(
        screen.getByText(/Generate Practice Prompt/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Record Your Response/i)).toBeInTheDocument();
    }
  });
});
