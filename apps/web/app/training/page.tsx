"use client";

import { useState, useEffect } from "react";
import programsData from "@/app/data/mockedTrainingPrograms.json";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Day = {
  day: string;
  iso: string;
  dateLabel: string;
  training: string;
  run?: string;
  bold?: boolean;
};

type Week = {
  id: number;
  title: string;
  subtitle: string;
  volume: string;
  days?: Day[];
};

type Program = {
  slug: string;
  title: string;
  description: string;
  startDate?: string;
  isCurrent?: boolean;
  endDate?: string;
  duration: string;
  totalKm: string;
  goal: string;
  targetRace?: string;
  weeks: Week[];
};

const PROGRAMS = programsData as Program[];

function findCurrentProgram(todayIso: string): Program {
  for (const prog of PROGRAMS) {
    for (const week of prog.weeks) {
      const days = week.days;
      if (!days || days.length === 0) continue;
      const first = days[0].iso;
      const last = days.at(-1)!.iso;
      if (todayIso >= first && todayIso <= last) return prog;
    }
  }
  return PROGRAMS.find(prog => prog.isCurrent) ?? PROGRAMS[0];
}

function getCurrentWeekIndex(weeks: Week[], todayIso: string): number {
  for (let i = 0; i < weeks.length; i++) {
    const days = weeks[i].days;
    if (!days) continue;
    const first = days[0].iso;
    const last = days.at(-1)!.iso;
    if (todayIso >= first && todayIso <= last) return i;
  }
  if (todayIso < (weeks[0].days?.[0].iso ?? "")) return 0;
  return weeks.length - 1;
}

function isProgramPast(prog: Program, todayIso: string): boolean {
  const lastWeek = prog.weeks.at(-1)!;
  const lastDay = lastWeek.days?.at(-1)?.iso ?? prog.endDate ?? "";
  return todayIso > lastDay;
}

