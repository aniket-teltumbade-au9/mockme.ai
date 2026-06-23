"use client";
import React, { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import { useJDSamples } from "@/hooks/useJDSamples";

interface JDSelectorProps {
  value: string;
  onChange: (jd: string) => void;
}

export const JDSelector: React.FC<JDSelectorProps> = ({ value, onChange }) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [customMode, setCustomMode] = useState(!value || value.length < 100);
  const { samples: jdSamples, loading: jdLoading } = useJDSamples(50);

  const handleSelectTemplate = (jd: string) => {
    onChange(jd);
    setShowTemplates(false);
    setCustomMode(false);
  };

  const handleCustomChange = (text: string) => {
    onChange(text);
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem", color: "var(--foreground)" }}>
        Job Description
      </label>

      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setCustomMode(true)}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: customMode ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.05)",
            border: customMode ? "1px solid #6366f1" : "1px solid var(--border)",
            borderRadius: "8px",
            color: customMode ? "#818cf8" : "var(--foreground-muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: customMode ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          Custom JD
        </button>
        <button
          onClick={() => setCustomMode(false)}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: !customMode ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.05)",
            border: !customMode ? "1px solid #6366f1" : "1px solid var(--border)",
            borderRadius: "8px",
            color: !customMode ? "#818cf8" : "var(--foreground-muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: !customMode ? 600 : 400,
            transition: "all 0.2s",
          }}
        >
          Template
        </button>
      </div>

      {/* Custom Mode */}
      {customMode ? (
        <textarea
          value={value}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="Paste the Job Description here. Sarah will tailor the interview to these requirements..."
          style={{
            width: "100%",
            height: "200px",
            background: "var(--secondary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1rem",
            color: "white",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            resize: "vertical",
          }}
        />
      ) : (
        <div>
          {/* Template Dropdown Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={16} />
              {jdLoading ? "Loading templates..." : `${jdSamples.length} templates available`}
            </div>
            <ChevronDown
              size={18}
              style={{
                transform: showTemplates ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* Templates Grid */}
          {showTemplates && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0.75rem",
                maxHeight: "400px",
                overflowY: "auto",
                padding: "0.5rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                marginBottom: "1rem",
              }}
            >
              {jdLoading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--foreground-muted)" }}>
                  Loading templates...
                </div>
              ) : jdSamples.length > 0 ? (
                jdSamples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectTemplate(sample.description)}
                    style={{
                      padding: "1rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                      e.currentTarget.style.borderColor = "#818cf8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#818cf8", marginBottom: "0.25rem" }}>
                      Day {sample.day_number}: {sample.role}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--foreground-muted)", marginBottom: "0.5rem" }}>
                      {sample.metadata.company} • {sample.metadata.experience}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--foreground-muted)", lineHeight: "1.4" }}>
                      📍 {sample.metadata.location} | {sample.metadata.industry_preference}
                    </div>
                  </button>
                ))
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--foreground-muted)" }}>
                  No templates available
                </div>
              )}
            </div>
          )}

          {/* Selected Template Preview */}
          {value && !customMode && (
            <div
              style={{
                padding: "1rem",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "8px",
                color: "var(--foreground-muted)",
                fontSize: "0.8rem",
                maxHeight: "150px",
                overflowY: "auto",
              }}
            >
              <div style={{ color: "#10b981", fontWeight: 600, marginBottom: "0.5rem" }}>Selected JD Preview:</div>
              <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.75rem", lineHeight: "1.4" }}>
                {value.substring(0, 300)}...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
