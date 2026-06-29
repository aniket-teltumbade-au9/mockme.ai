"use client";
import React, { useState, useEffect } from "react";
import { Coins, Flame, TrendingUp } from "lucide-react";
import axios from "axios";
import { API_BASE, getDropboxAccessToken } from "@/utils/apiConfig";
import { useAuth } from "@/context/AuthContext";

export const CreditStatus: React.FC = () => {
  const { isInitialized, accessToken } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchStatus = async () => {
    try {
      const token = getDropboxAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`${API_BASE}/credits/status`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch credit status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;
    fetchStatus();
  }, [isInitialized, accessToken]);

  const claimDaily = async () => {
    setClaiming(true);
    try {
      const token = getDropboxAccessToken();
      if (!token) {
        console.error("No auth token available");
        return;
      }
      
      const res = await axios.post(`${API_BASE}/credits/claim-daily`, {}, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data);
      // Add a toast notification here if available
    } catch (err) {
      console.error("Daily claim failed", err);
    } finally {
      setClaiming(false);
    }
  };

  if (!isInitialized || loading) return <div className="h-10 w-32 animate-pulse bg-white/10 rounded-full" />;

  return (
    <div className="flex items-center gap-3">
      {/* Balance Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-white text-xs font-bold shadow-inner">
        <Coins size={14} className="text-yellow-400" />
        <span>{status?.balance ?? 0} Credits</span>
      </div>

      {/* Streak Badge */}
      {status?.streak > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
          <Flame size={14} />
          <span>{status?.streak} Day Streak</span>
        </div>
      )}

      {/* Claim Button */}
      <button
        onClick={claimDaily}
        disabled={claiming}
        className="text-[10px] uppercase tracking-wider font-black text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/10"
      >
        {claiming ? "..." : "Claim Daily"}
      </button>
    </div>
  );
};
