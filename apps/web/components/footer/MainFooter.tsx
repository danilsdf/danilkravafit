export default function MainFooter() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-5 py-10 text-white md:px-10 lg:px-24">
      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
            Hybrid Athlete Hub · Built for strength &amp; endurance.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/privacy-policy"
              className="text-[10px] font-medium uppercase tracking-widest text-white/30 transition hover:text-white/60"
            >
              Privacy Policy
            </a>
            <span className="text-white/20">·</span>
            <a
              href="/terms-of-service"
              className="text-[10px] font-medium uppercase tracking-widest text-white/30 transition hover:text-white/60"
            >
              Terms of Service
            </a>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="https://buymeacoffee.com/danilkravafit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40 transition hover:text-[#FFDD00]"
          >
            <span className="text-sm leading-none">☕</span>
            <span>Support</span>
          </a>

          <div className="h-4 w-px bg-white/15" />

          <a href="https://instagram.com/danilkravafit" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <img src="/social/instagram.png" alt="Instagram" className="h-5 w-5 opacity-40 transition hover:opacity-100" />
          </a>
          <a href="https://www.strava.com/athletes/66921238" target="_blank" rel="noopener noreferrer" aria-label="Strava">
            <img src="/social/strava.png" alt="Strava" className="h-5 w-5 opacity-40 transition hover:opacity-100" />
          </a>
          <a href="https://tiktok.com/@danilkravafit" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <img src="/social/tiktok.png" alt="TikTok" className="h-5 w-5 opacity-40 transition hover:opacity-100" />
          </a>
          <a href="https://www.linkedin.com/in/kravchenkodanil/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <img src="/social/linkedin.png" alt="LinkedIn" className="h-5 w-5 opacity-40 transition hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}

