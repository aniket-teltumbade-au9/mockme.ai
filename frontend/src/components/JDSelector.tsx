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
    <div className="mb-6">
      <label className="block text-sm font-semibold mb-4 text-foreground">
        Job Description
      </label>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCustomMode(true)}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
            customMode 
              ? "bg-primary/20 border border-primary text-indigo-400" 
              : "bg-white/5 border border-border text-foreground-muted hover:bg-white/10"
          }`}
        >
          Custom JD
        </button>
        <button
          onClick={() => setCustomMode(false)}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
            !customMode 
              ? "bg-primary/20 border border-primary text-indigo-400" 
              : "bg-white/5 border border-border text-foreground-muted hover:bg-white/10"
          }`}
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
          className="w-full h-[200px] bg-secondary border border-border rounded-xl p-4 text-white font-mono text-sm resize-y focus:outline-none focus:border-primary transition-colors"
        />
      ) : (
        <div>
          {/* Template Dropdown Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full py-3 px-4 bg-secondary border border-border rounded-xl text-foreground flex items-center justify-between cursor-pointer mb-4 text-sm hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              {jdLoading ? "Loading templates..." : `${jdSamples.length} templates available`}
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${showTemplates ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {/* Templates Grid */}
          {showTemplates && (
            <div
              className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto p-2 bg-white/5 border border-border rounded-xl mb-4"
            >
              {jdLoading ? (
                <div className="p-8 text-center text-foreground-muted">
                  Loading templates...
                </div>
              ) : jdSamples.length > 0 ? (
                jdSamples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectTemplate(sample.description)}
                    className="p-4 bg-white/5 border border-border rounded-lg text-left transition-all hover:bg-primary/10 hover:border-primary group"
                  >
                    <div className="text-sm font-semibold text-indigo-400 mb-1 group-hover:text-indigo-300">
                      Day {sample.day_number}: {sample.role}
                    </div>
                    <div className="text-xs text-foreground-muted mb-2">
                      {sample.metadata.company} • {sample.metadata.experience}
                    </div>
                    <div className="text-[0.7rem] text-foreground-muted/60 leading-relaxed">
                      📍 {sample.metadata.location} | {sample.metadata.industry_preference}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-foreground-muted">
                  No templates available
                </div>
              )}
            </div>
          )}

          {/* Selected Template Preview */}
          {value && !customMode && (
            <div
              className="p-4 bg-accent/10 border border-accent/30 rounded-lg text-foreground-muted text-xs max-h-[150px] overflow-y-auto"
            >
              <div className="text-accent font-semibold mb-2">Selected JD Preview:</div>
              <div className="whitespace-pre-wrap font-mono text-[0.75rem] leading-relaxed opacity-80">
                {value.substring(0, 300)}...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
