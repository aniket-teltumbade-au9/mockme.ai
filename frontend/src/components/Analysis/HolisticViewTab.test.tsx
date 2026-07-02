import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HolisticViewTab } from "./HolisticViewTab";
import { ImprovementPlan } from "@/types/analysis";

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
      gaps: [],
      gaps_by_category: {},
    } as any,
    holistic_guidance: {
      gap_relationships: [
        {
          tech_gap: "System Design",
          comm_gap: "Clarity",
          connection:
            "Your unclear System Design communication likely stems from insufficient System Design knowledge",
        },
      ],
      recommended_sequence: [
        "First, strengthen System Design fundamentals",
        "Then, practice explaining designs clearly",
        "Finally, mock interview practice",
      ],
      dependency_map: {},
      action_checklist: [
        {
          timeline: "This Week",
          items: [
            "Read Chapter 1 of Designing Data-Intensive Applications",
            "Complete 3 system design problems",
          ],
        },
        {
          timeline: "Next Week",
          items: [
            "Practice explaining a design with a friend",
            "Record and review your explanations",
          ],
        },
      ],
      integrated_guidance:
        "Your improvement journey should focus on technical foundations first, then communication clarity",
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

describe("HolisticViewTab", () => {
  it("renders no guidance message when holistic_guidance is missing", () => {
    const plan = createMockImprovementPlan({
      holistic_guidance: null,
    } as any);

    render(<HolisticViewTab plan={plan} />);
    expect(
      screen.getByText(/Holistic guidance is not available/i)
    ).toBeInTheDocument();
  });

  it("renders gap relationships", () => {
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    expect(screen.getByText(/Gap Relationships/i)).toBeInTheDocument();
    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.getByText("Clarity")).toBeInTheDocument();
  });

  it("displays integrated guidance", () => {
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    expect(screen.getByText(/Integrated Guidance/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your improvement journey should focus on technical foundations/i
      )
    ).toBeInTheDocument();
  });

  it("shows recommended sequence", () => {
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    expect(
      screen.getByText(/Recommended Improvement Sequence/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/strengthen System Design fundamentals/i)
    ).toBeInTheDocument();
  });

  it("displays action checklist grouped by timeline", () => {
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    expect(screen.getByText(/Weekly Action Checklist/i)).toBeInTheDocument();
    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("Next Week")).toBeInTheDocument();
  });

  it("expands action timeline items on click", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    const thisWeekButton = screen.getByText("This Week").closest("button");
    if (thisWeekButton) {
      await user.click(thisWeekButton);

      expect(
        screen.getByText(/Read Chapter 1 of Designing Data-Intensive/i)
      ).toBeInTheDocument();
    }
  });

  it("expands gap relationship to show connection details", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    const relationshipCard = screen.getByText("System Design").closest("button");
    if (relationshipCard) {
      await user.click(relationshipCard);

      expect(
        screen.getByText(/Your unclear System Design communication/i)
      ).toBeInTheDocument();
    }
  });

  it("handles empty gap relationships gracefully", () => {
    const plan = createMockImprovementPlan({
      holistic_guidance: {
        gap_relationships: [],
        recommended_sequence: ["Step 1", "Step 2"],
        dependency_map: {},
        action_checklist: [],
        integrated_guidance: "Some guidance",
      },
    } as any);

    render(<HolisticViewTab plan={plan} />);
    expect(
      screen.getByText(/Recommended Improvement Sequence/i)
    ).toBeInTheDocument();
  });

  it("handles empty recommended sequence gracefully", () => {
    const plan = createMockImprovementPlan({
      holistic_guidance: {
        gap_relationships: [
          {
            tech_gap: "System Design",
            comm_gap: "Clarity",
            connection: "They are related",
          },
        ],
        recommended_sequence: [],
        dependency_map: {},
        action_checklist: [],
        integrated_guidance: "Some guidance",
      },
    } as any);

    render(<HolisticViewTab plan={plan} />);
    expect(screen.getByText(/Gap Relationships/i)).toBeInTheDocument();
  });

  it("displays summary information box", () => {
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    expect(
      screen.getByText(/Your Holistic Improvement Plan/i)
    ).toBeInTheDocument();
  });

  it("shows multiple gap relationships if present", () => {
    const plan = createMockImprovementPlan({
      holistic_guidance: {
        gap_relationships: [
          {
            tech_gap: "System Design",
            comm_gap: "Clarity",
            connection: "Connection 1",
          },
          {
            tech_gap: "Algorithms",
            comm_gap: "Confidence",
            connection: "Connection 2",
          },
        ],
        recommended_sequence: [],
        dependency_map: {},
        action_checklist: [],
        integrated_guidance: "",
      },
    } as any);

    render(<HolisticViewTab plan={plan} />);

    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.getByText("Algorithms")).toBeInTheDocument();
  });

  it("shows multiple timeline groups in checklist", () => {
    const plan = createMockImprovementPlan();
    render(<HolisticViewTab plan={plan} />);

    expect(screen.getByText("This Week")).toBeInTheDocument();
    expect(screen.getByText("Next Week")).toBeInTheDocument();
  });

  it("returns message when no content is available", () => {
    const plan = createMockImprovementPlan({
      holistic_guidance: {
        gap_relationships: [],
        recommended_sequence: [],
        dependency_map: {},
        action_checklist: [],
        integrated_guidance: "",
      },
    } as any);

    render(<HolisticViewTab plan={plan} />);

    expect(
      screen.getByText(/No holistic guidance needed/i)
    ).toBeInTheDocument();
  });
});
