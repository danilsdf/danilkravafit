import MainFooter from "@/components/footer/MainFooter";
import HomeHeader from "@/components/headers/HomeHeader";
import Image from "next/image";

const records = [
  { title: "5K", time: "18:41", pace: "3:50 /km", date: "Apr 2026" },
  { title: "10K", time: "39:09", pace: "3:50 /km", date: "Apr 2026" },
  { title: "Half Marathon", time: "1:33:07", pace: "4:25 /km", date: "Nov 2025" },
  { title: "Marathon", time: "3:22:46", pace: "4:46 /km", date: "May 2026" },
];

const pillars = [
  {
    icon: "/icons/dumbbell.png",
    title: "Strength Training",
    text: "Building a strong, resilient foundation.",
  },
  {
    icon: "/icons/running.png",
    title: "Running",
    text: "Improving efficiency, endurance and speed.",
  },
  {
    icon: "/icons/calendar.png",
    title: "Consistency",
    text: "Discipline today, results tomorrow.",
  },
];

export default function HomePage() {
  return (
    <>
      <HomeHeader showTraining={true} />
      <main className="min-h-screen bg-neutral-950 text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="relative min-h-[720px] md:min-h-[760px] lg:min-h-[820px] wide:min-h-0 wide:h-[820px] wide:max-h-[820px] max-w-[1450px] mx-auto">
            <Image
              src="/home-page/home-background.png"
              alt="Danil Krava fitness homepage hero"
              fill
              priority
              className="object-cover object-[68%_center] md:object-[72%_center] lg:object-center wide:object-contain wide:object-right"
            />

            <div className="relative z-10 flex min-h-[720px] items-end px-5 pb-10 pt-28 md:min-h-[760px] md:items-center md:px-10 md:pb-0 lg:min-h-[820px] lg:px-24 wide:min-h-0 wide:h-[820px]">
              <div className="max-w-xl">
                <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70 md:text-xs">
                  Hybrid Athlete. Discipline. Systems.
                </p>

                <h1 className="mb-5 text-4xl font-black leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                  Building the best version of myself
                </h1>

                <p className="mb-7 max-w-md text-sm leading-relaxed text-white/75 md:text-base lg:text-lg">
                  Balancing the demands of a 9–5 with hybrid training. Run faster, get stronger, and stay consistent — all while navigating the challenges of a busy schedule.
                </p>

                <div className="mb-8 grid grid-cols-2 border-y border-white/15 py-5">
                  <div className="pr-5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                      Current Goal
                    </p>
                    <p className="text-base font-bold md:text-lg">
                      Marathon Prep
                    </p>
                  </div>

                  <div className="border-l border-white/20 pl-5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">
                      Next Event
                    </p>
                    <p className="text-base font-bold md:text-lg">
                      Toronto Marathon
                    </p>
                    <p className="mt-1 text-xs text-white/55">May 3, 2026</p>
                  </div>
                </div>

                <a
                  href="/training"
                  className="inline-flex w-full items-center justify-center gap-3 bg-white px-6 py-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-white/85 sm:w-auto"
                >
                  View Training Program
                  <span className="text-lg leading-none">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PERSONAL RECORDS */}
        <section className="px-5 py-14 md:px-10 md:py-20 lg:px-24">
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
              Personal Records
            </p>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Proof of Progress
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {records.map((record) => (
              <article
                key={record.title}
                className="border border-white/10 bg-white/[0.03] px-4 py-6 text-center backdrop-blur transition hover:border-white/25 hover:bg-white/[0.06] md:px-6 md:py-8"
              >
                <div className="mb-4 text-xl text-white/45">🏃</div>

                <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-white/75 md:text-xs">
                  {record.title}
                </p>

                <p className="mb-5 text-3xl font-black tracking-tight md:text-5xl">
                  {record.time}
                </p>

                <div className="mx-auto mb-4 h-px w-20 bg-white/20 md:w-28" />

                <p className="text-[10px] font-bold uppercase tracking-wide text-white/65 md:text-xs">
                  Pace {record.pace}
                </p>

                <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">
                  {record.date}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href="https://www.strava.com/athletes/66921238"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/20 px-6 py-4 text-xs font-black uppercase tracking-wide text-white transition hover:border-white/50 hover:bg-white/[0.06]"
            >
              See on Strava
              <span className="text-lg leading-none">→</span>
            </a>
          </div>
        </section>

        {/* Instagram/Proof Section */}
        <section className="border-t border-white/10 px-5 py-14 md:px-10 md:py-20 lg:px-24" id="transformations">
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-white/45">
              Instagram
            </p>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Real Progress in Real Time
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5 mb-10">
            {[
              { href: "https://www.instagram.com/danilkravafit/reel/DT-3n1RifCo/", src: "/home-page/results/routines.jpg", alt: "Routines", label: "Routines" },
              { href: "https://www.instagram.com/danilkravafit/reel/DUG3iIbCXzv/", src: "/home-page/results/tips.jpg", alt: "Tips", label: "Tips" },
              { href: "https://www.instagram.com/danilkravafit/reel/DSa9uYSifqg/", src: "/home-page/results/nutritions.jpg", alt: "Nutritions", label: "Nutritions" },
              { href: "https://www.instagram.com/danilkravafit/reel/DVoV-iuxZrn/", src: "/home-page/results/progress.png", alt: "Progress", label: "Progress" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square group block border border-white/10 overflow-hidden transition hover:border-white/25"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition group-hover:opacity-80"
                />
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                  {item.label}
                </span>
              </a>
            ))}
          </div>

          <div className="flex justify-center">
            <a
              href="https://instagram.com/danilkravafit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/20 px-6 py-4 text-xs font-black uppercase tracking-wide text-white transition hover:border-white/50 hover:bg-white/[0.06]"
            >
              Follow on Instagram
              <span className="text-lg leading-none">→</span>
            </a>
          </div>
        </section>

        {/* PILLARS */}
        <section className="border-t border-white/10 px-5 py-10 md:px-10 lg:px-24">
          <div className="grid gap-7 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="flex items-center gap-5">
                <div className="w-12 h-12 md:w-20 md:h-20 opacity-60 flex-shrink-0">
                  <img src={pillar.icon} alt={pillar.title} className="w-full h-full object-contain" />
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-black uppercase tracking-widest">
                    {pillar.title}
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-white/55">
                    {pillar.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <MainFooter />
    </>
  );
}