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
  Settings2
} from "lucide-react";
import axios from "axios";

import { API_BASE, authHeaders } from "@/utils/apiConfig";

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
  onComplete: () => void;
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

  // Helper to update state — wrap in ref to avoid effect deps needed
  const patchStep = (id: string, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Ref so the async check sequence can call itself for retry without stale closures
  const doChecksRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const doChecks = async () => {
      // Reset all to pending / first step loading
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

      // --- Step 1: Mic (blocking) ---
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

      // --- Step 2: DB (blocking) ---
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

      // --- Step 4: Dropbox (non-blocking) ---
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
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
    const allDone = steps.every(
      (s) => s.status !== "loading" && s.status !== "pending",
    );
    if (!allDone) return false;
    if (byId.mic?.status === "error" || byId.db?.status === "error")
      return false;
    if (byId.dropbox?.status === "warn" && !dropboxWarningAcked) return false;
    return true;
  }, [steps, dropboxWarningAcked]);

  const allDone = steps.every(
    (s) => s.status !== "loading" && s.status !== "pending",
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "95%",
          maxWidth: "540px",
          padding: "3rem",
          display: "flex",
          flexDirection: "column",
          gap: "2.5rem",
          boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ textAlign: "center" }}>
            <div style={{ 
                width: '56px', 
                height: '56px', 
                background: 'var(--secondary)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1.5rem',
                border: '1px solid var(--border)'
            }}>
                <Settings2 size={28} color="var(--primary)" />
            </div>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>System Check</h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.95rem" }}>
            Ensuring everything is ready for your session.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1.25rem",
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
                }}
              >
                <p style={{ fontSize: "0.85rem", color: "var(--foreground-muted)", flex: 1 }}>
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
                        style={{ accentColor: 'var(--warning)' }}
                      />
                      I understand recordings won&apos;t be saved to cloud
                      storage
                    </label>
                  </div>
                )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            className="secondary"
            style={{ flex: 1, height: "52px" }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            disabled={!canProceed}
            style={{ flex: 2, height: "52px" }}
            onClick={onComplete}
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
    </div>
  );
};
