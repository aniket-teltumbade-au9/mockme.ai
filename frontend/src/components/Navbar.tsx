"use client";
import React from "react";
import { LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Navbar: React.FC = () => {
  const { userId, logout } = useAuth();

  if (!userId) return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6"
      style={{
        background: "var(--glass)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Sparkles size={18} color="white" />
        </div>
        <span className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          MockMe.AI
        </span>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
        style={{
          color: "var(--foreground-muted)",
          background: "transparent",
          border: "1px solid var(--border)",
          transition: "var(--transition-smooth)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--secondary)";
          e.currentTarget.style.borderColor = "var(--border-bright)";
          e.currentTarget.style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.color = "var(--foreground-muted)";
        }}
      >
        <LogOut size={16} />
        Logout
      </button>
    </nav>
  );
};
