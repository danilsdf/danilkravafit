"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { CalendarEventItem } from "@/lib/googleCalendar";
import type { TrainingProgram, Workout, CalendarEventRef } from "./types";
import {
  computeWorkoutDate,
  workoutKey,
  calendarColorId,
  hasConflict,
  suggestAlternatives,
  formatDateTime,
} from "./calendarUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarSyncState {
  connected: boolean;
  checkingStatus: boolean;
  eventMap: Record<string, CalendarEventRef>;
  conflicts: Set<string>;
  suggestions: Record<string, string[]>;
  loadingKeys: Set<string>;
  addToCalendar: (workout: Workout, weekNumber: number) => Promise<void>;
  addAllToCalendar: (program: TrainingProgram) => Promise<void>;
  removeFromCalendar: (key: string) => Promise<void>;
  reschedule: (key: string, newStart: string, durationMinutes: number) => Promise<void>;
  clearForNewProgram: () => void;
}

const LS_KEY = "training_calendar_events_v1";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCalendarSync(
  program: TrainingProgram | null,
  programStartDate: string
): CalendarSyncState {
  const [connected, setConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [eventMap, setEventMap] = useState<Record<string, CalendarEventRef>>({});
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const existingEventsRef = useRef<CalendarEventItem[]>([]);

  // Load persisted event map from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setEventMap(JSON.parse(raw) as Record<string, CalendarEventRef>);
    } catch { /* ignore */ }
  }, []);

  // Persist event map on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(eventMap));
    } catch { /* ignore */ }
  }, [eventMap]);

  // Check calendar connection status on mount + handle ?calendar=connected URL param
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/calendar/status");
        const data = await res.json() as { connected: boolean };
        setConnected(data.connected);
      } finally {
        setCheckingStatus(false);
      }
    };

    void check();

    // If redirected back after OAuth, update status
    const params = new URLSearchParams(globalThis.location.search);
    if (params.get("calendar") === "connected") {
      setConnected(true);
      // Clean up URL
      const url = new URL(globalThis.location.href);
      url.searchParams.delete("calendar");
      globalThis.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Detect conflicts whenever program, start date, or connection changes
  useEffect(() => {
    if (!program || !programStartDate || !connected) {
      setConflicts(new Set());
      setSuggestions({});
      return;
    }

    const fetchAndCompute = async () => {
      try {
        const startDate = new Date(programStartDate);
        const weekCount = program.weeklySchedule.length;
        const timeMin = startDate.toISOString();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + weekCount * 7);
        const timeMax = endDate.toISOString();

        const res = await fetch(
          `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
        );
        if (!res.ok) return;
        const data = await res.json() as { events: CalendarEventItem[] };
        existingEventsRef.current = data.events;

        const newConflicts = new Set<string>();
        const newSuggestions: Record<string, string[]> = {};

        for (const week of program.weeklySchedule) {
          for (const workout of week.workouts) {
            if (workout.workoutType === "rest") continue;
            const key = workoutKey(week.week, workout);
            if (eventMap[key]) continue; // already in calendar, skip conflict check

            const wStart = computeWorkoutDate(
              startDate,
              week.week,
              workout.dayOfWeek,
              workout.time
            );
            const wEnd = new Date(wStart.getTime() + workout.durationMinutes * 60_000);

            if (hasConflict(wStart, wEnd, data.events)) {
              newConflicts.add(key);
              newSuggestions[key] = suggestAlternatives(
                wStart,
                workout.durationMinutes * 60_000,
                data.events
              );
            }
          }
        }

        setConflicts(newConflicts);
        setSuggestions(newSuggestions);
      } catch { /* non-fatal */ }
    };

    void fetchAndCompute();
  }, [program, programStartDate, connected, eventMap]);

  const addToCalendar = useCallback(
    async (workout: Workout, weekNumber: number) => {
      if (!programStartDate) return;
      const key = workoutKey(weekNumber, workout);

      setLoadingKeys((prev) => new Set([...prev, key]));

      try {
        const startDate = new Date(programStartDate);
        const wStart = computeWorkoutDate(
          startDate,
          weekNumber,
          workout.dayOfWeek,
          workout.time
        );
        const wEnd = new Date(wStart.getTime() + workout.durationMinutes * 60_000);

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: workout.title,
            description: workout.description,
            startDateTime: wStart.toISOString(),
            endDateTime: wEnd.toISOString(),
            timeZone: tz,
            colorId: calendarColorId(workout.workoutType),
          }),
        });

        if (!res.ok) throw new Error("Failed to create event");
        const event = await res.json() as { id: string; htmlLink: string };

        setEventMap((prev) => ({
          ...prev,
          [key]: { eventId: event.id, htmlLink: event.htmlLink },
        }));
        setConflicts((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [programStartDate]
  );

  const addAllToCalendar = useCallback(
    async (prog: TrainingProgram) => {
      for (const week of prog.weeklySchedule) {
        for (const workout of week.workouts) {
          if (workout.workoutType === "rest") continue;
          const key = workoutKey(week.week, workout);
          if (eventMap[key]) continue;
          await addToCalendar(workout, week.week);
        }
      }
    },
    [addToCalendar, eventMap]
  );

  const removeFromCalendar = useCallback(async (key: string) => {
    const ref = eventMap[key];
    if (!ref) return;

    setLoadingKeys((prev) => new Set([...prev, key]));

    try {
      await fetch(`/api/calendar/events/${encodeURIComponent(ref.eventId)}`, {
        method: "DELETE",
      });
      setEventMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [eventMap]);

  const reschedule = useCallback(
    async (key: string, newStart: string, durationMinutes: number) => {
      const ref = eventMap[key];
      if (!ref) return;

      setLoadingKeys((prev) => new Set([...prev, key]));

      try {
        const newEnd = new Date(
          new Date(newStart).getTime() + durationMinutes * 60_000
        ).toISOString();
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        await fetch(`/api/calendar/events/${encodeURIComponent(ref.eventId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDateTime: newStart,
            endDateTime: newEnd,
            timeZone: tz,
          }),
        });

        // Remove from conflicts if rescheduled
        setConflicts((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } finally {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [eventMap]
  );

  const clearForNewProgram = useCallback(() => {
    setEventMap({});
    setConflicts(new Set());
    setSuggestions({});
    try {
      localStorage.removeItem(LS_KEY);
    } catch { /* ignore */ }
  }, []);

  return {
    connected,
    checkingStatus,
    eventMap,
    conflicts,
    suggestions,
    loadingKeys,
    addToCalendar,
    addAllToCalendar,
    removeFromCalendar,
    reschedule,
    clearForNewProgram,
  };
}

// ─── CalendarConnectBanner ────────────────────────────────────────────────────

interface BannerProps {
  connected: boolean;
  checking: boolean;
  calendarParam: string | null;
}

export function CalendarConnectBanner({ connected, checking, calendarParam }: Readonly<BannerProps>) {
  if (checking) return null;

  if (calendarParam === "error") {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        Google Calendar connection failed. Please try again.
      </div>
    );
  }

  if (calendarParam === "denied") {
    return (
      <div className="rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm text-neutral-500">
        Calendar access was declined. You can connect it later.
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
        <span className="text-base">✓</span>
        <span>Google Calendar connected — workouts can be synced automatically.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-neutral-300 dark:border-neutral-600 px-4 py-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Connect Google Calendar to sync workouts, detect conflicts, and get scheduling suggestions.
      </p>
      <a
        href={`/api/calendar/auth?returnPath=${encodeURIComponent("/tool/training-program-generator")}`}
        className="shrink-0 rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-400"
      >
        Connect Calendar
      </a>
    </div>
  );
}

// ─── AddToCalendarButton ──────────────────────────────────────────────────────

interface AddButtonProps {
  workout: Workout;
  weekNumber: number;
  calendarCtx: CalendarSyncState;
  programStartDate: string;
  isLoggedIn: boolean;
}

export function AddToCalendarButton({
  workout,
  weekNumber,
  calendarCtx,
  programStartDate,
  isLoggedIn,
}: Readonly<AddButtonProps>) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  if (workout.workoutType === "rest") return null;

  const key = workoutKey(weekNumber, workout);
  const isLoading = calendarCtx.loadingKeys.has(key);
  const isAdded = !!calendarCtx.eventMap[key];
  const hasConflictFlag = calendarCtx.conflicts.has(key);
  const sug = calendarCtx.suggestions[key] ?? [];

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="mt-2 inline-block text-xs text-neutral-400 hover:text-yellow-500 underline"
      >
        Log in to add to calendar
      </a>
    );
  }

  if (!calendarCtx.connected) {
    return (
      <a
        href={`/api/calendar/auth?returnPath=${encodeURIComponent("/tool/training-program-generator")}`}
        className="mt-2 inline-block text-xs text-neutral-400 hover:text-yellow-500 underline"
      >
        Connect calendar
      </a>
    );
  }

  if (!programStartDate) {
    return (
      <span className="mt-2 inline-block text-xs text-neutral-400">
        Set a start date to sync
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-2 h-4 w-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
    );
  }

  if (isAdded) {
    const ref = calendarCtx.eventMap[key];
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Synced</span>
        <a
          href={ref.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 hover:text-yellow-500 underline"
        >
          View
        </a>
        <button
          type="button"
          onClick={() => setShowReschedule(true)}
          className="text-xs text-neutral-400 hover:text-yellow-500 underline"
        >
          Reschedule
        </button>
        <button
          type="button"
          onClick={() => calendarCtx.removeFromCalendar(key)}
          className="text-xs text-neutral-400 hover:text-red-500 underline"
        >
          Remove
        </button>
        {showReschedule && (
          <RescheduleModal
            workout={workout}
            weekNumber={weekNumber}
            programStartDate={programStartDate}
            calendarCtx={calendarCtx}
            onClose={() => setShowReschedule(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {hasConflictFlag && (
        <div className="mb-1.5">
          <span className="text-xs text-orange-500 font-medium">⚠ Conflict detected</span>
          {sug.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuggestions((v) => !v)}
              className="ml-2 text-xs text-neutral-400 hover:text-yellow-500 underline"
            >
              {showSuggestions ? "Hide" : "Suggest alternatives"}
            </button>
          )}
          {showSuggestions && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {sug.map((alt) => (
                <button
                  key={alt}
                  type="button"
                  onClick={async () => {
                    setShowSuggestions(false);
                    await calendarCtx.addToCalendar(
                      { ...workout, time: new Date(alt).toTimeString().slice(0, 5) },
                      weekNumber
                    );
                  }}
                  className="rounded-full border border-neutral-300 dark:border-neutral-600 px-2 py-0.5 text-xs hover:border-yellow-400 transition"
                >
                  {formatDateTime(alt)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => calendarCtx.addToCalendar(workout, weekNumber)}
        className="rounded-full border border-neutral-300 dark:border-neutral-600 px-3 py-1 text-xs font-medium transition hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400"
      >
        + Add to Calendar
      </button>
    </div>
  );
}

// ─── RescheduleModal ──────────────────────────────────────────────────────────

interface RescheduleModalProps {
  workout: Workout;
  weekNumber: number;
  programStartDate: string;
  calendarCtx: CalendarSyncState;
  onClose: () => void;
}

function RescheduleModal({
  workout,
  weekNumber,
  programStartDate,
  calendarCtx,
  onClose,
}: Readonly<RescheduleModalProps>) {
  const key = workoutKey(weekNumber, workout);
  const startDate = new Date(programStartDate);
  const original = computeWorkoutDate(
    startDate,
    weekNumber,
    workout.dayOfWeek,
    workout.time
  );

  const formatInputDate = (d: Date) => d.toISOString().slice(0, 10);
  const formatInputTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const [date, setDate] = useState(formatInputDate(original));
  const [time, setTime] = useState(formatInputTime(original));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newStart = new Date(`${date}T${time}`).toISOString();
      await calendarCtx.reschedule(key, newStart, workout.durationMinutes);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 shadow-xl">
        <h3 className="mb-4 text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Reschedule Workout
        </h3>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">{workout.title}</p>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-neutral-400 uppercase tracking-wide">Date</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-400 uppercase tracking-wide">Time</p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-full bg-yellow-500 py-2 text-xs font-bold text-black transition hover:bg-yellow-400 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-neutral-300 dark:border-neutral-600 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition hover:border-neutral-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
