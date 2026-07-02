"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  ImprovementPlan,
  StudyResource,
  ResourceType,
  ResourcesAnalysis,
} from "@/types/analysis";

interface ResourcesTabProps {
  plan: ImprovementPlan;
}

/**
 * Resource type color mapping
 */
function getResourceTypeColor(
  type: ResourceType
): { bg: string; text: string; icon: React.ReactNode } {
  const config = {
    [ResourceType.Book]: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      icon: "📕",
    },
    [ResourceType.Course]: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      icon: "🎓",
    },
    [ResourceType.Blog]: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      icon: "📝",
    },
    [ResourceType.Documentation]: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      icon: "📚",
    },
    [ResourceType.Tutorial]: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      icon: "🎬",
    },
    [ResourceType.Practice]: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      icon: "💪",
    },
    [ResourceType.Guide]: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      icon: "🧭",
    },
  };

  return (
    config[type] || {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      icon: "📄",
    }
  );
}

/**
 * Resource card component
 */
function ResourceCard({
  resource,
}: {
  resource: StudyResource;
}) {
  const [status, setStatus] = useState<"not_started" | "started" | "completed">(
    "not_started"
  );
  const typeColor = getResourceTypeColor(resource.type);

  return (
    <div className="p-4 bg-white/5 border border-border rounded-lg hover:bg-white/10 transition-colors group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`${typeColor.bg} ${typeColor.text} px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider`}>
              {resource.type}
            </span>
            {resource.author && (
              <span className="text-xs text-foreground-muted">by {resource.author}</span>
            )}
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate"
            title={resource.title}
          >
            {resource.title}
          </a>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary group-hover:scale-110 transition-transform flex-shrink-0"
          title="Open resource"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Categories */}
      {resource.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {resource.categories.map((cat, idx) => (
            <span key={idx} className="text-xs px-2 py-1 rounded bg-white/10 text-foreground-muted">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Status toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatus("not_started")}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            status === "not_started"
              ? "bg-gray-500/30 text-gray-300 border border-gray-500/50"
              : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
          }`}
        >
          Not Started
        </button>
        <button
          onClick={() => setStatus("started")}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            status === "started"
              ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
              : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
          }`}
        >
          Started
        </button>
        <button
          onClick={() => setStatus("completed")}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
            status === "completed"
              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
              : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
          }`}
        >
          Completed
        </button>
      </div>
    </div>
  );
}

/**
 * Coverage gap badge component - shows gaps with no resources
 */
function CoverageGapBadge({ gap }: { gap: string }) {
  return (
    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
      <AlertCircle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Coverage Gap</p>
        <p className="text-xs text-yellow-400/80 mt-1">
          <span className="font-semibold">{gap}</span>: No resources available. Consider consulting community
          forums or requesting guidance from a mentor.
        </p>
      </div>
    </div>
  );
}

/**
 * ResourcesTab - Main component
 *
 * Displays a centralized list of all curated resources with:
 * - Filtering by resource type (Book, Course, Blog, etc.)
 * - Filtering by gap category
 * - Sorting by recommended order
 * - Ability to mark resources as Not Started / Started / Completed
 * - Coverage gap indicators for gaps with no resources
 * - Direct links to all resources
 *
 * **Validates: Requirements 5.3, 5.4, 5.5, 6.4**
 */
export const ResourcesTab: React.FC<ResourcesTabProps> = ({ plan }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ResourceType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get resource analysis - handle null gracefully
  const resourcesAnalysis: ResourcesAnalysis | null = plan.resources_analysis || null;
  const allResources = useMemo(
    () => resourcesAnalysis?.all_resources || [],
    [resourcesAnalysis]
  );
  const coverageGaps = useMemo(
    () => resourcesAnalysis?.coverage_gaps || [],
    [resourcesAnalysis]
  );
  const availableTypes = useMemo(
    () => resourcesAnalysis?.available_types || [],
    [resourcesAnalysis]
  );
  
  // Calculate categories using useMemo (outside conditional rendering)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allResources.forEach((r) => r.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [allResources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return allResources.filter((resource) => {
      // Type filter
      if (selectedType !== "all" && resource.type !== selectedType) {
        return false;
      }

      // Category filter
      if (
        selectedCategory !== "all" &&
        !resource.categories.some(
          (cat) => cat.toLowerCase() === selectedCategory.toLowerCase()
        )
      ) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          resource.title.toLowerCase().includes(query) ||
          resource.author?.toLowerCase().includes(query) ||
          resource.categories.some((cat) =>
            cat.toLowerCase().includes(query)
          )
        );
      }

      return true;
    });
  }, [allResources, selectedType, selectedCategory, searchQuery]);

  // Handle no resources case
  if (!resourcesAnalysis || allResources.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <p className="text-foreground-muted">No resources were curated for this interview.</p>
        <p className="text-sm text-foreground-muted mt-2">Excellent performance!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white/5 rounded-lg border border-border">
        <div>
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-1">Total Resources</p>
          <p className="text-2xl font-bold text-foreground">{allResources.length}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-1">Resource Types</p>
          <p className="text-2xl font-bold text-primary">{availableTypes.length}</p>
        </div>
        {coverageGaps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-yellow-400 uppercase mb-1">Coverage Gaps</p>
            <p className="text-2xl font-bold text-yellow-400">{coverageGaps.length}</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search resources by title, author, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-border rounded-lg text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filter by Type */}
        <div>
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-2 flex items-center gap-2">
            <Filter size={14} />
            Filter by Type
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedType === "all"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
              }`}
            >
              All Types
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  selectedType === type
                    ? "bg-primary text-white"
                    : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Filter by Category */}
        {categories.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase mb-2 flex items-center gap-2">
              <Filter size={14} />
              Filter by Gap Category
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-white"
                    : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-white/5 text-foreground-muted hover:bg-white/10 border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coverage Gaps Alert */}
      {coverageGaps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground-muted uppercase">Areas Without Resources</p>
          <div className="space-y-2">
            {coverageGaps.map((gap, idx) => (
              <CoverageGapBadge key={idx} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Resources List */}
      {filteredResources.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-foreground-muted uppercase mb-3">
            Showing {filteredResources.length} of {allResources.length} resources
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white/5 border border-border rounded-lg">
          <BookOpen size={32} className="mx-auto text-foreground-muted mb-3 opacity-50" />
          <p className="text-foreground-muted">
            No resources match your current filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setSelectedCategory("all");
            }}
            className="mt-3 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Resource Tips */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <BookOpen size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">How to Use These Resources</p>
            <ul className="text-xs text-foreground-muted space-y-1 list-disc list-inside">
              <li>Start with resources related to your highest-priority gaps</li>
              <li>Mix resource types (combine reading with hands-on practice)</li>
              <li>Mark resources as &quot;Started&quot; and &quot;Completed&quot; to track your progress</li>
              <li>For coverage gaps, consider posting questions in community forums or finding a mentor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesTab;
