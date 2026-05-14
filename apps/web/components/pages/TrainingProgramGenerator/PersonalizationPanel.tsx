"use client";
import { useState, useEffect } from "react";
import type { TrainingPreferences } from "./types";

const TIMES = [
  "Early morning",
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Night",
] as const;

const STYLES = [
  "Hybrid",
  "Running-focused",
  "Strength-focused",
  "Cycling-focused",
  "General Fitness",
] as const;

const RECOVERY = [
  "Yoga",
  "Foam rolling",
  "Cold shower",
  "Sauna",
  "Stretching",
  "Active recovery",
  "Full rest",
] as const;

const EQUIPMENT = [
  "Barbell",
  "Dumbbells",
  "Pull-up bar",
  "Resistance bands",
  "Kettlebell",
  "Cable machine",
  "Treadmill",
  "Bike",
  "None",
] as const;

const DEFAULT_PREFS: TrainingPreferences = {
  preferredWorkoutTimes: [],
  trainingStyle: "",
  recoveryPreferences: [],
  gymAccess: false,
  availableEquipment: [],
};

interface PersonalizationPanelProps {
  isLoggedIn: boolean;
  onApply: (goal: string, experienceLevel: string) => void;
}

export default function PersonalizationPanel({
  isLoggedIn,
  onApply,
}: Readonly<PersonalizationPanelProps>) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<TrainingPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !open) return;
    setLoading(true);
    fetch("/api/user/training-preferences")
      .then((r) => r.json())
      .then((data: TrainingPreferences | null) => {
        if (data) setPrefs({ ...DEFAULT_PREFS, ...data });
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, [isLoggedIn, open]);

  const toggle = <K extends keyof TrainingPreferences>(
    key: K,
    value: string
  ) => {
    setPrefs((prev) => {
      const arr = prev[key] as string[];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  };

  const handleSave = async () => {
    if (!isLoggedIn) return;
    setSaving(true);
    try {
      await fetch("/api/user/training-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleApply = () => {
    onApply(prefs.goal ?? "", prefs.experienceLevel ?? "");
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
      >
        <div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Training Preferences
          </span>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Save your style, equipment, and recovery preferences
          </p>
        </div>
        <span className="text-neutral-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-5">
          {!isLoggedIn && (
            <p className="text-xs text-neutral-500">
              <a href="/login" className="underline hover:text-yellow-500">
                Log in
              </a>{" "}
              to save and apply your preferences.
            </p>
          )}

          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent mx-auto" />
          ) : (
            <>
              {/* Preferred Times */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Preferred Workout Times
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIMES.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      active={prefs.preferredWorkoutTimes.includes(t)}
                      onToggle={() => toggle("preferredWorkoutTimes", t)}
                    />
                  ))}
                </div>
              </div>

              {/* Training Style */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Training Style
                </p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={prefs.trainingStyle === s}
                      onToggle={() =>
                        setPrefs((p) => ({
                          ...p,
                          trainingStyle: p.trainingStyle === s ? "" : s,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Gym Access */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs.gymAccess}
                  onClick={() =>
                    setPrefs((p) => ({ ...p, gymAccess: !p.gymAccess }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${
                    prefs.gymAccess
                      ? "bg-yellow-500"
                      : "bg-neutral-300 dark:bg-neutral-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition ${
                      prefs.gymAccess ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Gym Access
                </span>
              </div>

              {/* Equipment */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Available Equipment
                </p>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map((e) => (
                    <Chip
                      key={e}
                      label={e}
                      active={prefs.availableEquipment.includes(e)}
                      onToggle={() => toggle("availableEquipment", e)}
                    />
                  ))}
                </div>
              </div>

              {/* Recovery */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Recovery Preferences
                </p>
                <div className="flex flex-wrap gap-2">
                  {RECOVERY.map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      active={prefs.recoveryPreferences.includes(r)}
                      onToggle={() => toggle("recoveryPreferences", r)}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              {isLoggedIn && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-full border border-yellow-500 px-4 py-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
                  >
                    Apply to Generator
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-400 disabled:opacity-40"
                  >
                  {saving
                    ? "Saving…"
                    : saved
                    ? "Saved ✓"
                    : "Save Preferences"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onToggle,
}: Readonly<{ label: string; active: boolean; onToggle: () => void }>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-yellow-500 bg-yellow-500 text-black"
          : "border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 hover:border-yellow-400"
      }`}
    >
      {label}
    </button>
  );
}
