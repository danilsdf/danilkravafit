"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkoutType = "run" | "strength" | "hiit" | "cycling" | "yoga" | "mobility" | "rest" | "crossfit" | "swim";
type Intensity = "easy" | "moderate" | "hard" | "max";

interface Workout {
  title: string;
  description: string;
  durationMinutes: number;
  dayOfWeek: string;
  time: string;
  workoutType: WorkoutType;
  intensity: Intensity;
}

interface WeekSchedule {
  week: number;
  focus: string;
  progressionNote: string;
  workouts: Workout[];
}

interface TrainingProgram {
  programTitle: string;
  goal: string;
  duration: string;
  experienceLevel: string;
  weeklySchedule: WeekSchedule[];
  progressionPlan: Record<string, string | null>;
  generalTips: string[];
}

interface SavedProgram {
  id: string;
  savedAt: string;
  programStartDate?: string | null;
  program: TrainingProgram;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  run: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  strength: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  hiit: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  cycling: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  yoga: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  mobility: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  rest: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  crossfit: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  swim: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
};

const INTENSITY_LABELS: Record<string, string> = {
  easy: "● Easy",
  moderate: "●● Moderate",
  hard: "●●● Hard",
  max: "●●●● Max",
};

const INTENSITY_COLORS: Record<string, string> = {
  easy: "text-emerald-500",
  moderate: "text-yellow-500",
  hard: "text-orange-500",
  max: "text-red-500",
};

const PROGRESSION_LABELS: Record<string, string> = {
  weeks1to2: "Weeks 1–2",
  weeks3to4: "Weeks 3–4",
  weeks5to6: "Weeks 5–6",
  weeks7to8: "Weeks 7–8",
};

// ─── WorkoutCard ─────────────────────────────────────────────────────────────

function WorkoutCard({ workout }: Readonly<{ workout: Workout }>) {
  const [open, setOpen] = useState(false);
  const typeColor = TYPE_COLORS[workout.workoutType] ?? TYPE_COLORS.rest;
  const intensityColor = INTENSITY_COLORS[workout.intensity] ?? "";
  const intensityLabel = INTENSITY_LABELS[workout.intensity] ?? workout.intensity;
  const isRest = workout.workoutType === "rest";

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${typeColor}`}>
              {workout.workoutType}
            </span>
            <span className={`text-xs font-medium ${intensityColor}`}>{intensityLabel}</span>
          </div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
            {workout.title}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {workout.dayOfWeek} · {workout.time} · {workout.durationMinutes} min
          </p>
        </div>
        {!isRest && (
          <span className="mt-1 text-neutral-400 text-xs select-none">{open ? "▲" : "▼"}</span>
        )}
      </div>
      {open && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-3">
          {workout.description}
        </p>
      )}
    </>
  );

  if (isRest) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 opacity-60 p-4">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 transition-all hover:border-yellow-400 dark:hover:border-yellow-500 text-left"
      onClick={() => setOpen((v) => !v)}
    >
      {inner}
    </button>
  );
}

// ─── WeekPanel ───────────────────────────────────────────────────────────────

function WeekPanel({ week }: Readonly<{ week: WeekSchedule }>) {
  const [open, setOpen] = useState(week.week === 1);
  const totalMinutes = week.workouts
    .filter((w) => w.workoutType !== "rest")
    .reduce((sum, w) => sum + w.durationMinutes, 0);

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Week {week.week} — {week.focus}
          </span>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {week.workouts.filter((w) => w.workoutType !== "rest").length} workouts ·{" "}
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min total
          </p>
        </div>
        <span className="text-neutral-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          {week.progressionNote && (
            <p className="mb-4 text-xs text-yellow-600 dark:text-yellow-400 font-medium border-l-2 border-yellow-500 pl-3">
              {week.progressionNote}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {week.workouts.map((w) => (
              <WorkoutCard key={`${w.dayOfWeek}-${w.title}`} workout={w} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedProgramPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SavedProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/user/saved-programs/${id}`)
      .then(async (res) => {
        if (res.status === 404 || res.status === 401) { setNotFound(true); return; }
        if (!res.ok) { setNotFound(true); return; }
        setData(await res.json() as SavedProgram);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-neutral-400">Program not found.</p>
        <Link href="/profile" className="text-xs text-yellow-500 hover:underline">← Back to profile</Link>
      </div>
    );
  }

  const { program, programStartDate } = data;
  const progressionEntries = (
    Object.entries(program.progressionPlan ?? {}) as [string, string | null][]
  ).filter((entry): entry is [string, string] => entry[1] !== null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        href="/profile#programs"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-yellow-500 transition mb-8"
      >
        ← Saved Programs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {program.programTitle}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          <span>{program.duration}</span>
          <span>·</span>
          <span>{program.experienceLevel}</span>
          <span>·</span>
          <span>{program.goal}</span>
          {programStartDate && (
            <>
              <span>·</span>
              <span>
                Starts{" "}
                {new Date(programStartDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="space-y-4 mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Weekly Schedule
        </h2>
        {program.weeklySchedule.map((week) => (
          <WeekPanel key={week.week} week={week} />
        ))}
      </div>

      {/* Progression plan */}
      {progressionEntries.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Progression Plan
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {progressionEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4"
              >
                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                  {PROGRESSION_LABELS[key] ?? key}
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General tips */}
      {program.generalTips && program.generalTips.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Coach Tips
          </h2>
          <ul className="space-y-2">
            {program.generalTips.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="mt-0.5 text-yellow-500 shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
