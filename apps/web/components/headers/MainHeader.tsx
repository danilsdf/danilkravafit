"use client";
import Link from "next/link";

import { useState } from "react";
import UserAvatar from "@/components/UserAvatar";

export default function MainHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 text-xs bg-white/80 dark:bg-[#0f1418]/80 backdrop-blur border-b border-black/10 dark:border-white/10 px-2 md:px-0 py-4 transition-colors">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
            <span className="font-semibold tracking-[0.2em] text-black/90 dark:text-white/90">DK</span>
            <span className="hidden rounded-full bg-black/5 dark:bg:white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-black/50 dark:text-white/50 sm:inline">Hybrid Hub</span>
          </Link>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-[14px]">
          {/* <Link href="/programs" className="hover:text-blue-600 dark:hover:text-blue-400 text-black dark:text-white">Programs</Link> */}
          <Link href="/recipes" className="hover:text-blue-600 dark:hover:text-blue-400 text-black dark:text-white">Recipes</Link>
          <Link href="/tools" className="hover:text-blue-600 dark:hover:text-blue-400 text-black dark:text-white">Tools</Link>
          <Link href="/about-me" className="hover:text-blue-600 dark:hover:text-blue-400 text-black dark:text-white">About me</Link>
          {/* <Link href="/book-appointment" className="bg-[#e5ae51] hover:bg-[#c4943f] text-black font-semibold px-3 py-1 rounded transition-colors">Book an appointment</Link> */}
          <UserAvatar />
        </nav>
        {/* Mobile nav: only Book and menu icon */}
        <div className="flex md:hidden items-center gap-2">
          <UserAvatar />
          {/* <Link href="/book-appointment" className="bg-[#e5ae51] hover:bg-[#c4943f] text-black font-semibold px-3 py-1 rounded transition-colors">Book an appointment</Link> */}
          <button
            aria-label="Open menu"
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#e5ae51]"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile menu dropdown */}
      {menuOpen && (
        <nav className="md:hidden bg-white dark:bg-[#0f1418] border-t border-black/10 dark:border-white/10 px-4 py-4 flex flex-col gap-4 text-base font-semibold animate-in fade-in slide-in-from-top-2">
          {/* <Link href="/programs" className="hover:text-[#e5ae51] text-black dark:text-white" onClick={() => setMenuOpen(false)}>Programs</Link> */}
          <Link href="/recipes" className="hover:text-[#e5ae51] text-black dark:text-white" onClick={() => setMenuOpen(false)}>Recipes</Link>
          <Link href="/tools" className="hover:text-[#e5ae51] text-black dark:text-white" onClick={() => setMenuOpen(false)}>Tools</Link>
          {/* <Link href="/recipes" className="hover:text-[#e5ae51] text-black dark:text-white" onClick={() => setMenuOpen(false)}>Recipes</Link> */}
          <Link href="/about-me" className="hover:text-[#e5ae51] text-black dark:text-white" onClick={() => setMenuOpen(false)}>About me</Link>
          <Link href="/training-logs" className="hover:text-[#e5ae51] text-black dark:text-white" onClick={() => setMenuOpen(false)}>Training Logs</Link>
        </nav>
      )}
    </header>
  );
}
