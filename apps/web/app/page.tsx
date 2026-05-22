import Image from "next/image";
import Link from "next/link";
import MainFooter from "@/components/footer/MainFooter";
import HomeHeader from "@/components/headers/HomeHeader";
import HeroDivider from "@/components/HeroDivider";

const records = [
  { title: "5K", time: "18:41", pace: "3:50 /km", date: "Apr 2026" },
  { title: "10K", time: "39:09", pace: "3:50 /km", date: "Apr 2026" },
  { title: "Half Marathon", time: "1:33:07", pace: "4:25 /km", date: "Nov 2025" },
  { title: "Marathon", time: "3:22:46", pace: "4:46 /km", date: "May 2026" },
];

const instagram = [
  { src: "/home/routine.jpg", label: "Routines" },
  { src: "/home/training-tips.jpg", label: "Training Tips" },
  { src: "/home/meal-prep-post.jpg", label: "Meal Prep" },
  { src: "/home/progress.jpg", label: "Progress" },
  { src: "/home/running.jpg", label: "Running" },
  { src: "/home/run-stats.jpg", label: "Run Stats" },
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
        <main className="min-h-screen bg-black text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="flex flex-col lg:relative lg:min-h-screen">
            {/* TRAINING */}
            <div className="hero-training relative min-h-[520px] overflow-hidden lg:absolute lg:inset-0">
              <Image
                src="/home/gym-training.png"
                alt="Training background"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/35" />

              <div className="relative z-10 flex h-full min-h-[520px] flex-col justify-center px-6 py-24 md:px-12 lg:px-20">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#d6a936]">
                  Hybrid Athlete Training
                </p>

                <h1 className="max-w-lg text-5xl font-black uppercase leading-[0.9] md:text-7xl">
                  Train With Structure
                </h1>

                <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
                  Running plans, strength sessions, race prep and hybrid athlete
                  systems built around real life.
                </p>

                <div className="mt-8 grid max-w-md grid-cols-2 border-y border-white/15 py-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#d6a936]">
                      Current Goal
                    </p>
                    <p className="mt-1 font-bold">Spartan Beast Prep</p>
                  </div>

                  <div className="border-l border-white/20 pl-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#d6a936]">
                      Next Event
                    </p>
                    <p className="mt-1 font-bold">Spartan Beast</p>
                    <p className="text-xs text-white/55">June 13, 2026</p>
                  </div>
                </div>

                <Link
                  href="/training"
                  className="mt-8 inline-flex w-fit items-center gap-3 bg-white px-6 py-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-white/85"
                >
                  View Training →
                </Link>
              </div>
            </div>

            {/* MEAL PREP */}
            <div className="hero-meal-prep relative min-h-[520px] overflow-hidden lg:absolute lg:inset-0">
              <Image
                src="/home/gym-meal-prep.png"
                alt="Meal prep background"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/45" />

              <div className="relative z-10 flex h-full min-h-[520px] flex-col justify-center px-6 py-24 md:px-12 lg:items-end lg:px-20 lg:text-right">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#d6a936]">
                  Performance Nutrition
                </p>

                <h2 className="max-w-lg text-5xl font-black uppercase leading-[0.9] md:text-7xl">
                  Fuel With Systems
                </h2>

                <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
                  High-protein meal prep built for performance, recovery and busy
                  schedules.
                </p>

                <div className="mt-8 grid max-w-md grid-cols-2 border-y border-white/15 py-5 lg:text-left">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#d6a936]">
                      Meal Prep Style
                    </p>
                    <p className="mt-1 font-bold">High Protein</p>
                  </div>

                  <div className="border-l border-white/20 pl-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#d6a936]">
                      Main Focus
                    </p>
                    <p className="mt-1 font-bold">Performance</p>
                    <p className="text-xs text-white/55">Fuel & recovery</p>
                  </div>
                </div>

                <Link
                  href="/meal-prep-plans"
                  className="mt-8 inline-flex w-fit items-center gap-3 border border-white/25 bg-black/40 px-6 py-4 text-xs font-black uppercase tracking-wide transition hover:border-[#d6a936]/60"
                >
                  View Meal Preps →
                </Link>
              </div>
            </div>

            {/* Yellow diagonal divider — angle computed from clip-path values */}
            <HeroDivider topX={0.47} bottomX={0.53} />
          </div>
        </section>


        {/* RECORDS */}
        <section className="px-5 py-16 md:px-10 lg:px-24">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              Personal Records
            </p>
            <h2 className="text-3xl font-black md:text-5xl">Proof of Progress</h2>
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 lg:grid-cols-4">
            {records.map((r) => (
              <article
                key={r.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:border-[#d6a936]/50"
              >
                <p className="text-[#d6a936]">🏃</p>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/70">
                  {r.title}
                </p>
                <p className="mt-4 text-4xl font-black">{r.time}</p>
                <div className="mx-auto my-4 h-px w-20 bg-white/20" />
                <p className="text-xs uppercase text-white/60">Pace {r.pace}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/35">
                  {r.date}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* TRAINING + MEAL PREP CARDS */}
        <section className="px-5 pb-16 md:px-10 lg:px-24">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <FeatureCard
              href="/training"
              image="/home/training-programs.png"
              label="Training"
              title="Training Programs"
              text="Structured plans built for hybrid athletes. Strength, running, and recovery — all in one place."
              items={["Weekly training plans", "Run workouts & long runs", "Strength programs", "Progress tracking"]}
              cta="View Training"
            />

            <FeatureCard
              href="/meal-prep-plans"
              image="/home/meal-preps.png"
              label="Nutrition"
              title="Meal Preps"
              text="Simple, high-protein meals to fuel performance and save time."
              items={["Calories & macro tracking", "High-protein recipes", "Meal prep guides", "Grocery lists"]}
              cta="View Meal Preps"
            />
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

function FeatureCard({
  href,
  image,
  label,
  title,
  text,
  items,
  cta,
}: {
  href: string;
  image: string;
  label: string;
  title: string;
  text: string;
  items: string[];
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-[#d6a936]/50"
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover opacity-35 transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0" />

      <div className="relative z-10">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#d6a936]">
          {label}
        </p>
        <h3 className="text-3xl font-black uppercase md:text-4xl">{title}</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
          {text}
        </p>

        <div className="mt-8 space-y-3">
          {items.map((item) => (
            <p key={item} className="text-sm text-white/75">
              <span className="mr-2 text-[#d6a936]">✓</span>
              {item}
            </p>
          ))}
        </div>

        <span className="mt-8 inline-flex items-center gap-3 border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-widest">
          {cta} →
        </span>
      </div>
    </Link>
  );
}