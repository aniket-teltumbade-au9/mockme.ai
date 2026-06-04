"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

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
  onComplete: () => void;
  onCancel: () => void;
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "loading")
    return (
      <Loader2
        size={20}
        className="animate-spin"
        style={{ color: "#818cf8" }}
      />
    );
  if (status === "ok")
    return <CheckCircle2 size={20} style={{ color: "#10b981" }} />;
  if (status === "warn")
    return <AlertTriangle size={20} style={{ color: "#f59e0b" }} />;
  if (status === "error")
    return <XCircle size={20} style={{ color: "#ef4444" }} />;
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "2px solid #334155",
      }}
    />
  );
}

export const PreflightWizard: React.FC<PreflightWizardProps> = ({
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
      id: "system_audio",
      label: "Interviewer Audio Capture",
      detail: "Checking system audio…",
      status: "pending",
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
  const [systemAudioWarningAcked, setSystemAudioWarningAcked] = useState(false);
  const [dropboxWarningAcked, setDropboxWarningAcked] = useState(false);

  // Stable helper — writes into setSteps, no external deps needed
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
          id: "system_audio",
          label: "Interviewer Audio Capture",
          detail: "Checking system audio…",
          status: "pending",
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

      // --- Step 2: System audio (non-blocking) ---
      patchStep("system_audio", {
        status: "loading",
        detail: "Requesting screen/system audio capture…",
      });
      try {
        const gdm = (
          navigator.mediaDevices as unknown as {
            getDisplayMedia?: (c: {
              audio: boolean;
              video: boolean;
            }) => Promise<MediaStream>;
          }
        ).getDisplayMedia;
        if (!gdm) throw new Error("not supported");
        const sysStream = await gdm.call(navigator.mediaDevices, {
          audio: true,
          video: false,
        });
        if (sysStream.getAudioTracks().length > 0) {
          sysStream.getTracks().forEach((t) => t.stop());
          patchStep("system_audio", {
            status: "ok",
            detail:
              "System audio capture available. Interviewer voice will be recorded.",
          });
        } else {
          sysStream.getTracks().forEach((t) => t.stop());
          throw new Error("no audio tracks");
        }
      } catch {
        patchStep("system_audio", {
          status: "warn",
          detail:
            "System audio unavailable — the interviewer's voice won't be included in the recording. You can still proceed, but the recording will only capture your responses.",
        });
      }

      // --- Step 3: DB (blocking) ---
      patchStep("db", {
        status: "loading",
        detail: "Provisioning session storage…",
      });
      try {
        await axios.get(`${API_BASE}/user/progress`);
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
        const res = await axios.get(`${API_BASE}/dropbox/status`);
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
          detail:
            "Could not check Dropbox status. Recordings may not be saved to cloud.",
        });
      }
    };

    doChecksRef.current = doChecks;
    doChecks();
  }, []); // intentionally runs once on mount

  const canProceed = useMemo(() => {
    const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
    const allDone = steps.every(
      (s) => s.status !== "loading" && s.status !== "pending",
    );
    if (!allDone) return false;
    if (byId.mic?.status === "error" || byId.db?.status === "error")
      return false;
    if (byId.system_audio?.status === "warn" && !systemAudioWarningAcked)
      return false;
    if (byId.dropbox?.status === "warn" && !dropboxWarningAcked) return false;
    return true;
  }, [steps, systemAudioWarningAcked, dropboxWarningAcked]);

  const allDone = steps.every(
    (s) => s.status !== "loading" && s.status !== "pending",
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        className="glass-panel"
        style={{ width: "100%", maxWidth: "520px", padding: "2rem" }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}
        >
          Pre-Interview Checklist
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.85rem",
            marginBottom: "1.75rem",
          }}
        >
          Verifying everything is ready before your session starts.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <StatusIcon status={step.status} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      marginTop: "2px",
                      color:
                        step.status === "error"
                          ? "#f87171"
                          : step.status === "warn"
                            ? "#fbbf24"
                            : "#64748b",
                    }}
                  >
                    {step.detail}
                  </div>
                </div>
                {step.actionLabel && step.onAction && (
                  <button
                    onClick={step.onAction}
                    className="secondary"
                    style={{
                      fontSize: "0.75rem",
                      padding: "4px 10px",
                      flexShrink: 0,
                    }}
                  >
                    {step.actionLabel}
                  </button>
                )}
              </div>

              {step.id === "system_audio" &&
                step.status === "warn" &&
                !systemAudioWarningAcked && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                    >
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSystemAudioWarningAcked(e.target.checked)
                        }
                      />
                      I understand the recording will only capture my voice
                    </label>
                  </div>
                )}
              {step.id === "dropbox" &&
                step.status === "warn" &&
                !dropboxWarningAcked && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                    >
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setDropboxWarningAcked(e.target.checked)
                        }
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
          <button className="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            onClick={onComplete}
            disabled={!canProceed}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {!allDone ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Checking…
              </>
            ) : (
              <>
                <ChevronRight size={16} /> Begin Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
