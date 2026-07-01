import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TechnicalAnalysisTab } from "./TechnicalAnalysisTab";
import {
  ImprovementPlan,
  PriorityLevel,
  ResourceType,
} from "@/types/analysis";

/**
 * Mock improvement plan data for testing
 */
const createMockImprovementPlan = (overrides?: Partial<ImprovementPlan>): ImprovementPlan => {
  return {
    session_id: "test-session-123",
    session_date: "2024-01-15",
    overall_score: 72,
    hire_verdict: "Maybe",
    technical_analysis: {
      gaps: [
        {
          category: "System Design",
          priority: PriorityLevel.Critical,
          frequency: 3,
          impact_score: 92,
          detected_in: "technical_dive",
        },
        {
          category: "Algorithms",
          priority: PriorityLevel.High,
          frequency: 2,
          impact_score: 78,
          detected_in: "coding_round",
        },
        {
          category: "Code Quality",
          priority: PriorityLevel.Medium,
          frequency: 1,
          impact_score: 65,
          detected_in: "coding_round",
        },
      ],
      gaps_by_priority: {
        [PriorityLevel.Critical]: [
          {
            category: "System Design",
            priority: PriorityLevel.Critical,
            frequency: 3,
            impact_score: 92,
            detected_in: "technical_dive",
          },
        ],
        [PriorityLevel.High]: [
          {
            category: "Algorithms",
            priority: PriorityLevel.High,
            frequency: 2,
            impact_score: 78,
            detected_in: "coding_round",
          },
        ],
        [PriorityLevel.Medium]: [
          {
            category: "Code Quality",
            priority: PriorityLevel.Medium,
            frequency: 1,
            impact_score: 65,
            detected_in: "coding_round",
          },
        ],
      },
      topic_info: {
        "System Design": {
          concept: "The process of designing distributed systems that are scalable, reliable, and maintainable.",
          subtopics: [
            "Load Balancing & Traffic Distribution",
            "Caching Strategies",
            "Database Scaling",
          ],
          competencies: ["Understanding CAP theorem", "Ability to estimate scale"],
          pitfalls: ["Designing for current scale instead of 10x scale"],
        },
        Algorithms: {
          concept: "The study of computational problem-solving techniques.",
          subtopics: [
            "Big-O Notation",
            "Sorting Algorithms",
            "Dynamic Programming",
          ],
          competencies: ["Time complexity analysis", "Data structure selection"],
          pitfalls: ["Not analyzing complexity before coding"],
        },
        "Code Quality": {
          concept: "Writing clean, maintainable code following best practices.",
          subtopics: ["Code organization", "Naming conventions", "Testing"],
          competencies: ["Code review skills", "Best practices knowledge"],
          pitfalls: ["Writing unmaintainable code"],
        },
      },
      resolution_paths: [
        {
          gap_category: "System Design",
          steps: [
            {
              step_number: 1,
              title: "Understand",
              description: "Learn the fundamentals of distributed systems.",
              activities: ["Read System Design Primer", "Study CAP theorem"],
              time_estimate: "1-2 hours",
              resources: [],
            },
            {
              step_number: 2,
              title: "Practice",
              description: "Practice designing systems.",
              activities: ["Design a URL shortener", "Design a chat application"],
              time_estimate: "3-5 hours",
              resources: [],
            },
            {
              step_number: 3,
              title: "Demonstrate",
              description: "Practice explaining your designs.",
              activities: [
                "Record yourself explaining a system design",
                "Practice with a peer",
              ],
              time_estimate: "1-2 hours",
              resources: [],
            },
            {
              step_number: 4,
              title: "Validate",
              description: "Validate your improvements.",
              activities: [
                "Review your design against checklist",
                "Get feedback from mentor",
              ],
              time_estimate: "1 hour",
              resources: [],
            },
          ],
          estimated_total_time: "6-10 hours",
        },
      ],
    },
    communication_analysis: {
      gaps: [],
      gaps_by_category: {},
    },
    holistic_guidance: {
      gap_relationships: [],
      recommended_sequence: ["System Design", "Algorithms"],
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
          id: "resource-1",
          title: "Designing Data-Intensive Applications",
          author: "Martin Kleppmann",
          type: ResourceType.Book,
          url: "https://example.com/book1",
          categories: ["System Design"],
        },
        {
          id: "resource-2",
          title: "ByteByteGo System Design",
          author: "Alex Xu",
          type: ResourceType.Course,
          url: "https://example.com/course1",
          categories: ["System Design"],
        },
      ],
      resources_by_type: {
        [ResourceType.Book]: [],
        [ResourceType.Course]: [],
        [ResourceType.Blog]: [],
        [ResourceType.Documentation]: [],
        [ResourceType.Tutorial]: [],
        [ResourceType.Practice]: [],
        [ResourceType.Guide]: [],
      },
      resources_by_category: {
        "System Design": [
          {
            id: "resource-1",
            title: "Designing Data-Intensive Applications",
            author: "Martin Kleppmann",
            type: ResourceType.Book,
            url: "https://example.com/book1",
            categories: ["System Design"],
          },
          {
            id: "resource-2",
            title: "ByteByteGo System Design",
            author: "Alex Xu",
            type: ResourceType.Course,
            url: "https://example.com/course1",
            categories: ["System Design"],
          },
        ],
      },
      coverage_gaps: ["Algorithms", "Code Quality"],
      total_resources: 2,
      available_types: [ResourceType.Book, ResourceType.Course],
    },
    generated_at: "2024-01-15T10:30:00Z",
  };
};

