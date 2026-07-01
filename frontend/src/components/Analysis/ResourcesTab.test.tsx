import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourcesTab } from "./ResourcesTab";
import { ImprovementPlan, ResourceType } from "@/types/analysis";

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
      critical_moment: "",
      candidate_original: "",
      elite_response: "",
      why_better: "",
    },
    resources_analysis: {
      all_resources: [
        {
          id: "res-1",
          title: "Designing Data-Intensive Applications",
          author: "Martin Kleppmann",
          type: ResourceType.Book,
          url: "https://dataintensive.com",
          categories: ["System Design"],
        },
        {
          id: "res-2",
          title: "ByteByteGo System Design Course",
          author: "Alex Xu",
          type: ResourceType.Course,
          url: "https://bytebytego.com",
          categories: ["System Design"],
        },
        {
          id: "res-3",
          title: "LeetCode",
          type: ResourceType.Practice,
          url: "https://leetcode.com",
          categories: ["Algorithms", "Code Quality"],
        },
      ],
      resources_by_type: {
        [ResourceType.Book]: [
          {
            id: "res-1",
            title: "Designing Data-Intensive Applications",
            author: "Martin Kleppmann",
            type: ResourceType.Book,
            url: "https://dataintensive.com",
            categories: ["System Design"],
          },
        ],
        [ResourceType.Course]: [
          {
            id: "res-2",
            title: "ByteByteGo System Design Course",
            author: "Alex Xu",
            type: ResourceType.Course,
            url: "https://bytebytego.com",
            categories: ["System Design"],
          },
        ],
        [ResourceType.Practice]: [
          {
            id: "res-3",
            title: "LeetCode",
            type: ResourceType.Practice,
            url: "https://leetcode.com",
            categories: ["Algorithms", "Code Quality"],
          },
        ],
      } as any,
      resources_by_category: {
        "System Design": [
          {
            id: "res-1",
            title: "Designing Data-Intensive Applications",
            author: "Martin Kleppmann",
            type: ResourceType.Book,
            url: "https://dataintensive.com",
            categories: ["System Design"],
          },
          {
            id: "res-2",
            title: "ByteByteGo System Design Course",
            author: "Alex Xu",
            type: ResourceType.Course,
            url: "https://bytebytego.com",
            categories: ["System Design"],
          },
        ],
      },
      coverage_gaps: ["Code Architecture"],
      total_resources: 3,
      available_types: [
        ResourceType.Book,
        ResourceType.Course,
        ResourceType.Practice,
      ],
    },
    generated_at: "2024-01-15T10:30:00Z",
    ...overrides,
  };
};

