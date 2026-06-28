"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, LayoutDashboard, Sparkles } from "lucide-react";
import Link from "next/link";

export const Navbar: React.FC = () => {
  const { userId, logout } = useAuth();
  const router = useRouter();

  if (!userId) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10 px-4 py-2 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-black text-xl tracking-tight">
          <Sparkles className="text-primary" size={24} />
          <span>MockMe.AI</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4 md:gap-8">
          <Link 
            href="/" 
            className="text-sm font-medium text-foreground-muted hover:text-white transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link 
            href="/profile" 
            className="text-sm font-medium text-foreground-muted hover:text-white transition-colors flex items-center gap-1.5"
          >
            <User size={16} />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          <div className="h-6 w-[1px] bg-white/10 mx-2 hidden sm:block" />

          {/* User/Logout */}
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-500 transition-colors bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
