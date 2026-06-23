"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Mic,
  Database,
  Cloud,
} from "lucide-react";
import axios from "axios";

import { API_BASE, authHeaders } from "@/utils/apiConfig";
import { useJDSamples } from "@/hooks/useJDSamples";

type StepStatus = "pending" | "loading" | "ok" | "warn" | "error";

interface Step {
  id: string;
  label: string;
  detail: string;
  status: StepStatus;
  actionLabel?: string;
  onAction?: () => void;
}

interface PreflightWizardProps {
  userId: string;
  onComplete: (topic: string, isRehearsal: boolean, jd?: string) => void;
  onCancel: () => void;
}

export const PreflightWizard: React.FC<PreflightWizardProps> = ({
  userId,
  onComplete,
  onCancel,
}) => {
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "mic",
      label: "Microphone Access",
      detail: "Checking mic permission…",
      status: "loading",
    },
    {
      id: "db",
      label: "Session Storage",
      detail: "Provisioning your session record…",
      status: "pending",
    },
    {
      id: "dropbox",
      label: "Cloud Storage (Dropbox)",
      detail: "Checking Dropbox connection…",
      status: "pending",
    },
  ]);
  const [dropboxWarningAcked, setDropboxWarningAcked] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isRehearsal, setIsRehearsal] = useState(false);
  const [jdInputMode, setJdInputMode] = useState<"custom" | "template">("custom");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customJD, setCustomJD] = useState("");
  const { samples: jdSamples, loading: jdLoading } = useJDSamples(50);

  const patchStep = (id: string, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const doChecksRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const doChecks = async () => {
      setSteps([
        {
          id: "mic",
          label: "Microphone Access",
          detail: "Checking mic permission…",
          status: "loading",
        },
        {
          id: "db",
          label: "Session Storage",
          detail: "Provisioning your session record…",
          status: "pending",
        },
        {
          id: "dropbox",
          label: "Cloud Storage (Dropbox)",
          detail: "Checking Dropbox connection…",
          status: "pending",
        },
      ]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        patchStep("mic", { status: "ok", detail: "Microphone ready." });
      } catch {
        patchStep("mic", {
          status: "error",
          detail:
            "Microphone access denied. Please allow mic access and retry.",
          actionLabel: "Retry",
          onAction: () => doChecksRef.current(),
        });
        return;
      }

      patchStep("db", {
        status: "loading",
        detail: "Provisioning session storage…",
      });
      try {
        await axios.get(`${API_BASE}/user/progress`, { headers: authHeaders() });
        patchStep("db", { status: "ok", detail: "Session storage ready." });
      } catch {
        patchStep("db", {
          status: "error",
          detail: "Could not reach session storage. Is the backend running?",
          actionLabel: "Retry",
          onAction: () => doChecksRef.current(),
        });
        return;
      }

      patchStep("dropbox", { status: "loading", detail: "Checking Dropbox…" });
      try {
        const res = await axios.get(`${API_BASE}/dropbox/status`, { headers: authHeaders() });
        if (res.data.connected) {
          patchStep("dropbox", {
            status: "ok",
            detail: `Connected as ${res.data.email || "linked account"}. Recordings will be saved to Dropbox.`,
          });
        } else {
          patchStep("dropbox", {
            status: "warn",
            detail:
              "Dropbox not connected. Recordings won't be saved to cloud storage.",
            actionLabel: "Connect Dropbox",
            onAction: async () => {
              try {
                const r = await axios.get(`${API_BASE}/dropbox/auth-url`);
                localStorage.setItem(
                  "dropbox_code_verifier",
                  r.data.code_verifier,
                );
                window.location.href = r.data.auth_url;
              } catch {
                alert("Failed to initiate Dropbox connection.");
              }
            },
          });
        }
      } catch {
        patchStep("dropbox", {
          status: "warn",
          detail: "Could not verify Dropbox status.",
        });
      }
    };

    doChecksRef.current = doChecks;
    doChecks();
  }, [userId]);

  const canProceed = useMemo(() => {
    const allDone = steps.every(
      (s) => s.status !== "loading" && s.status !== "pending",
    );
    return allDone;
  }, [steps]);

  const allDone = useMemo(() => {
    return steps.every(
      (s) => s.status !== "loading" && s.status !== "pending",
    );
  }, [steps]);

  return (
    <div 
      className="glass-panel" 
      style={{ 
        width: '100%',
        maxWidth: '500px',
        margin: '1rem',
        padding: '1.5rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Session Setup
        </h2>
        <p style={{ color: "var(--foreground-muted)", fontSize: "0.95rem" }}>
          Ensuring everything is ready for your session.
        </p>
        
        {/* JD Selection Section */}
        <div style={{ marginTop: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>Job Description</label>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className={jdInputMode === "custom" ? "primary" : "secondary"}
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => setJdInputMode("custom")}
            >
              Custom Input
            </button>
            <button
              className={jdInputMode === "template" ? "primary" : "secondary"}
              style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => setJdInputMode("template")}
            >
              Use Template
            </button>
          </div>

          {jdInputMode === "custom" ? (
            <textarea 
              value={customJD}
              onChange={(e) => setCustomJD(e.target.value)}
              placeholder="Paste the job description here (or leave empty for general interview)"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          ) : (
            <div>
              {jdLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                  <Loader2 size={18} className="animate-spin" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Loading templates…
                </div>
              ) : (
                <select 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">-- Select a template --</option>
                  {jdSamples.map((sample) => (
                    <option key={sample.id} value={sample.description}>
                      Day {sample.day_number}: {sample.role} ({sample.metadata.experience})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>Topic (Optional)</label>
          <input 
            type="text" 
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            placeholder="e.g., React, System Design, DSA"
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'white'
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isRehearsal}
              onChange={(e) => setIsRehearsal(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            Rehearsal Mode (Bypass strict pacing)
          </label>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {steps.map((step) => (
          <div
            key={step.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              padding: "1rem",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ color: step.status === 'ok' ? 'var(--accent)' : step.status === 'error' ? 'var(--danger)' : step.status === 'warn' ? 'var(--warning)' : 'var(--foreground-muted)' }}>
                  {step.id === 'mic' && <Mic size={20} />}
                  {step.id === 'db' && <Database size={20} />}
                  {step.id === 'dropbox' && <Cloud size={20} />}
                </div>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{step.label}</span>
              </div>
              <div>
                {step.status === "loading" && (
                  <Loader2 size={20} className="animate-spin" color="var(--primary)" />
                )}
                {step.status === "ok" && (
                  <CheckCircle2 size={20} color="var(--accent)" />
                )}
                {step.status === "error" && (
                  <XCircle size={20} color="var(--danger)" />
                )}
                {step.status === "warn" && (
                  <AlertTriangle size={20} color="var(--warning)" />
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: 'wrap'
              }}
            >
              <p style={{ fontSize: "0.85rem", color: "var(--foreground-muted)", flex: 1, minWidth: '150px' }}>
                {step.detail}
              </p>
              {step.onAction && (
                <button
                  className="secondary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    flexShrink: 0,
                    minHeight: '36px'
                  }}
                  onClick={step.onAction}
                >
                  {step.actionLabel}
                </button>
              )}
            </div>

            {step.id === "dropbox" &&
              step.status === "warn" &&
              !dropboxWarningAcked && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      color: "var(--warning)",
                    }}
                  >
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setDropboxWarningAcked(e.target.checked)
                      }
                      style={{ accentColor: 'var(--warning)', width: '16px', height: '16px' }}
                    />
                    I understand recordings won&apos;t be saved to cloud
                    storage
                  </label>
                </div>
              )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className="secondary"
          style={{ flex: 1, minHeight: '44px' }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          disabled={!canProceed}
          style={{ flex: 2, minHeight: '44px' }}
          onClick={() => {
            const jd = jdInputMode === "custom" ? customJD : selectedTemplate;
            onComplete(selectedTopic, isRehearsal, jd);
          }}
        >
          {!allDone ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Checking…
            </>
          ) : (
            <>
              Begin Interview <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
