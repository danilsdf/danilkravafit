"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MacroSplitSlider from "@/components/MealPrepHelper/MacroSplitSlider";
import { TIER_DISPLAY_NAMES } from "@/lib/membership-config";
import type { ProfileData, MembershipInfo } from "./types";

function hasMissingFields(d: ProfileData): boolean {
  return d.weight == null || d.height == null || d.age == null || d.gender == null || d.goal == null;
}

function applyMeasurementUpdate(
  p: ProfileData,
  weight: string,
  height: string,
  age: string,
  gender: "male" | "female" | "",
  goal: "maintain" | "lose" | "gain" | ""
): ProfileData {
  return {
    ...p,
    weight: weight === "" ? null : Number(weight),
    height: height === "" ? null : Number(height),
    age: age === "" ? null : Number(age),
    gender: gender === "" ? null : gender,
    goal: goal === "" ? null : goal,
  };
}

function getCaloriesLabel(dailyCalories: number | null | undefined): string {
  return dailyCalories == null
    ? "I know my calories"
    : `I know my calories · ${dailyCalories} kcal/day`;
}

function getCalCardContent(
  showInput: boolean,
  profile: ProfileData
): { title: string; description: string } {
  if (showInput) {
    return {
      title: "Enter your daily calories",
      description: "If you use a smart watch and know your average daily calories, save it here.",
    };
  }
  const prefillNote =
    profile.weight && profile.height && profile.age
      ? " Your saved data will be pre-filled."
      : " Save your weight, height and age above to pre-fill the calculator.";
  return {
    title: "Know your daily calories",
    description: `Calculate your exact calorie needs based on your measurements, activity level and goal.${prefillNote}`,
  };
}

function StatCard({
  label,
  value,
  unit,
}: Readonly<{ label: string; value: number | null | undefined; unit: string }>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-1">
      <p className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</p>
      {value == null ? (
        <p className="text-2xl font-bold text-white/20">—</p>
      ) : (
        <p className="text-3xl font-extrabold">
          {value}
          <span className="text-base font-semibold text-white/40 ml-1">{unit}</span>
        </p>
      )}
    </div>
  );
}

const TIER_BADGE_CLASS: Record<MembershipInfo["tier"], string> = {
  EliteSupporter: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  HybridAthlete: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Runner: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

export function MembershipBadge({ tier }: Readonly<{ tier: MembershipInfo["tier"] }>) {
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${TIER_BADGE_CLASS[tier]}`}
    >
      {TIER_DISPLAY_NAMES[tier]}
    </span>
  );
}

function MembershipCard({ membership }: Readonly<{ membership: MembershipInfo | null }>) {
  const [portalLoading, setPortalLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) globalThis.location.href = data.url;
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  }

  const isActive = membership?.status === "active" || membership?.status === "trialing";

  if (!isActive) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Membership</p>
          <p className="text-base font-bold mb-1">No active membership</p>
          <p className="text-sm text-white/40">Support my journey and unlock exclusive content &amp; tools.</p>
        </div>
        <Link
          href="/membership"
          className="shrink-0 px-6 py-3 bg-white text-black text-sm font-black uppercase tracking-widest rounded-xl hover:bg-white/90 transition whitespace-nowrap"
        >
          View Plans
        </Link>
      </div>
    );
  }

  const m = membership ?? ({ tier: "Runner" } as MembershipInfo);
  const periodEnd = new Date(m.currentPeriodEnd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const tierColor = {
    EliteSupporter: { border: "border-yellow-500/20", bg: "bg-yellow-500/5", label: "text-yellow-400/70", badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    HybridAthlete: { border: "border-purple-500/20", bg: "bg-purple-500/5", label: "text-purple-400/70", badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    Runner: { border: "border-sky-500/20", bg: "bg-sky-500/5", label: "text-sky-400/70", badge: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  } as const;
  const colors = tierColor[m.tier] ?? tierColor.Runner;
  const tierDisplayName = TIER_DISPLAY_NAMES[m.tier] ?? "Member";

  return (
    <div className={`mt-6 rounded-2xl border p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${colors.border} ${colors.bg}`}>
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${colors.label}`}>Membership</p>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-base font-black">{tierDisplayName} Plan</p>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${colors.badge}`}>Active</span>
        </div>
        <p className="text-sm text-white/40">
          Billed {m.interval === "year" ? "yearly" : "monthly"} · {m.cancelAtPeriodEnd ? `Cancels on ${periodEnd}` : `Renews ${periodEnd}`}
        </p>
      </div>
      <button
        type="button"
        disabled={portalLoading}
        onClick={openPortal}
        className="shrink-0 px-6 py-3 border border-white/15 text-white text-sm font-bold rounded-xl hover:border-white/40 transition disabled:opacity-50 whitespace-nowrap"
      >
        {portalLoading ? "Loading…" : "Manage Subscription"}
      </button>
    </div>
  );
}

