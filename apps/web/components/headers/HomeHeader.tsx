"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

export default function HomeHeader({showTraining = false}: Readonly<{showTraining?: boolean}>) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-black/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 md:px-14 lg:px-18 h-20">
        {/* LOGO */}
        <Link
          href="/"
          className="text-md font-extrabold tracking-widest uppercase w-[230px]"
        >
          DK
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-10 text-sm uppercase tracking-wide mx-1">
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/recipes", label: "Recipes" },
            { href: "/tools", label: "Tools" },
            // { href: "/membership", label: "Membership" },
          ].map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap transition ${
                  active
                    ? "font-extrabold text-white"
                    : "font-medium text-white/60 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          {showTraining ? (
            <Link
              href="/training"
              className="border border-white px-5 py-2 text-xs font-extrabold uppercase tracking-widest transition hover:bg-white hover:text-black whitespace-nowrap bg-[#00000073]"
            >
              Training Program
            </Link>
          ) : <div className="px-5 py-2 w-[185px]" />}
          <UserAvatar />
        </div>

        <div className="md:hidden flex items-center gap-4">
          {/* MOBILE BUTTON */}
          <button
            className="md:hidden flex flex-col gap-1"
            onClick={() => setOpen(!open)}
          >
            <span className="w-6 h-[2px] bg-white" />
            <span className="w-6 h-[2px] bg-white" />
            <span className="w-6 h-[2px] bg-white" />
          </button>
          <UserAvatar />
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden flex flex-col bg-black border-t border-white/10 px-6 py-6 space-y-6 text-sm uppercase tracking-wide">
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About" },
            { href: "/recipes", label: "Recipes" },
            { href: "/tools", label: "Tools" },
            // { href: "/membership", label: "Membership" },
            { href: "/training-programs", label: "Training programs" },
          ].map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block ${
                  active
                    ? "font-extrabold text-white"
                    : "font-medium text-white/60"
                }`}
              >
                {label}
              </Link>
            );
          })}

          {showTraining && (<Link
            href="/training"
            onClick={() => setOpen(false)}
            className="block border border-white px-5 py-3 text-center font-extrabold whitespace-nowrap"
          >
            Training Program
          </Link>)}
        </div>
      )}
    </header>
  );
}