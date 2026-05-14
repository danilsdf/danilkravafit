import type { CalendarEventItem } from "@/lib/googleCalendar";
import type { Workout } from "./types";

const DAY_OFFSETS: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

/**
 * Computes the exact Date for a workout given the program start date.
 * The program start date is anchored to Monday of week 1.
 */
export function computeWorkoutDate(
  programStartDate: Date,
  weekNumber: number,
  dayOfWeek: string,
  time: string
): Date {
  // Find Monday of the start week
  const startMonday = new Date(programStartDate);
  const daysSinceMonday = (programStartDate.getDay() + 6) % 7; // 0=Mon … 6=Sun
  startMonday.setDate(startMonday.getDate() - daysSinceMonday);

  const weekOffset = (weekNumber - 1) * 7;
  const dayOffset = DAY_OFFSETS[dayOfWeek] ?? 0;

  const date = new Date(startMonday);
  date.setDate(date.getDate() + weekOffset + dayOffset);

  const [h, m] = time.split(":").map(Number);
  date.setHours(h ?? 0, m ?? 0, 0, 0);

  return date;
}

/** Stable key for a workout in the program. */
export function workoutKey(weekNumber: number, workout: Workout): string {
  return `${weekNumber}-${workout.dayOfWeek}-${workout.title.slice(0, 60)}`;
}

/** Google Calendar color ID by workout type. */
export function calendarColorId(workoutType: string): string {
  const map: Record<string, string> = {
    run: "2",       // Sage
    strength: "9",  // Blueberry
    hiit: "11",     // Tomato
    cycling: "3",   // Grape
    yoga: "4",      // Flamingo
    mobility: "6",  // Tangerine
    rest: "8",      // Graphite
    crossfit: "5",  // Banana
    swim: "7",      // Peacock
  };
  return map[workoutType] ?? "0";
}

/**
 * Checks whether a workout's time slot overlaps with any existing calendar events.
 */
export function hasConflict(
  workoutStart: Date,
  workoutEnd: Date,
  events: CalendarEventItem[]
): boolean {
  const ws = workoutStart.getTime();
  const we = workoutEnd.getTime();

  for (const ev of events) {
    const es = new Date(ev.start.dateTime ?? ev.start.date ?? "").getTime();
    const ee = new Date(ev.end.dateTime ?? ev.end.date ?? "").getTime();
    if (isNaN(es) || isNaN(ee)) continue;
    // Overlap: not (we <= es || ws >= ee)
    if (we > es && ws < ee) return true;
  }

  return false;
}

/**
 * Suggests 3 alternative start times when a conflict is detected.
 * Returns an array of ISO datetime strings.
 */
export function suggestAlternatives(
  originalStart: Date,
  durationMs: number,
  existingEvents: CalendarEventItem[]
): string[] {
  const offsets = [-60, 60, 120, -120, 180]; // minutes
  const suggestions: string[] = [];

  for (const offset of offsets) {
    if (suggestions.length >= 3) break;
    const candidate = new Date(originalStart.getTime() + offset * 60 * 1000);
    const candidateEnd = new Date(candidate.getTime() + durationMs);
    if (!hasConflict(candidate, candidateEnd, existingEvents)) {
      suggestions.push(candidate.toISOString());
    }
  }

  return suggestions;
}

/** Format ISO datetime as human-readable label. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
