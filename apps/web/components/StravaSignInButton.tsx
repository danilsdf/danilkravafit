"use client";

import Link from "next/link";

export default function StravaSignInButton() {
  return (
    <Link
      href="/api/auth/strava"
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#FC4C02] px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#e04402] active:bg-[#c93d02]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      Continue with Strava
    </Link>
  );
}