describe("ResourcesTab", () => {
  it("renders no resources message when resources list is empty", () => {
    const plan = createMockImprovementPlan({
      resources_analysis: {
        all_resources: [],
        resources_by_type: {},
        resources_by_category: {},
        coverage_gaps: [],
        total_resources: 0,
        available_types: [],
      },
    });

    render(<ResourcesTab plan={plan} />);
    expect(
      screen.getByText(/No resources were curated for this interview/i)
    ).toBeInTheDocument();
  });

  it("displays resource count statistics", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Total resources
  });

  it("displays resource type statistics", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Resource types count
  });

  it("displays coverage gaps count", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText(/Coverage Gaps/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // Coverage gap count
  });

  it("renders search input", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(
      screen.getByPlaceholderText(/Search resources/i)
    ).toBeInTheDocument();
  });

  it("filters resources by search query", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const searchInput = screen.getByPlaceholderText(/Search resources/i);
    await user.type(searchInput, "ByteByteGo");

    expect(screen.getByText("ByteByteGo System Design Course")).toBeInTheDocument();
    expect(
      screen.queryByText("Designing Data-Intensive Applications")
    ).not.toBeInTheDocument();
  });

  it("filters resources by type", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const bookButton = screen.getByRole("button", { name: /book/i });
    await user.click(bookButton);

    expect(
      screen.getByText("Designing Data-Intensive Applications")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("ByteByteGo System Design Course")
    ).not.toBeInTheDocument();
  });

  it("filters resources by category", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const systemDesignButton = screen.getByRole("button", {
      name: /System Design/i,
    });
    await user.click(systemDesignButton);

    expect(
      screen.getByText("Designing Data-Intensive Applications")
    ).toBeInTheDocument();
    expect(
      screen.getByText("ByteByteGo System Design Course")
    ).toBeInTheDocument();
    expect(screen.queryByText("LeetCode")).not.toBeInTheDocument();
  });

  it("displays resource cards with information", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(
      screen.getByText("Designing Data-Intensive Applications")
    ).toBeInTheDocument();
    expect(screen.getByText("Martin Kleppmann")).toBeInTheDocument();
    expect(screen.getByText("ByteByteGo System Design Course")).toBeInTheDocument();
  });

  it("displays resource type badges", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText("BOOK")).toBeInTheDocument();
    expect(screen.getByText("COURSE")).toBeInTheDocument();
    expect(screen.getByText("PRACTICE")).toBeInTheDocument();
  });

  it("displays coverage gap warnings", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText(/Coverage Gap/i)).toBeInTheDocument();
    expect(screen.getByText(/Code Architecture/i)).toBeInTheDocument();
  });

  it("allows filtering by 'All Types'", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const bookButton = screen.getByRole("button", { name: /book/i });
    await user.click(bookButton);

    expect(screen.getByText("Showing 1 of 3")).toBeInTheDocument();

    const allTypesButton = screen.getByRole("button", { name: /All Types/i });
    await user.click(allTypesButton);

    expect(screen.getByText("Showing 3 of 3")).toBeInTheDocument();
  });

  it("shows 'clear filters' option when no results match", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const searchInput = screen.getByPlaceholderText(/Search resources/i);
    await user.type(searchInput, "NonExistentResource");

    expect(screen.getByText(/Clear Filters/i)).toBeInTheDocument();
  });

  it("clears all filters when clear button is clicked", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const searchInput = screen.getByPlaceholderText(/Search resources/i);
    await user.type(searchInput, "NonExistentResource");

    const clearButton = screen.getByText(/Clear Filters/i);
    await user.click(clearButton);

    expect(screen.getByText("Showing 3 of 3")).toBeInTheDocument();
  });

  it("shows resource status buttons for each resource", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const notStartedButtons = screen.getAllByText("Not Started");
    expect(notStartedButtons.length).toBeGreaterThan(0);

    const startedButtons = screen.getAllByText("Started");
    expect(startedButtons.length).toBeGreaterThan(0);

    const completedButtons = screen.getAllByText("Completed");
    expect(completedButtons.length).toBeGreaterThan(0);
  });

  it("allows changing resource status", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const notStartedButtons = screen.getAllByText("Not Started");
    if (notStartedButtons.length > 0) {
      await user.click(notStartedButtons[0]);

      const startedButtons = screen.getAllByText("Started");
      expect(startedButtons.length).toBeGreaterThan(0);
    }
  });

  it("displays resource help section", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText(/How to Use These Resources/i)).toBeInTheDocument();
  });

  it("handles null resources_analysis gracefully", () => {
    const plan = createMockImprovementPlan({
      resources_analysis: null,
    } as any);

    render(<ResourcesTab plan={plan} />);
    expect(
      screen.getByText(/No resources were curated for this interview/i)
    ).toBeInTheDocument();
  });

  it("displays resource categories for each resource", () => {
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText("System Design")).toBeInTheDocument();
    expect(screen.getByText("Algorithms")).toBeInTheDocument();
    expect(screen.getByText("Code Quality")).toBeInTheDocument();
  });

  it("displays external link icons for resources", () => {
    const plan = createMockImprovementPlan();
    const { container } = render(<ResourcesTab plan={plan} />);

    // Check for links with external link icons
    const links = container.querySelectorAll(
      'a[href*="https://"][target="_blank"]'
    );
    expect(links.length).toBeGreaterThan(0);
  });

  it("handles multiple coverage gaps", () => {
    const plan = createMockImprovementPlan({
      resources_analysis: {
        ...createMockImprovementPlan().resources_analysis,
        coverage_gaps: ["Code Architecture", "Distributed Systems"],
      },
    } as any);

    render(<ResourcesTab plan={plan} />);

    expect(screen.getByText(/Code Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/Distributed Systems/i)).toBeInTheDocument();
  });

  it("displays resource count after filtering", async () => {
    const user = userEvent.setup();
    const plan = createMockImprovementPlan();
    render(<ResourcesTab plan={plan} />);

    const systemDesignButton = screen.getByRole("button", {
      name: /System Design/i,
    });
    await user.click(systemDesignButton);

    expect(screen.getByText("Showing 2 of 3")).toBeInTheDocument();
  });
});