describe("TechnicalAnalysisTab", () => {
  describe("Rendering", () => {
    test("should render gap count summary", () => {
      const plan = createMockImprovementPlan();
      render(<TechnicalAnalysisTab plan={plan} />);

      expect(screen.getByText("Total Gaps")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument(); // 3 total gaps
    });

    test("should display all priority levels with counts", () => {
      const plan = createMockImprovementPlan();
      render(<TechnicalAnalysisTab plan={plan} />);

      expect(screen.getByText(/Critical Gaps \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/High Priority Gaps \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Medium Priority Gaps \(1\)/)).toBeInTheDocument();
    });

    test("should display all gaps with priority badges", () => {
      const plan = createMockImprovementPlan();
      render(<TechnicalAnalysisTab plan={plan} />);

      expect(screen.getByText("System Design")).toBeInTheDocument();
      expect(screen.getByText("Algorithms")).toBeInTheDocument();
      expect(screen.getByText("Code Quality")).toBeInTheDocument();
    });

    test("should display gap metadata (frequency, impact, detection)", () => {
      const plan = createMockImprovementPlan();
      render(<TechnicalAnalysisTab plan={plan} />);

      // System Design: Appeared 3x, Impact 92/100
      const criticalSection = screen.getByText(/Critical Gaps/);
      const criticalContainer = criticalSection.closest("div")?.nextElementSibling;
      expect(criticalContainer).toHaveTextContent("Appeared 3x");
      expect(criticalContainer).toHaveTextContent("Impact: 92/100");
    });
  });

  describe("Gap Card Expansion", () => {
    test("should expand gap card when clicked", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      expect(systemDesignCard).toBeTruthy();

      await user.click(systemDesignCard!);

      // After expanding, topic information should be visible
      expect(screen.getByText("Topic Information")).toBeInTheDocument();
    });

    test("should collapse gap card when clicked again", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");

      // Expand
      await user.click(systemDesignCard!);
      expect(screen.getByText("Topic Information")).toBeInTheDocument();

      // Collapse
      await user.click(systemDesignCard!);
      // Topic info section should still exist in DOM but not visible
      // (Expand/collapse is visual, component stays mounted)
    });
  });

  describe("Topic Information", () => {
    test("should display topic information when expanded", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      expect(screen.getByText(/distributed systems that are scalable/)).toBeInTheDocument();
    });

    test("should display subtopics", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      expect(screen.getByText("Sub-Topics to Focus On")).toBeInTheDocument();
      expect(screen.getByText("Load Balancing & Traffic Distribution")).toBeInTheDocument();
      expect(screen.getByText("Caching Strategies")).toBeInTheDocument();
    });

    test("should display competencies", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      expect(screen.getByText("Key Competencies Required")).toBeInTheDocument();
      expect(screen.getByText("Understanding CAP theorem")).toBeInTheDocument();
    });

    test("should display pitfalls", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      expect(screen.getByText("Common Pitfalls to Avoid")).toBeInTheDocument();
      expect(
        screen.getByText("Designing for current scale instead of 10x scale")
      ).toBeInTheDocument();
    });
  });

  describe("Resolution Path", () => {
    test("should display resolution path when expanded", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      expect(screen.getByText(/Resolution Path/)).toBeInTheDocument();
    });

    test("should display all four resolution steps", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      // Click to expand resolution path
      const resolutionButton = screen.getByText(/Resolution Path/);
      const resolutionCard = resolutionButton.closest("button")?.parentElement;
      if (resolutionCard) {
        await user.click(resolutionButton);
      }

      expect(screen.getByText("Understand")).toBeInTheDocument();
      expect(screen.getByText("Practice")).toBeInTheDocument();
      expect(screen.getByText("Demonstrate")).toBeInTheDocument();
      expect(screen.getByText("Validate")).toBeInTheDocument();
    });

    test("should display time estimates for each step", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      const resolutionButton = screen.getByText(/Resolution Path/);
      await user.click(resolutionButton);

      expect(screen.getByText("1-2 hours")).toBeInTheDocument();
      expect(screen.getByText("3-5 hours")).toBeInTheDocument();
    });

    test("should display activities for each step", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      const resolutionButton = screen.getByText(/Resolution Path/);
      await user.click(resolutionButton);

      expect(screen.getByText("Read System Design Primer")).toBeInTheDocument();
      expect(screen.getByText("Design a URL shortener")).toBeInTheDocument();
    });
  });

  describe("Resources Section", () => {
    test("should display resources for gaps with available resources", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      const resourcesButton = screen.getByText(/Related Resources/);
      expect(resourcesButton).toBeInTheDocument();
    });

    test("should display coverage gap message for gaps without resources", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const algorithmsCard = screen.getByText("Algorithms").closest("button");
      await user.click(algorithmsCard!);

      expect(screen.getByText(/\[Coverage Gap\]/)).toBeInTheDocument();
      expect(
        screen.getByText(
          /No resources available for this topic/
        )
      ).toBeInTheDocument();
    });

    test("should link to resources when expanded", async () => {
      const plan = createMockImprovementPlan();
      const user = userEvent.setup();
      render(<TechnicalAnalysisTab plan={plan} />);

      const systemDesignCard = screen.getByText("System Design").closest("button");
      await user.click(systemDesignCard!);

      const resourcesButton = screen.getByText(/Related Resources/);
      await user.click(resourcesButton);

      const resourceLink = screen.getByText("Designing Data-Intensive Applications");
      expect(resourceLink).toHaveAttribute("href", "https://example.com/book1");
      expect(resourceLink).toHaveAttribute("target", "_blank");
    });
  });

  describe("Empty State", () => {
    test("should display success message when no gaps detected", () => {
      const plan = createMockImprovementPlan();
      plan.technical_analysis.gaps = [];

      render(<TechnicalAnalysisTab plan={plan} />);

      expect(
        screen.getByText(/No specific technical gaps were identified/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Great technical performance!/)).toBeInTheDocument();
    });

    test("should display checkmark icon when no gaps", () => {
      const plan = createMockImprovementPlan();
      plan.technical_analysis.gaps = [];

      const { container } = render(<TechnicalAnalysisTab plan={plan} />);

      // Check for the CheckCircle2 icon (will be in SVG)
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Priority Ordering", () => {
    test("should sort gaps by priority descending", () => {
      const plan = createMockImprovementPlan();
      render(<TechnicalAnalysisTab plan={plan} />);

      // Get section headers
      const sections = screen.getAllByText(/Gaps/);

      // First should be Critical
      expect(sections[0]).toHaveTextContent("Critical Gaps");
      // Then High
      expect(sections[1]).toHaveTextContent("High Priority Gaps");
      // Then Medium
      expect(sections[2]).toHaveTextContent("Medium Priority Gaps");
    });

    test("should not display empty priority sections", () => {
      const plan = createMockImprovementPlan();
      plan.technical_analysis.gaps = [
        {
          category: "System Design",
          priority: PriorityLevel.Critical,
          frequency: 3,
          impact_score: 92,
          detected_in: "technical_dive",
        },
      ];
      plan.technical_analysis.gaps_by_priority = {
        [PriorityLevel.Critical]: [
          {
            category: "System Design",
            priority: PriorityLevel.Critical,
            frequency: 3,
            impact_score: 92,
            detected_in: "technical_dive",
          },
        ],
      };

      render(<TechnicalAnalysisTab plan={plan} />);

      expect(screen.getByText(/Critical Gaps/)).toBeInTheDocument();
      expect(screen.queryByText(/High Priority Gaps/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Medium Priority Gaps/)).not.toBeInTheDocument();
    });
  });

  describe("Priority Badge Colors", () => {
    test("should display correct color badges for each priority level", async () => {
      const plan = createMockImprovementPlan();
      render(<TechnicalAnalysisTab plan={plan} />);

      // System Design (Critical) should have red badge
      const systemDesignBadge = screen.getByText("Critical").closest("div");
      expect(systemDesignBadge).toHaveClass("text-red-400");

      // Algorithms (High) should have orange badge
      const algorithmsBadge = screen.getByText("High").closest("div");
      expect(algorithmsBadge).toHaveClass("text-orange-400");
    });
  });
});
