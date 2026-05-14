"use client";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type {
  GeneratorFormData,
  TimeSlot,
  TrainingProgram,
  Workout,
  WeekSchedule,
} from "./types";
import {
  useCalendarSync,
  CalendarConnectBanner,
  AddToCalendarButton,
  type CalendarSyncState,
} from "./CalendarSync";
import PersonalizationPanel from "./PersonalizationPanel";
import { useCurrentUser } from "@/lib/useCurrentUser";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];
const GOALS = [
  "Build Endurance",
  "Run a 5K",
  "Run a 10K",
  "Run a Half Marathon",
  "Run a Marathon",
  "Build Strength",
  "Lose Weight",
  "Hybrid Athlete",
  "Improve VO2 Max",
  "General Fitness",
];
const DURATIONS = ["4 weeks", "6 weeks", "8 weeks", "10 weeks", "12 weeks", "16 weeks"];

const WORKOUT_TYPE_COLORS: Record<string, string> = {
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

interface WorkoutCardProps {
  workout: Workout;
  weekNumber?: number;
  calendarCtx?: CalendarSyncState;
  programStartDate?: string;
  isLoggedIn?: boolean;
}

function WorkoutCard({
  workout,
  weekNumber = 0,
  calendarCtx,
  programStartDate = "",
  isLoggedIn = false,
}: Readonly<WorkoutCardProps>) {
  const [open, setOpen] = useState(false);
  const typeColor = WORKOUT_TYPE_COLORS[workout.workoutType] ?? WORKOUT_TYPE_COLORS.rest;
  const intensityColor = INTENSITY_COLORS[workout.intensity] ?? "";
  const intensityLabel = INTENSITY_LABELS[workout.intensity] ?? workout.intensity;
  const isRest = workout.workoutType === "rest";

  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${typeColor}`}
            >
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
        <>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-3">
            {workout.description}
          </p>
          {calendarCtx && (
            <AddToCalendarButton
              workout={workout}
              weekNumber={weekNumber}
              calendarCtx={calendarCtx}
              programStartDate={programStartDate}
              isLoggedIn={isLoggedIn}
            />
          )}
        </>
      )}
    </>
  );

  if (isRest) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 opacity-60 p-4">
        {cardContent}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 transition-all hover:border-yellow-400 dark:hover:border-yellow-500 text-left"
      onClick={() => setOpen((v) => !v)}
    >
      {cardContent}
    </button>
  );
}

interface WeekPanelProps {
  week: WeekSchedule;
  calendarCtx?: CalendarSyncState;
  programStartDate?: string;
  isLoggedIn?: boolean;
}

function WeekPanel({
  week,
  calendarCtx,
  programStartDate = "",
  isLoggedIn = false,
}: Readonly<WeekPanelProps>) {
  const [open, setOpen] = useState(week.week === 1);
  const totalMinutes = week.workouts
    .filter((w) => w.workoutType !== "rest")
    .reduce((sum, w) => sum + w.durationMinutes, 0);

  const hasConflicts = calendarCtx && week.workouts.some(
    (w) => w.workoutType !== "rest" && calendarCtx.conflicts.has(`${week.week}-${w.dayOfWeek}-${w.title.slice(0, 60)}`)
  );

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Week {week.week} — {week.focus}
            </span>
            {hasConflicts && (
              <span className="text-xs text-orange-500">⚠ conflict</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {week.workouts.filter((w) => w.workoutType !== "rest").length} workouts ·{" "}
            {Math.round(totalMinutes / 60)}h {totalMinutes % 60}min total
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
              <WorkoutCard
                key={`${w.dayOfWeek}-${w.title}`}
                workout={w}
                weekNumber={week.week}
                calendarCtx={calendarCtx}
                programStartDate={programStartDate}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgramOutputProps {
  program: TrainingProgram;
  programStartDate: string;
  onStartDateChange: (date: string) => void;
  calendarCtx: CalendarSyncState;
  calendarParam: string | null;
  isLoggedIn: boolean;
  onSaved: (id: string) => void;
  savedId: string | null;
}

function ProgramOutput({
  program,
  programStartDate,
  onStartDateChange,
  calendarCtx,
  calendarParam,
  isLoggedIn,
  onSaved,
  savedId,
}: Readonly<ProgramOutputProps>) {
  const [saving, setSaving] = useState(false);

  const handleSaveProgram = async () => {
    if (!isLoggedIn) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/saved-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program, programStartDate: programStartDate || null }),
      });
      if (res.ok) {
        const data = await res.json() as { id: string };
        onSaved(data.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddAllToCalendar = async () => {
    await calendarCtx.addAllToCalendar(program);
    // Auto-save whenever user syncs to calendar
    if (isLoggedIn && !savedId) {
      await handleSaveProgram();
    }
  };
  const progressionEntries = Object.entries(program.progressionPlan).filter(
    ([, v]) => v !== null
  ) as [string, string][];

  const progressionLabels: Record<string, string> = {
    weeks1to2: "Weeks 1–2",
    weeks3to4: "Weeks 3–4",
    weeks5to6: "Weeks 5–6",
    weeks7to8: "Weeks 7–8",
  };

  const syncedCount = Object.keys(calendarCtx.eventMap).length;
  const totalWorkouts = program.weeklySchedule.reduce(
    (sum, w) => sum + w.workouts.filter((wo) => wo.workoutType !== "rest").length,
    0
  );

  return (
    <div className="mt-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {program.programTitle}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {program.duration} · {program.experienceLevel} · {program.goal}
          </p>
        </div>
        {isLoggedIn && (
          <div className="flex items-center gap-2 shrink-0">
            {savedId ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span>✓</span> Saved to profile{" "}
                <a href="/profile#programs" className="underline hover:text-yellow-500 ml-1">View</a>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSaveProgram}
                disabled={saving}
                className="rounded-full border border-neutral-300 dark:border-neutral-600 px-4 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save Program"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Calendar Integration */}
      <div className="space-y-3">
        <CalendarConnectBanner
          connected={calendarCtx.connected}
          checking={calendarCtx.checkingStatus}
          calendarParam={calendarParam}
        />

        {/* Start Date + Bulk Add */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 shrink-0">
              Program Start
            </p>
            <input
              type="date"
              value={programStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-1.5 text-xs focus:border-yellow-500 focus:outline-none"
            />
          </div>
          {calendarCtx.connected && programStartDate && (
            <button
              type="button"
              onClick={handleAddAllToCalendar}
              className="rounded-full border border-yellow-500 px-4 py-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
            >
              {syncedCount > 0
                ? `Add All to Calendar (${syncedCount}/${totalWorkouts} synced)`
                : "Add All to Calendar"}
            </button>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Weekly Schedule
        </h3>
        {program.weeklySchedule.map((week) => (
          <WeekPanel
            key={week.week}
            week={week}
            calendarCtx={calendarCtx}
            programStartDate={programStartDate}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>

      {progressionEntries.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Progression Plan
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {progressionEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4"
              >
                <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                  {progressionLabels[key] ?? key}
                </p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {program.generalTips && program.generalTips.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Coach Tips
          </h3>
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

export default function TrainingProgramGeneratorPageBody() {
  const { user, loading: userLoading } = useCurrentUser();
  const isLoggedIn = !userLoading && !!user;

  const [form, setForm] = useState<GeneratorFormData>({
    goal: "",
    duration: "8 weeks",
    availableDays: [],
    availableTimeSlots: [],
    experienceLevel: "Intermediate",
  });
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [programStartDate, setProgramStartDate] = useState("");
  const [savedProgramId, setSavedProgramId] = useState<string | null>(null);
  const bufferRef = useRef("");

  const calendarCtx = useCalendarSync(program, programStartDate);

  const searchParams = useSearchParams();
  const calendarParam = searchParams.get("calendar");

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const isSelected = prev.availableDays.includes(day);
      const days = isSelected
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day];

      const slots = isSelected
        ? prev.availableTimeSlots.filter((s) => s.day !== day)
        : prev.availableTimeSlots.some((s) => s.day === day)
        ? prev.availableTimeSlots
        : [...prev.availableTimeSlots, { day, time: "06:00", duration: 60 }];

      return { ...prev, availableDays: days, availableTimeSlots: slots };
    });
  };

  const updateSlot = (day: string, field: keyof Omit<TimeSlot, "day">, value: string | number) => {
    setForm((prev) => {
      const existing = prev.availableTimeSlots.find((s) => s.day === day);
      if (existing) {
        return {
          ...prev,
          availableTimeSlots: prev.availableTimeSlots.map((s) =>
            s.day === day ? { ...s, [field]: value } : s
          ),
        };
      }
      return {
        ...prev,
        availableTimeSlots: [
          ...prev.availableTimeSlots,
          { day, time: "06:00", duration: 60, [field]: value },
        ],
      };
    });
  };

  const getSlot = (day: string): TimeSlot =>
    form.availableTimeSlots.find((s) => s.day === day) ?? {
      day,
      time: "06:00",
      duration: 60,
    };

  const isValid =
    form.goal.trim() !== "" &&
    form.availableDays.length > 0 &&
    form.availableDays.every((d) => form.availableTimeSlots.some((s) => s.day === d));

  const handleGenerate = async () => {
    if (!isValid) return;
    setLoading(true);
    setProgram(null);
    setError(null);
    setStreamText("");
    bufferRef.current = "";

    // Clear stale calendar events when regenerating
    calendarCtx.clearForNewProgram();
    setSavedProgramId(null);

    try {
      const res = await fetch("/api/ai/training-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to generate program");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        bufferRef.current += chunk;
        setStreamText(bufferRef.current);
      }

      // Parse final JSON
      const raw = bufferRef.current.trim();
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid response format");
      }
      const parsed: TrainingProgram = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      setProgram(parsed);
      setStreamText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 text-neutral-900 dark:text-neutral-100">
      <section className="mb-10 text-center">
        <h1 className="text-xl font-semibold sm:text-2xl text-yellow-600 dark:text-yellow-400">
          Training Program Generator
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Build a personalized weekly training schedule powered by AI.
        </p>
      </section>

      <PersonalizationPanel
        isLoggedIn={isLoggedIn}
        onApply={(goal, experienceLevel) => {
          setForm((prev) => ({
            ...prev,
            ...(goal ? { goal } : {}),
            ...(experienceLevel ? { experienceLevel } : {}),
          }));
        }}
      />

      {/* FORM */}
      <div className="space-y-8">
        {/* Goal */}
        <div>
          <p className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
            Training Goal
          </p>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm((p) => ({ ...p, goal: g }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.goal === g
                    ? "border-yellow-500 bg-yellow-500 text-black dark:text-black"
                    : "border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-yellow-400"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type a custom goal…"
            value={GOALS.includes(form.goal) ? "" : form.goal}
            onChange={(e) => setForm((p) => ({ ...p, goal: e.target.value }))}
            className="mt-3 w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-transparent px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none"
          />
        </div>

        {/* Duration */}
        <div>
          <p className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
            Program Duration
          </p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((p) => ({ ...p, duration: d }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.duration === d
                    ? "border-yellow-500 bg-yellow-500 text-black"
                    : "border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-yellow-400"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <p className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
            Experience Level
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setForm((p) => ({ ...p, experienceLevel: l }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  form.experienceLevel === l
                    ? "border-yellow-500 bg-yellow-500 text-black"
                    : "border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:border-yellow-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Available Days + Time Slots */}
        <div>
          <p className="block text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
            Available Days &amp; Time Slots
          </p>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const selected = form.availableDays.includes(day);
              const slot = getSlot(day);
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-full sm:w-28 shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      selected
                        ? "border-yellow-500 bg-yellow-500 text-black"
                        : "border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-yellow-400"
                    }`}
                  >
                    {day}
                  </button>
                  {selected && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={slot.time}
                        onChange={(e) => updateSlot(day, "time", e.target.value)}
                        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-2 text-xs focus:border-yellow-500 focus:outline-none"
                      />
                      <select
                        value={slot.duration}
                        onChange={(e) => updateSlot(day, "duration", Number.parseInt(e.target.value, 10))}
                        className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-xs focus:border-yellow-500 focus:outline-none"
                      >
                        {[30, 45, 60, 75, 90, 105, 120].map((m) => (
                          <option key={m} value={m}>{m} min</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {form.availableDays.some((d) => !form.availableTimeSlots.some((s) => s.day === d)) && (
              <p className="mt-2 text-xs text-orange-500">
                Set a time slot for each selected day to continue.
              </p>
            )}
        </div>

        {/* Generate button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!isValid || loading}
            className="rounded-full bg-yellow-500 px-8 py-3 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Generate Program"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            Building your training program…
          </p>
          {streamText && (
            <p className="mt-2 text-xs text-neutral-400 max-w-sm mx-auto truncate">
              {streamText.slice(-80)}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-8 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-5 py-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Output */}
      {program && (
        <ProgramOutput
          program={program}
          programStartDate={programStartDate}
          onStartDateChange={setProgramStartDate}
          calendarCtx={calendarCtx}
          calendarParam={calendarParam}
          isLoggedIn={isLoggedIn}
          savedId={savedProgramId}
          onSaved={setSavedProgramId}
        />
      )}
    </div>
  );
}