interface ProfileMainProps {
  profile: ProfileData;
  onProfileUpdate: (updated: ProfileData) => void;
}

export default function ProfileMain({ profile, onProfileUpdate }: Readonly<ProfileMainProps>) {
  const [weight, setWeight] = useState(profile.weight == null ? "" : String(profile.weight));
  const [height, setHeight] = useState(profile.height == null ? "" : String(profile.height));
  const [age, setAge] = useState(profile.age == null ? "" : String(profile.age));
  const [gender, setGender] = useState<"male" | "female" | "">(profile.gender ?? "");
  const [goal, setGoal] = useState<"maintain" | "lose" | "gain" | "">(profile.goal ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(() => hasMissingFields(profile));
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [showCaloriesCalculator, setShowCaloriesCalculator] = useState(false);
  const [knownCalories, setKnownCalories] = useState(profile.dailyCalories == null ? "" : String(profile.dailyCalories));
  const [caloriesSaving, setCaloriesSaving] = useState(false);
  const [caloriesSuccess, setCaloriesSuccess] = useState(false);
  const [macroSplit, setMacroSplit] = useState(profile.macroSplit ?? { protein: 33, fat: 30, carbs: 37 });
  const [macroSaving, setMacroSaving] = useState(false);
  const [macroSuccess, setMacroSuccess] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [calendarDisconnecting, setCalendarDisconnecting] = useState(false);
  const [stravaDisconnecting, setStravaDisconnecting] = useState(false);
  const [stravaConnected, setStravaConnected] = useState<boolean>(!!profile.stravaId);
  const [discordDisconnecting, setDiscordDisconnecting] = useState(false);
  const [discordConnected, setDiscordConnected] = useState<boolean>(!!profile.discordId);

  useEffect(() => {
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((d: { connected: boolean }) => setCalendarConnected(d.connected))
      .catch(() => setCalendarConnected(false));
  }, []);

  async function handleDisconnectCalendar() {
    setCalendarDisconnecting(true);
    try {
      await fetch("/api/calendar/status", { method: "DELETE" });
      setCalendarConnected(false);
    } finally {
      setCalendarDisconnecting(false);
    }
  }

  async function handleDisconnectStrava() {
    setStravaDisconnecting(true);
    try {
      await fetch("/api/auth/strava", { method: "DELETE" });
      setStravaConnected(false);
    } finally {
      setStravaDisconnecting(false);
    }
  }

  async function handleDisconnectDiscord() {
    setDiscordDisconnecting(true);
    try {
      await fetch("/api/auth/discord", { method: "DELETE" });
      setDiscordConnected(false);
    } finally {
      setDiscordDisconnecting(false);
    }
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weight: weight === "" ? null : weight,
        height: height === "" ? null : height,
        age: age === "" ? null : age,
        gender: gender === "" ? null : gender,
        goal: goal === "" ? null : goal,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save.");
      return;
    }

    setSuccess(true);
    onProfileUpdate(applyMeasurementUpdate(profile, weight, height, age, gender, goal));
    setFormOpen(false);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleSaveCalories() {
    setCaloriesSaving(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyCalories: knownCalories === "" ? null : knownCalories }),
    });
    setCaloriesSaving(false);
    const saved = knownCalories === "" ? null : Number(knownCalories);
    if (res.ok) {
      onProfileUpdate({ ...profile, dailyCalories: saved });
      setShowCaloriesInput(false);
      setShowCaloriesCalculator(false);
      setCaloriesSuccess(true);
      setTimeout(() => setCaloriesSuccess(false), 3000);
    }
  }

  async function handleSaveMacros() {
    setMacroSaving(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ macroSplit }),
    });
    setMacroSaving(false);
    if (res.ok) {
      onProfileUpdate({ ...profile, macroSplit });
      setMacroSuccess(true);
      setTimeout(() => setMacroSuccess(false), 3000);
    }
  }

  const bmi =
    profile.weight && profile.height
      ? (profile.weight / (profile.height / 100) ** 2).toFixed(1)
      : null;

  const caloriesLabel = getCaloriesLabel(profile.dailyCalories);
  const { title: calTitle, description: calDescription } = getCalCardContent(showCaloriesInput, profile);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Weight" value={profile.weight} unit="kg" />
        <StatCard label="Height" value={profile.height} unit="cm" />
        <StatCard label="Age" value={profile.age} unit="yrs" />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">BMI</p>
          {bmi ? (
            <p className="text-3xl font-extrabold">{bmi}</p>
          ) : (
            <p className="text-2xl font-bold text-white/20">—</p>
          )}
        </div>
      </div>

      {/* Goal / Gender badges */}
      {(profile.goal != null || profile.gender != null) && (
        <div className="flex flex-wrap gap-2 mb-10">
          {profile.goal != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-white/60">
              <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3l9 9-9 9" />
              </svg>
              Goal: {profile.goal}
            </span>
          )}
        </div>
      )}

      {/* Edit form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold">Your data and goals</h2>
          {!formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/30"
            >
              Update
            </button>
          )}
        </div>

        {success && (
          <p className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400 mb-5">
            Saved successfully.
          </p>
        )}

        {formOpen ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gender */}
              <div className="sm:col-span-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">Gender</p>
                <div className="flex gap-3">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(gender === g ? "" : g)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition capitalize ${
                        gender === g
                          ? "bg-white text-black border-white"
                          : "bg-white/5 text-white/50 border-white/10 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div className="mt-2">
                <label
                  htmlFor="weight"
                  className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5"
                >
                  Weight (kg)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="1"
                  max="500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 78.5"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
                />
              </div>

              {/* Height */}
              <div className="mt-2">
                <label
                  htmlFor="height"
                  className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5"
                >
                  Height (cm)
                </label>
                <input
                  id="height"
                  type="number"
                  step="1"
                  min="1"
                  max="300"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 182"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
                />
              </div>

              {/* Age */}
              <div className="mt-2">
                <label
                  htmlFor="age"
                  className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5"
                >
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  step="1"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Goal */}
            <div className="sm:col-span-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">Goal</p>
              <div className="flex gap-3">
                {(["lose", "maintain", "gain"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(goal === g ? "" : g)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition capitalize ${
                      goal === g
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 transition"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => { setFormOpen(false); setError(""); }}
                className="px-5 py-3 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/30 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-white/30">All data saved. Click Update to edit.</p>
        )}
      </div>

      {/* Calories section */}
      {profile.dailyCalories != null && !showCaloriesCalculator ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400/70 mb-2">Daily Calories</p>
            <p className="text-4xl font-extrabold">
              {profile.dailyCalories}
              <span className="text-base font-semibold text-white/40 ml-1">kcal/day</span>
            </p>
            {caloriesSuccess && (
              <p className="mt-2 text-xs text-green-400">Daily calories saved.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setShowCaloriesCalculator(true); setShowCaloriesInput(false); }}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Update calories
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400/70 mb-2">Calories</p>
            <h2 className="text-lg font-extrabold mb-1">{calTitle}</h2>
            <p className="text-sm text-white/50 max-w-sm">{calDescription}</p>
            {caloriesSuccess && (
              <p className="mt-2 text-xs text-green-400">Daily calories saved.</p>
            )}
          </div>
          {showCaloriesInput ? (
            <div className="shrink-0 flex flex-col gap-3 w-full sm:w-56">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="500"
                  max="9999"
                  value={knownCalories}
                  onChange={(e) => setKnownCalories(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
                />
                <button
                  type="button"
                  disabled={caloriesSaving}
                  onClick={handleSaveCalories}
                  className="shrink-0 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
                >
                  {caloriesSaving ? "…" : "Save"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setShowCaloriesInput(false); if (profile.dailyCalories != null) setShowCaloriesCalculator(false); }}
                className="text-xs text-white/30 hover:text-white/60 transition text-left"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-3">
              <Link
                href={`/tool/calories-calculator?age=${profile.age ?? ""}&weight=${profile.weight ?? ""}&height=${profile.height ?? ""}&gender=${profile.gender ?? ""}&goal=${profile.goal ?? ""}`}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Calculate calories
              </Link>
              <button
                type="button"
                onClick={() => setShowCaloriesInput(true)}
                className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition self-start"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {caloriesLabel}
              </button>
              {profile.dailyCalories != null && (
                <button
                  type="button"
                  onClick={() => setShowCaloriesCalculator(false)}
                  className="text-xs text-white/30 hover:text-white/60 transition text-left"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Macro Split section — only when daily calories are saved */}
      {profile.dailyCalories != null && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold pl-8">Macro Split</h2>
            {macroSuccess && (
              <p className="text-xs text-green-400">Saved!</p>
            )}
          </div>
          <MacroSplitSlider
            key={profile.dailyCalories}
            totalProteinG={profile.dailyCalories / 4}
            totalFatG={profile.dailyCalories / 9}
            totalCarbsG={profile.dailyCalories / 4}
            initial={macroSplit}
            onChange={setMacroSplit}
          />
          <div className="mt-4 mr-8 flex justify-end">
            <button
              type="button"
              disabled={macroSaving}
              onClick={handleSaveMacros}
              className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 transition"
            >
              {macroSaving ? "Saving…" : "Save macro split"}
            </button>
          </div>
        </div>
      )}

      {/* Membership section */}
      <MembershipCard membership={profile.membership ?? null} />

      {/* Integrations section */}
      {calendarConnected !== null && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-base font-bold mb-6">Integrations</h2>
          <div className="space-y-5">

            {/* Google */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Google</p>
                  {profile.googleId ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-xs text-white/40">Account linked</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 mt-0.5">Not linked — sign in with Google to link</p>
                  )}
                </div>
              </div>
            </div>

            {/* Google Calendar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="1.8"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="#4285F4" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 14h2v2H8z" fill="#EA4335"/>
                    <path d="M11 14h2v2h-2z" fill="#FBBC05"/>
                    <path d="M14 14h2v2h-2z" fill="#34A853"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Google Calendar</p>
                  {calendarConnected ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-xs text-white/40">Syncing to &quot;Training Program&quot; calendar</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 mt-0.5">Sync training workouts to your calendar</p>
                  )}
                </div>
              </div>
              {calendarConnected ? (
                <button
                  type="button"
                  disabled={calendarDisconnecting}
                  onClick={handleDisconnectCalendar}
                  className="shrink-0 px-4 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-xl hover:border-red-500/40 hover:text-red-400 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {calendarDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : (
                <a
                  href="/api/calendar/auth?returnPath=/profile"
                  className="shrink-0 px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/90 transition whitespace-nowrap"
                >
                  Connect
                </a>
              )}
            </div>

            {/* Strava */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="#FC4C02" className="w-5 h-5" aria-hidden="true">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Strava</p>
                  {stravaConnected ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-xs text-white/40">Account connected</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 mt-0.5">Connect to link your Strava activities</p>
                  )}
                </div>
              </div>
              {stravaConnected ? (
                <button
                  type="button"
                  disabled={stravaDisconnecting}
                  onClick={handleDisconnectStrava}
                  className="shrink-0 px-4 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-xl hover:border-red-500/40 hover:text-red-400 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {stravaDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : (
                <a
                  href="/api/auth/strava?returnPath=/profile"
                  className="shrink-0 px-4 py-2 bg-[#FC4C02] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#e04402] transition whitespace-nowrap"
                >
                  Connect
                </a>
              )}
            </div>

            {/* Discord */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="#5865F2" className="w-5 h-5" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Discord</p>
                  {discordConnected ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-xs text-white/40">Account connected</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 mt-0.5">Connect your Discord account</p>
                  )}
                </div>
              </div>
              {discordConnected ? (
                <button
                  type="button"
                  disabled={discordDisconnecting}
                  onClick={handleDisconnectDiscord}
                  className="shrink-0 px-4 py-2 border border-white/10 text-white/50 text-xs font-bold rounded-xl hover:border-red-500/40 hover:text-red-400 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {discordDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              ) : (
                <a
                  href="/api/auth/discord?returnPath=/profile"
                  className="shrink-0 px-4 py-2 bg-[#5865F2] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#4752c4] transition whitespace-nowrap"
                >
                  Connect
                </a>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
