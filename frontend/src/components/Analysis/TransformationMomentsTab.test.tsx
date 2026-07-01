import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransformationMomentsTab } from "./TransformationMomentsTab";
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
      gap_relationships: [],
      recommended_sequence: [],
      dependency_map: {},
      action_checklist: [],
      integrated_guidance: "",
    },
    transformation_analysis: {
      critical_moment:
        "When asked about scaling to 1 million users, you hesitated and said you weren't sure.",
      candidate_original:
        "Uh, I'm not really sure how to handle that many users. I guess you would just... add more servers?",
      elite_response:
        'Great question. Here\'s how I\'d approach scaling to 1M users: First, I\'d assess the bottleneck—is it compute, storage, or network? For compute, I\'d implement load balancing and horizontal scaling. For storage, I\'d consider database replication and sharding. I\'d also add caching with Redis and use a CDN. The key trade-off is between consistency and availability—I\'d choose eventual consistency for higher availability. Finally, I\'d monitor metrics like latency and error rates to identify the next bottleneck.',
      why_better:
        "1. Starts with a clear framework (assess bottleneck)\n2. Breaks down into specific areas (compute, storage, network)\n3. Mentions concrete technologies (load balancing, Redis, CDN)\n4. Addresses trade-offs explicitly\n5. Shows understanding of monitoring and iteration",
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

describe("TransformationMomentsTab", () => {
  it("renders no moments message when transformation_analysis is missing", () => {
    const plan = createMockImprovementPlan({
      transformation_analysis: null,
    } as any);

    render(<TransformationMomentsTab plan={plan} />);
    expect(
      screen.getByText(/No critical moments were identified/i)
    ).toBeInTheDocument();
  });

  it("displays the critical moment context", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(
      screen.getByText(/When asked about scaling to 1 million users/i)
    ).toBeInTheDocument();
  });

  it("shows transformation moment header", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Transformation Moment/i)).toBeInTheDocument();
  });

  it("displays response comparison section", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Response Comparison/i)).toBeInTheDocument();
  });

  it("expands to show your response", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    const yourResponseButton = screen.getByText(/Your Response/).closest("button");
    if (yourResponseButton) {
      await user.click(yourResponseButton);

      expect(screen.getByText(/add more servers/i)).toBeInTheDocument();
    }
  });

  it("expands to show elite response by default", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Great question/i)).toBeInTheDocument();
  });

  it("displays key differences section", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Key Differences/i)).toBeInTheDocument();
  });

  it("expands key differences to show breakdown", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    const keyDiffButton = screen.getByText(/Key Differences/).closest("button");
    if (keyDiffButton) {
      await user.click(keyDiffButton);

      expect(
        screen.getByText(/Starts with a clear framework/i)
      ).toBeInTheDocument();
    }
  });

  it("displays key takeaway section", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Key Takeaway/i)).toBeInTheDocument();
  });

  it("displays practice suggestion section", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Practice This/i)).toBeInTheDocument();
  });

  it("shows generate practice question button", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(
      screen.getByText(/Generate Similar Practice Question/i)
    ).toBeInTheDocument();
  });

  it("handles missing transformation data gracefully", () => {
    const plan = createMockImprovementPlan({
      transformation_analysis: {
        critical_moment: "",
        candidate_original: "",
        elite_response: "",
        why_better: "",
      },
    });

    render(<TransformationMomentsTab plan={plan} />);
    expect(
      screen.getByText(/No transformation moments were identified/i)
    ).toBeInTheDocument();
  });

  it("displays all required response sections", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    expect(screen.getByText(/Critical Moment/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Response/i)).toBeInTheDocument();
    expect(screen.getByText(/Elite-Level Response/i)).toBeInTheDocument();
  });

  it("displays why_better content with structured breakdown", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    const keyDiffButton = screen.getByText(/Key Differences/).closest("button");
    if (keyDiffButton) {
      await user.click(keyDiffButton);

      // Check for multiple numbered points from why_better
      expect(
        screen.getByText(/Starts with a clear framework/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Breaks down into specific areas/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Mentions concrete technologies/i)
      ).toBeInTheDocument();
    }
  });

  it("has properly formatted critical moment section", () => {
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    const criticalMomentSection = screen.getByText(/Critical Moment/).closest(
      "div"
    );
    expect(criticalMomentSection).toBeInTheDocument();
  });

  it("returns empty message when transformation_analysis is partially empty", () => {
    const plan = createMockImprovementPlan({
      transformation_analysis: {
        critical_moment: "Some context",
        candidate_original: "",
        elite_response: "",
        why_better: "",
      },
    });

    render(<TransformationMomentsTab plan={plan} />);
    expect(
      screen.getByText(/No transformation moments were identified/i)
    ).toBeInTheDocument();
  });

  it("collapsible sections work independently", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<TransformationMomentsTab plan={plan} />);

    // Your Response section should be collapsed
    expect(
      screen.queryByText(/add more servers/i)
    ).not.toBeInTheDocument();

    // Elite Response should be expanded by default
    expect(screen.getByText(/Great question/i)).toBeInTheDocument();

    // Toggle Your Response
    const yourResponseButton = screen.getByText(/Your Response/).closest(
      "button"
    );
    if (yourResponseButton) {
      await user.click(yourResponseButton);
      expect(screen.getByText(/add more servers/i)).toBeInTheDocument();
    }
  });
});