export default function TrainingPage() {
  const [todayIso, setTodayIso] = useState("");
  const [program, setProgram] = useState<Program>(PROGRAMS[0]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const iso = new Date().toISOString().split("T")[0];
    setTodayIso(iso);
    const current = findCurrentProgram(iso);
    setProgram(current);
    setActiveIndex(getCurrentWeekIndex(current.weeks, iso));
  }, []);

  const activeWeek = program.weeks[activeIndex];
  const isCurrentWeek =
    todayIso !== "" && activeIndex === getCurrentWeekIndex(program.weeks, todayIso);
  const isPast = todayIso !== "" && isProgramPast(program, todayIso);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 px-5 pt-24 pb-10 md:px-10 lg:px-20">
        <div className="absolute inset-0 bg-[url('/home-page/home-background.png')] bg-cover bg-[75%_center] opacity-45" />

        <div className="relative z-10 max-w-7xl">
          <h1 className="max-w-2xl text-6xl font-black uppercase leading-none tracking-tight md:text-8xl">
            Training Program
          </h1>

          <p className="mt-6 max-w-md text-lg uppercase tracking-widest text-white/60">
            {program.duration}. One goal. Discipline every day.
          </p>

          <a
            href="/training-programs"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-xs font-black uppercase tracking-widest text-white/60 transition hover:border-white/40 hover:text-white/90"
          >
            See all programs →
          </a>

          <div className="mt-10 grid grid-cols-2 gap-4 rounded-xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur md:grid-cols-4">
            {[
              [program.duration.split(" ")[0], "Weeks"],
              [program.totalKm, "Total Running"],
              [program.goal, "Goal Time"],
              [program.targetRace ?? "—", "Target Race"],
            ].map(([value, label]) => (
              <div key={label} className="border-white/10 md:border-r last:border-r-0">
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/50">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {isPast && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-widest text-white/50">
              {"● Program completed"}
            </div>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <section className="grid gap-6 px-5 py-8 md:px-10 lg:grid-cols-[260px_1fr] lg:px-20">
        {/* SIDEBAR — horizontal scroll on mobile, sticky sidebar on lg */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 lg:flex lg:flex-col lg:overflow-visible lg:rounded-xl lg:border lg:border-white/10 lg:bg-white/[0.03] lg:p-3 lg:pb-3">
            {program.weeks.map((week, index) => {
              const isActive = index === activeIndex;
              const isCurrent =
                todayIso !== "" && index === getCurrentWeekIndex(program.weeks, todayIso);
              return (
                <button
                  key={week.title}
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-lg p-3 text-left transition w-full lg:p-4 ${
                    isActive
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <p className="text-sm font-black uppercase tracking-widest">
                    {week.title}
                    {isCurrent && (
                      <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-white/50">
                        ← now
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/55 hidden lg:block">
                    {week.subtitle}
                  </p>
                </button>
              );
            })}

            <div className="hidden rounded-lg border border-white/10 p-4 lg:block">
              <p className="mb-3 text-xs font-black uppercase tracking-widest">
                Program Overview
              </p>
              <p className="text-sm text-white/70">{program.duration}</p>
              <p className="text-sm text-white/70">{program.totalKm} running</p>
              <p className="text-sm text-white/70">Goal: {program.goal}</p>
              <p className="mt-4 text-xs italic leading-relaxed text-white/45">
                Discipline is doing what needs to be done even when you don't feel
                like doing it.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex flex-col gap-1 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-black uppercase tracking-wide">
                {activeWeek.title} — {activeWeek.subtitle}
                {isCurrentWeek && (
                  <span className="ml-3 text-sm font-normal normal-case tracking-normal text-white/45">
                    (current week)
                  </span>
                )}
              </h2>
              <p className="text-xs uppercase tracking-widest text-white/55">
                Weekly Volume: {activeWeek.volume}
              </p>
            </div>

            {activeWeek.days ? (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/45">
                      <tr>
                        <th className="px-5 py-4">Day</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Training</th>
                        <th className="px-5 py-4 text-right">Run</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeWeek.days.map((row) => {
                        const isToday = row.iso === todayIso;
                        const isPast = todayIso !== "" && row.iso < todayIso;
                        return (
                          <tr
                            key={row.iso}
                            className={`border-b border-white/10 last:border-b-0 ${
                              isToday
                                ? "bg-white text-black"
                                : isPast
                                ? "opacity-40"
                                : ""
                            }`}
                          >
                            <td className={`px-5 py-4 font-bold ${isToday ? "text-black/70" : "text-white/80"}`}>
                              {row.day}
                              {isToday && (
                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-black/50">
                                  today
                                </span>
                              )}
                            </td>
                            <td className={`px-5 py-4 ${isToday ? "text-black/55" : "text-white/55"}`}>
                              {row.dateLabel}
                            </td>
                            <td className="px-5 py-4 font-medium">
                              {row.bold ? <strong>{row.training}</strong> : row.training}
                            </td>
                            <td className={`px-5 py-4 text-right ${isToday ? "text-black/70" : "text-white/70"}`}>
                              {row.run} km
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-white/10">
                  {activeWeek.days.map((row) => {
                    const isToday = row.iso === todayIso;
                    const isPast = todayIso !== "" && row.iso < todayIso;
                    return (
                      <div
                        key={row.iso}
                        className={`flex items-start justify-between gap-3 px-4 py-3.5 ${
                          isToday
                            ? "bg-white text-black"
                            : isPast
                            ? "opacity-40"
                            : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`text-[11px] font-black uppercase tracking-widest mb-1 ${isToday ? "text-black/55" : "text-white/45"}`}>
                            {row.day} · {row.dateLabel}
                            {isToday && (
                              <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-black/40">
                                today
                              </span>
                            )}
                          </div>
                          <p className={`text-sm leading-snug ${row.bold ? "font-bold" : "font-medium"}`}>
                            {row.training}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-bold pt-0.5 ${isToday ? "text-black/60" : "text-white/50"}`}>
                          {row.run} km
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="px-5 py-8 text-sm text-white/40">
                No data available for this week yet.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
