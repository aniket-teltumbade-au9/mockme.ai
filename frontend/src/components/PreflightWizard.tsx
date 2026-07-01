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
  onComplete: (topic: string, isRehearsal: boolean) => void;
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

      patchStep("dropbox", { status: "loading", detail: "Checking cloud storage…" });
      try {
        // Check Dropbox first
        const dropboxRes = await axios.get(`${API_BASE}/dropbox/status`, { headers: authHeaders() });
        if (dropboxRes.data.connected) {
          patchStep("dropbox", {
            status: "ok",
            detail: `Connected as ${dropboxRes.data.email || "linked account"}. Recordings will be saved to Dropbox.`,
            label: "Cloud Storage (Dropbox)",
          });
        } else {
          // Check Google Drive as fallback
          try {
            const googleRes = await axios.get(`${API_BASE}/google/status`, { headers: authHeaders() });
            if (googleRes.data.connected) {
              patchStep("dropbox", {
                id: "google",
                status: "ok",
                detail: `Connected to Google Drive as ${googleRes.data.email || "linked account"}. Recordings will be saved to Google Drive.`,
                label: "Cloud Storage (Google Drive)",
              });
            } else {
              patchStep("dropbox", {
                status: "warn",
                detail:
                  "No cloud storage connected. Recordings won't be saved to cloud.",
                actionLabel: "Connect Cloud Storage",
                onAction: async () => {
                  try {
                    // Try Dropbox first
                    const r = await axios.get(`${API_BASE}/dropbox/auth-url`);
                    localStorage.setItem(
                      "dropbox_code_verifier",
                      r.data.code_verifier,
                    );
                    window.location.href = r.data.auth_url;
                  } catch {
                    alert("Failed to initiate cloud storage connection.");
                  }
                },
              });
            }
          } catch {
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
        }
      } catch {
        patchStep("dropbox", {
          status: "warn",
          detail: "Could not verify cloud storage status.",
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="glass-effect w-full max-w-[500px] p-6 space-y-8 max-h-[90vh] overflow-y-auto rounded-xl">
        <div>
          <h2 className="text-2xl font-black mb-2">Session Setup</h2>
          <p className="text-foreground-muted text-base">
            Ensuring everything is ready for your session.
          </p>
        
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground-muted mb-2">Topic (Optional)</label>
            <input 
              type="text" 
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="e.g., React, System Design, DSA"
              className="w-full p-3 rounded-xl bg-white/5 border border-border text-white placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium cursor-pointer group">
            <input 
              type="checkbox" 
              checked={isRehearsal}
              onChange={(e) => setIsRehearsal(e.target.checked)}
              className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary accent-primary"
            />
            <span className="group-hover:text-foreground transition-colors">Rehearsal Mode (Bypass strict pacing)</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col gap-3 p-4 bg-white/5 rounded-xl border border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={
                  step.status === 'ok' ? 'text-emerald-400' : 
                  step.status === 'error' ? 'text-red-400' : 
                  step.status === 'warn' ? 'text-amber-400' : 'text-foreground-muted'
                }>
                  {step.id === 'mic' && <Mic size={22} />}
                  {step.id === 'db' && <Database size={22} />}
                  {step.id === 'dropbox' && <Cloud size={22} />}
                </div>
                <span className="font-bold text-base">{step.label}</span>
              </div>
              <div>
                {step.status === "loading" && (
                  <Loader2 size={22} className="animate-spin text-primary" />
                )}
                {step.status === "ok" && (
                  <CheckCircle2 size={22} className="text-emerald-400" />
                )}
                {step.status === "error" && (
                  <XCircle size={22} className="text-red-400" />
                )}
                {step.status === "warn" && (
                  <AlertTriangle size={22} className="text-amber-400" />
                )}
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-sm text-foreground-muted flex-1 min-w-[150px]">
                {step.detail}
              </p>
              {step.onAction && (
                <button
                  className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-foreground text-xs font-bold rounded-lg transition-colors min-h-[36px]"
                  onClick={step.onAction}
                >
                  {step.actionLabel}
                </button>
              )}
            </div>

            {step.id === "dropbox" &&
              step.status === "warn" &&
              !dropboxWarningAcked && (
                <div className="mt-2 pt-3 border-t border-border">
                  <label
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer text-amber-400"
                  >
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setDropboxWarningAcked(e.target.checked)
                      }
                      className="w-4 h-4 accent-amber-400"
                    />
                    I understand recordings won&apos;t be saved to cloud
                    storage
                  </label>
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <button
          className="flex-1 py-4 bg-secondary hover:bg-secondary-hover text-foreground rounded-xl font-bold transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          disabled={!canProceed}
          className="flex-[2] py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary-glow"
          onClick={() => onComplete(selectedTopic, isRehearsal)}
        >
          {!allDone ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Checking…
            </>
          ) : (
            <>
              Begin Interview <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
      </div>
    </div>
  );
};
