"use client";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/utils/apiConfig";

export const LoginScreen = () => {
  const { setUserId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const loginWithDropbox = async () => {
    setIsLoading(true);
    try {
      // Get auth URL without passing hardcoded user_id
      const res = await axios.get(`${API_BASE}/dropbox/auth-url`);
      localStorage.setItem("dropbox_code_verifier", res.data.code_verifier);
      window.location.href = res.data.auth_url;
    } catch (err) {
      console.error("Login failed", err);
      setIsLoading(false);
      alert("Failed to initiate login.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
      <div style={{ textAlign: 'center', padding: '2rem', background: '#1e293b', borderRadius: '16px' }}>
        <h1>MockMe.AI</h1>
        <p>Please log in to continue.</p>
        <button onClick={loginWithDropbox} disabled={isLoading} style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
          {isLoading ? "Redirecting..." : "Login with Dropbox"}
        </button>
      </div>
    </div>
  );
};
