"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, LogOut, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { userId, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-effect max-w-xl w-full p-8 md:p-12 text-center rounded-xl relative">
        <button 
          onClick={() => router.push("/")} 
          className="absolute top-6 left-6 p-2 rounded-lg bg-secondary hover:bg-secondary-hover text-foreground-muted hover:text-foreground border border-border transition-all flex items-center gap-2 text-xs font-medium"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary-glow ring-4 ring-primary/20">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2 text-foreground">User Profile</h2>
          <p className="text-foreground-muted text-sm font-mono bg-secondary/50 inline-block px-3 py-1 rounded-full border border-border">
            ID: {userId}
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-6 text-left mb-8 border border-border transition-all hover:border-border-bright">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={20} className="text-accent" />
            <span className="font-bold text-sm">Account Status: Verified</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Your account is securely linked with Dropbox for automated interview recording, transcription, and deep AI analysis.
          </p>
        </div>

        <button 
          onClick={logout} 
          className="w-full py-4 rounded-xl bg-secondary hover:bg-danger/20 text-danger-hover border border-danger/20 flex items-center justify-center gap-3 font-bold transition-all hover:scale-[1.02] active:scale-95"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </div>
  );
}
