"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, LogOut, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { userId, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass-panel" style={{ maxWidth: "500px", width: "90%", padding: "2.5rem", textAlign: "center" }}>
        <button 
          onClick={() => router.push("/")} 
          className="secondary" 
          style={{ position: "absolute", top: "2rem", left: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", 
            borderRadius: "50%", 
            margin: "0 auto 1.5rem", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(129, 140, 248, 0.4)"
          }}>
            <User size={40} color="white" />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>User Profile</h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "0.9rem", fontFamily: "var(--font-geist-mono)" }}>
            ID: {userId}
          </p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "1.5rem", textAlign: "left", marginBottom: "2rem", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <ShieldCheck size={20} color="var(--accent)" />
            <span style={{ fontWeight: 600 }}>Account Status: Verified</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--foreground-muted)", lineHeight: "1.5" }}>
            Your account is linked with Dropbox for automated interview recording and analysis.
          </p>
        </div>

        <button 
          onClick={logout} 
          className="secondary" 
          style={{ 
            width: "100%", 
            padding: "1rem", 
            borderRadius: "12px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "0.75rem", 
            fontWeight: 600,
            color: "#ef4444",
            borderColor: "rgba(239, 68, 68, 0.2)"
          }}
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
