"use client";
import { useState } from "react";
import axios from "axios";
import { API_BASE } from "@/utils/apiConfig";
import { LogIn, Loader2, Sparkles, ShieldCheck } from "lucide-react";

export const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loginWithDropbox = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/dropbox/auth-url`);
      localStorage.setItem("dropbox_code_verifier", res.data.code_verifier);
      window.location.href = res.data.auth_url;
    } catch (err) {
      console.error("Login failed", err);
      setIsLoading(false);
      alert("Failed to initiate login. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div 
        className="glass-effect text-center flex flex-col items-center gap-6 p-10 max-w-[480px] w-full rounded-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8),0_0_80px_-10px_var(--color-primary-glow)]"
      >
        <div className="w-[72px] h-[72px] bg-gradient-to-br from-primary to-purple-500 rounded-[20px] flex items-center justify-center mb-2 shadow-[0_10px_20px_-5px_var(--color-primary-glow)]">
          <Sparkles size={36} className="text-white" />
        </div>

        <div>
            <h1 className="text-[2rem] mb-[0.75rem] bg-gradient-to-r from-white to-foreground-muted bg-clip-text text-transparent font-black leading-[1.2]">
                MockMe.AI
            </h1>
            <p className="text-foreground-muted text-[0.95rem] max-w-[300px] mx-auto leading-[1.5]">
                Master your next technical interview with AI-powered simulations.
            </p>
        </div>

        <div className="w-full h-[1px] bg-border my-2" />

        <button 
          onClick={loginWithDropbox} 
          disabled={isLoading} 
          className="w-full h-[56px] text-[1rem] rounded-lg shadow-[0_10px_20px_-5px_var(--color-primary-glow)] flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <LogIn size={20} />
              <span className="ml-2">Continue with Dropbox</span>
            </>
          )}
        </button>
        
        <div className="flex items-center gap-2 text-foreground-muted text-[0.8rem]">
            <ShieldCheck size={14} className="text-accent" />
            <span>Secure authentication via Dropbox OAuth</span>
        </div>
      </div>
    </div>
  );
};
