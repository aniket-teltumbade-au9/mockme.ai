"use client";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/utils/apiConfig";
import { LogIn, Loader2, Sparkles, ShieldCheck } from "lucide-react";

export const LoginScreen = () => {
  const { setUserId } = useAuth();
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
    <div className="container layout-conversational" style={{ background: 'var(--background)', minHeight: '100vh', width: '100%' }}>
      <div 
        className="glass-panel text-center" 
        style={{ 
          maxWidth: '480px', 
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '2.5rem',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 80px -10px var(--primary-glow)',
          margin: '0 auto',
        }}
      >
        <div style={{ 
          width: '72px', 
          height: '72px', 
          background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem',
          boxShadow: '0 10px 20px -5px var(--primary-glow)'
        }}>
          <Sparkles size={36} color="white" />
        </div>

        <div>
            <h1 style={{ 
              fontSize: '2rem', 
              marginBottom: '0.75rem',
              background: 'linear-gradient(to right, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              lineHeight: 1.2
            }}>
                MockMe.AI
            </h1>
            <p style={{ 
              color: 'var(--foreground-muted)', 
              fontSize: '0.95rem', 
              maxWidth: '300px', 
              margin: '0 auto',
              lineHeight: 1.5
            }}>
                Master your next technical interview with AI-powered simulations.
            </p>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />

        <button 
          onClick={loginWithDropbox} 
          disabled={isLoading} 
          style={{ 
            width: '100%',
            height: '56px',
            fontSize: '1rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 20px -5px var(--primary-glow)',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <LogIn size={20} />
              <span style={{ marginLeft: '0.5rem' }}>Continue with Dropbox</span>
            </>
          )}
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground-muted)', fontSize: '0.8rem' }}>
            <ShieldCheck size={14} color="var(--accent)" />
            <span>Secure authentication via Dropbox OAuth</span>
        </div>
      </div>
    </div>
  );
};
