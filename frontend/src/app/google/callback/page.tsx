"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { API_BASE } from "@/utils/apiConfig";

export default function GoogleCallbackPage() {
  const { setAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const codeVerifier = localStorage.getItem("google_code_verifier");

      if (!code || !state || !codeVerifier) {
        console.error("Missing code, state, or code_verifier in callback");
        router.push("/");
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/google/callback`, { 
          params: { code, state, code_verifier: codeVerifier }
        });
        
        // Update frontend auth state with the user ID returned from backend
        if (res.data.access_token) {
          setAuth(res.data.user_id, res.data.access_token);
        } else {
          console.error("No access token in callback response");
          router.push("/");
          return;
        }
        
        localStorage.removeItem("google_code_verifier");
        router.push("/app");
      } catch (err) {
        console.error("Google Auth Callback Error", err);
        router.push("/");
      }
    };

    handleCallback();
  }, [setAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <div className="animate-spin mb-4 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
        <p className="text-lg font-medium">Finalizing Google Drive connection...</p>
      </div>
    </div>
  );
}
