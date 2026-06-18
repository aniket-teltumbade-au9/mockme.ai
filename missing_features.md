# Interview Preparation Routine: Feature Gap Analysis

This document outlines the missing features required to transform the current mock interview application into a comprehensive tool that supports the daily routine of: **Study → Mock Interview → Analyze → Work on Drawbacks**.

## 1. Study Phase (Preparation)
*   **Curated Learning Resources:** The app currently lacks a library of study materials.
    *   *Feature Idea:* Integrate a feature to suggest specific articles, documentation, or video tutorials based on the gaps identified in the "Analyze" phase.
*   **Topic-Specific Prep:**
    *   *Feature Idea:* Allow users to select specific topics (e.g., "System Design," "React Hooks," "DSA - Graphs") before starting a mock interview session.

## 2. Mock Interview Phase
*   **Difficulty & Focus Customization:** Currently, the interview is dynamically generated based on the JD.
    *   *Feature Idea:* Allow users to set "Target Level" (e.g., Junior, Senior) or "Topic Focus" to pressure-test specific areas.
*   **Rehearsal Mode:**
    *   *Feature Idea:* A low-stakes "practice mode" where the LLM provides immediate feedback after each turn, instead of waiting for the conclusion (STATE_3).

## 3. Analyze Phase
*   **Progress Visualization:** The app tracks sessions but lacks longitudinal analysis.
    *   *Feature Idea:* Add a "Performance Dashboard" showing metrics over time (e.g., "Communication Score" trend, "Technical Accuracy" improvement rate over the last 30 days).
*   **Historical Comparison:**
    *   *Feature Idea:* Side-by-side comparison of transcriptions/analysis from the first session vs. current session to demonstrate growth.

## 4. Work on Drawbacks Phase
*   **Gap-Based Remediation:**
    *   *Feature Idea:* After STATE_3, automatically generate a "Remediation Plan" containing 3 specific coding problems or concepts the user *must* master before the next mock interview.
*   **"Focus Mode" for Weaknesses:**
    *   *Feature Idea:* A session type that *only* targets the candidate's historical weaknesses (as identified in previous sessions).

## 5. Routine Management
*   **Daily Roadmap/Tracking:** The current UI is a list of sessions.
    *   *Feature Idea:* A "100-Day Roadmap" view that shows the user's progress against their daily goals, helping to enforce the daily routine.
