"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import axios from "axios";
import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { InterviewRecord } from "@/types/interview";
import { TechnicalAnalysisTab } from "./TechnicalAnalysisTab";
import { CommunicationTab } from "./CommunicationTab";
import { HolisticViewTab } from "./HolisticViewTab";
import { TransformationMomentsTab } from "./TransformationMomentsTab";
import { ResourcesTab } from "./ResourcesTab";

import type { ImprovementPlan } from "@/types/analysis";

export interface ComprehensiveAnalysisModalProps {
  sessionId: string;
  interview: InterviewRecord;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "technical" | "communication" | "holistic" | "moments" | "resources";

/**
 * ComprehensiveAnalysisModal Component
 *
 * Displays a comprehensive multi-tab analysis report for a completed interview session.
 * 
 * Features:
 * - Modal wrapper with header, close button, and back button
 * - Tab navigation between 5 tabs (Technical, Communication, Holistic, Transformation Moments, Resources)
 * - Loading spinner during fetch
 * - Error message on failure with retry option
 * - Session metadata display (date, score, verdict)
 * 
 * Requirements Covered:
 * - 6.1: Structured Report Generation and Display
 * - 7.2: User Interaction Patterns and Plan Accessibility
 */
export const ComprehensiveAnalysisModal: React.FC<ComprehensiveAnalysisModalProps> = ({
  sessionId,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("technical");
  const [plan, setPlan] = useState<ImprovementPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch improvement plan on modal open
   */
  useEffect(() => {
    if (!isOpen || plan) {
      return;
    }

    let isMounted = true;

    const fetchImprovementPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE}/analysis/${sessionId}`,
          { headers: authHeaders() }
        );

        if (!isMounted) return;

        if (response.data.success && response.data.plan) {
          setPlan(response.data.plan);
        } else {
          setError("Failed to load improvement plan. Please try again.");
        }
      } catch (err) {
        if (!isMounted) return;

        const message =
          err instanceof Error
            ? err.message
            : "Unable to load analysis. Please refresh the page.";
        setError(message);
        console.error("Error fetching improvement plan:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImprovementPlan();

    return () => {
      isMounted = false;
    };
  }, [isOpen, plan, sessionId]);

  /**
   * Refetch improvement plan (manual refresh)
   */
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE}/analysis/${sessionId}`,
        { headers: authHeaders() }
      );

      if (response.data.success && response.data.plan) {
        setPlan(response.data.plan);
      } else {
        setError("Failed to load improvement plan. Please try again.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load analysis. Please refresh the page.";
      setError(message);
      console.error("Error fetching improvement plan:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  if (!isOpen) {
    return null;
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "technical", label: "Technical" },
    { id: "communication", label: "Communication" },
    { id: "holistic", label: "Holistic" },
    { id: "moments", label: "Transformation Moments" },
    { id: "resources", label: "Resources" },
  ];

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={onClose}
              className="p-2 rounded-md bg-secondary hover:bg-secondary-hover text-foreground-muted hover:text-foreground transition-colors mt-0"
              title="Back to interview history"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Interview Analysis</h2>
              {plan && (
                <div className="flex items-center gap-4 mt-2 text-sm text-foreground-muted">
                  <span>
                    {new Date(plan.session_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>Score: {plan.overall_score}/100</span>
                  <span
                    className={`font-semibold ${
                      plan.hire_verdict === "Hire"
                        ? "text-emerald-400"
                        : plan.hire_verdict === "No Hire"
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    {plan.hire_verdict}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md bg-secondary hover:bg-secondary-hover text-foreground-muted hover:text-foreground transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <Loader2 size={48} className="animate-spin text-primary" />
            <p className="text-foreground-muted">Loading analysis...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-foreground mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && plan && (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-border p-4 overflow-x-auto flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-secondary hover:bg-secondary-hover text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {activeTab === "technical" && <TechnicalAnalysisTab plan={plan} />}

                {activeTab === "communication" && <CommunicationTab plan={plan} />}

                {activeTab === "holistic" && <HolisticViewTab plan={plan} />}

                {activeTab === "moments" && <TransformationMomentsTab plan={plan} />}

                {activeTab === "resources" && <ResourcesTab plan={plan} />}
              </div>
            </div>
          </>
        )}

        {/* Footer Actions */}
        {!loading && !error && plan && (
          <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 secondary"
            >
              Close
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-secondary hover:bg-secondary-hover rounded-lg text-foreground transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAnalysisModal;
