"use client";

import Link from "next/link";
import React from "react";

export default function LandingPage() {
  return (
    <div className="relative flex-1 w-full bg-zinc-950 text-zinc-300 antialiased min-h-screen font-sans overflow-x-hidden">
      {/* Header/Nav */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="text-zinc-100 font-bold text-lg tracking-tight">
            Mockmeai<span className="text-emerald-500">.com</span>
          </div>
          <Link 
            href="/app" 
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1 group"
          >
            Launch App 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Open for the Community
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-100 tracking-tight leading-tight mb-6">
            Practice AI Mock Interviews.<br className="hidden md:block" /> 
            <span className="text-zinc-500">Built for the Community.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            An on-demand AI sandbox designed to help fellow practitioners stay sharp, confident, and market-ready. No paywalls, no aggressive tracking.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link 
              href="/app" 
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold px-8 py-4 rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/20"
            >
              Start Practice Session
            </Link>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
              Takes less than 60 seconds to get started
            </p>
          </div>
        </div>
      </section>

      {/* Creator Note Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="border-l-2 border-emerald-500/50 bg-zinc-900/50 p-8 rounded-r-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
                <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C9.12157 16 10.017 16.8954 10.017 18V21C10.017 22.1046 9.12157 23 8.017 23H5.017C3.91243 23 3.017 22.1046 3.017 21ZM14.017 13L14.017 10C14.017 8.89543 14.9124 8 16.017 8H19.017C20.1216 8 21.017 8.89543 21.017 10V13C21.017 14.1046 20.1216 15 19.017 15H16.017C14.9124 15 14.017 14.1046 14.017 13ZM3.017 13L3.017 10C3.017 8.89543 3.91243 8 5.017 8H8.017C9.12157 8 10.017 8.89543 10.017 10V13C10.017 14.1046 9.12157 15 8.017 15H5.017C3.91243 15 3.017 14.1046 3.017 13Z"/>
              </svg>
            </div>
            <p className="text-zinc-300 leading-relaxed italic text-lg relative z-10">
              {"\""}Hey, I{"'"}m a fellow developer. I built Mockmeai.com because interview preparation is stressful, and existing tools are locked behind expensive subscriptions. This is a fair sandbox for us to practice tech and behavioral rounds. It uses a habit-building credit loop to keep you consistent—not to gatekeep your growth.{"\""}
            </p>
            <p className="mt-4 text-sm text-zinc-500 font-medium">— Creator, Mockmeai.com</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">How the Sandbox Works</h2>
            <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950 transition-all hover:border-emerald-500/50 group">
              <div className="text-emerald-500 font-mono text-sm mb-4 group-hover:scale-110 transition-transform origin-left">01 // Get Started</div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">Claim Starter Pack</h3>
              <p className="text-zinc-400 leading-relaxed">
                Sign up to instantly receive 10 welcome credits to begin your journey.
              </p>
            </div>
            
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950 transition-all hover:border-emerald-500/50 group">
              <div className="text-emerald-500 font-mono text-sm mb-4 group-hover:scale-110 transition-transform origin-left">02 // Practice</div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">Run Mock Interviews</h3>
              <p className="text-zinc-400 leading-relaxed">
                Spend 2 credits to start any live AI simulation. Complete it to get 3 credits back.
              </p>
            </div>
            
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950 transition-all hover:border-emerald-500/50 group">
              <div className="text-emerald-500 font-mono text-sm mb-4 group-hover:scale-110 transition-transform origin-left">03 // Consistency</div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">Maintain Momentum</h3>
              <p className="text-zinc-400 leading-relaxed">
                Build consistency streaks. If you stop practicing for over 5 days, your balance undergoes minor skill-decay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Economy Table */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100 mb-4">The Credit Economy</h2>
            <p className="text-zinc-400">A simple logic to reward habit over payment.</p>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20 shadow-2xl shadow-black/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-100">Event</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-100">Impact</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-100">Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">Welcome Bonus</td>
                  <td className="px-6 py-4 text-sm font-mono text-emerald-400">+10 Credits</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">Instant playground access</td>
                </tr>
                <tr className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">Daily Habit Visit</td>
                  <td className="px-6 py-4 text-sm font-mono text-emerald-400">+1 Credit</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">Rewards daily consistency</td>
                </tr>
                <tr className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">Finish an Interview</td>
                  <td className="px-6 py-4 text-sm font-mono text-emerald-400">Net +1 Credit</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">Costs 2 to start, returns 3 on completion</td>
                </tr>
                <tr className="hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300">Inactivity (5+ Days)</td>
                  <td className="px-6 py-4 text-sm font-mono text-red-400">-1 Credit / day</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">Simulates skills getting {"\""}rusty{"\""}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 text-sm">
          <div className="text-zinc-400">
            &copy; 2026 Mockmeai.com. Built for developers.
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-zinc-300 transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Feedback</Link>
            <Link href="#" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
