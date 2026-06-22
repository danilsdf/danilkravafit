"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HomeHeader from "@/components/headers/HomeHeader";
import MainFooter from "@/components/footer/MainFooter";
import { AdjustStepModal, type MacroAdjustTarget, type MacroOverrides } from "@/components/MealPrepGroups/AdjustMacrosModal";
import type { MealPrepGroupItem, MealPrepGroupRecipeEntry } from "@/app/profile/types";

type RecipeOverrideFields = Partial<Pick<MealPrepGroupRecipeEntry, "kcalOverride" | "proteinOverride" | "carbsOverride" | "fatOverride">>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyOverrides(
  prev: MealPrepGroupItem | null,
  slug: string,
  overrides: RecipeOverrideFields
): MealPrepGroupItem | null {
  if (!prev) return prev;
  return {
    ...prev,
    recipes: prev.recipes.map((r) => (r.recipeSlug === slug ? { ...r, ...overrides } : r)),
  };
}

function removeRecipe(prev: MealPrepGroupItem | null, slug: string): MealPrepGroupItem | null {
  if (!prev) return prev;
  return { ...prev, recipes: prev.recipes.filter((r) => r.recipeSlug !== slug) };
}

// ── Totals ────────────────────────────────────────────────────────────────────

function GroupTotals({ recipes, days, calorieGoal }: Readonly<{ recipes: MealPrepGroupRecipeEntry[]; days: number; calorieGoal: number | null }>) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0;
  let hasData = false;

  for (const entry of recipes) {
    const base = entry.recipe?.nutritionTotals?.perServing;
    if (!base) continue;
    hasData = true;
    kcal += (entry.kcalOverride ?? base.kcal ?? 0) * entry.servings;
    protein += (entry.proteinOverride ?? base.protein ?? 0) * entry.servings;
    fat += (entry.fatOverride ?? base.fat ?? 0) * entry.servings;
    carbs += (entry.carbsOverride ?? base.carbs ?? 0) * entry.servings;
  }

  if (!hasData) return null;

  const d = Math.max(1, days);
  const perDayKcal = Math.round(kcal / d);
  const goalPct = calorieGoal ? Math.min(100, Math.round((perDayKcal / calorieGoal) * 100)) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">Totals</p>

      {calorieGoal != null && (
        <div className="flex flex-col gap-1 pb-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Daily calorie goal</span>
            <span className="text-xs font-semibold">
              <span className={perDayKcal >= calorieGoal ? "text-emerald-400" : "text-orange-400"}>{perDayKcal}</span>
              <span className="text-white/30"> / {calorieGoal} kcal</span>
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${goalPct !== null && goalPct >= 100 ? "bg-emerald-500" : "bg-orange-400"}`}
              style={{ width: `${goalPct ?? 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest w-20 shrink-0">Total</span>
        <span className="text-xs font-semibold text-orange-400">{Math.round(kcal)} kcal</span>
        <span className="text-xs font-semibold text-blue-400">{Math.round(protein)}g protein</span>
        <span className="text-xs font-semibold text-purple-400">{Math.round(fat)}g fat</span>
        <span className="text-xs font-semibold text-amber-400">{Math.round(carbs)}g carbs</span>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest w-20 shrink-0">Per day</span>
        <span className="text-xs font-semibold text-orange-400">{perDayKcal} kcal</span>
        <span className="text-xs font-semibold text-blue-400">{Math.round(protein / d)}g protein</span>
        <span className="text-xs font-semibold text-purple-400">{Math.round(fat / d)}g fat</span>
        <span className="text-xs font-semibold text-amber-400">{Math.round(carbs / d)}g carbs</span>
      </div>
    </div>
  );
}

// ── Recipe row ────────────────────────────────────────────────────────────────

function buildOverrideBody(overrides: MacroOverrides | null): RecipeOverrideFields {
  if (overrides) {
    return { kcalOverride: overrides.kcal, proteinOverride: overrides.protein, carbsOverride: overrides.carbs, fatOverride: overrides.fat };
  }
  return { kcalOverride: null, proteinOverride: null, carbsOverride: null, fatOverride: null };
}

interface RecipeRowProps {
  groupId: string;
  entry: MealPrepGroupRecipeEntry;
  onOverridesChange: (slug: string, overrides: RecipeOverrideFields) => void;
  onDelete: (slug: string) => void;
}

function RecipeRow({ groupId, entry, onOverridesChange, onDelete }: Readonly<RecipeRowProps>) {
  const { recipe, recipeSlug, kcalOverride, proteinOverride, carbsOverride, fatOverride } = entry;
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustKcal, setAdjustKcal] = useState("");
  const [adjustMacro, setAdjustMacro] = useState<MacroAdjustTarget>("protein");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = recipe?.nutritionTotals?.perServing;
  const adjustBase = (base?.kcal != null && base?.protein != null && base?.carbs != null && base?.fat != null)
    ? { kcal: base.kcal, protein: base.protein, carbs: base.carbs, fat: base.fat }
    : null;
  const effectiveKcal = kcalOverride ?? base?.kcal ?? null;
  const hasOverrides = kcalOverride != null || proteinOverride != null || carbsOverride != null || fatOverride != null;

  const scaled = base ? {
    kcal: effectiveKcal == null ? null : Math.round(effectiveKcal * entry.servings),
    protein: (proteinOverride ?? base.protein) == null ? null : Math.round((proteinOverride ?? base.protein ?? 0) * entry.servings),
    fat: (fatOverride ?? base.fat) == null ? null : Math.round((fatOverride ?? base.fat ?? 0) * entry.servings),
    carbs: (carbsOverride ?? base.carbs) == null ? null : Math.round((carbsOverride ?? base.carbs ?? 0) * entry.servings),
  } : null;

  async function handleOverrideSave(overrides: MacroOverrides | null) {
    setSaving(true);
    setError(null);
    try {
      const body = buildOverrideBody(overrides);
      const res = await fetch(`/api/user/meal-prep-groups/${groupId}/recipes/${recipeSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onOverridesChange(recipeSlug, body);
        setShowAdjustModal(false);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to update.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/user/meal-prep-groups/${groupId}/recipes/${recipeSlug}`, { method: "DELETE" });
      if (res.ok) onDelete(recipeSlug);
    } finally {
      setDeleting(false);
    }
  }

  if (!recipe) {
    return (
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <p className="text-sm text-white/30 italic">Recipe unavailable ({recipeSlug})</p>
        <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs text-red-400 hover:text-red-300 transition">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Link href={`/recipe/${recipeSlug}`} className="flex items-center gap-3 flex-1 min-w-0 group/link">
          <img
            src={recipe.imageUrl ?? "/home-page/results/meal-prep.jpg"}
            alt={recipe.title}
            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover/link:text-emerald-400 transition">
              {recipe.title}
            </p>
            {scaled && (
              <div className="flex flex-wrap gap-2 mt-0.5">
                {scaled.kcal != null && (
                  <span className={`text-xs font-semibold ${kcalOverride == null ? "text-orange-400" : "text-orange-300 ring-1 ring-orange-400/40 bg-orange-400/10 rounded px-1"}`}>
                    {scaled.kcal} kcal{kcalOverride == null ? "" : " (custom)"}
                  </span>
                )}
                {scaled.protein != null && <span className="text-xs text-blue-400">{scaled.protein}g P</span>}
                {scaled.fat != null && <span className="text-xs text-purple-400">{scaled.fat}g F</span>}
                {scaled.carbs != null && <span className="text-xs text-amber-400">{scaled.carbs}g C</span>}
              </div>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (adjustBase) {
                setAdjustKcal(String(Math.round(effectiveKcal ?? adjustBase.kcal)));
                setAdjustMacro("protein");
                setShowAdjustModal(true);
              }
            }}
            disabled={!adjustBase}
            title="Adjust macros per serving"
            className="p-1.5 rounded-lg text-white/30 hover:text-orange-400 hover:bg-orange-400/10 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Remove from group"
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showAdjustModal && adjustBase && (
        <AdjustStepModal
          adjustBase={adjustBase}
          adjustKcal={adjustKcal}
          setAdjustKcal={setAdjustKcal}
          adjustMacro={adjustMacro}
          setAdjustMacro={setAdjustMacro}
          saveAsIsLabel={hasOverrides ? "Reset to original" : "Cancel"}
          continueLabel={saving ? "Saving…" : "Apply"}
          onClose={() => setShowAdjustModal(false)}
          onSaveAsIs={() => handleOverrideSave(null)}
          onContinue={(overrides) => handleOverrideSave(overrides)}
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MealPrepGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [group, setGroup] = useState<MealPrepGroupItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [savingDays, setSavingDays] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [editingCalGoal, setEditingCalGoal] = useState(false);
  const [calGoalInput, setCalGoalInput] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/user/meal-prep-groups/${id}`)
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data) setGroup(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDaysChange(days: number) {
    if (!group || days < 1 || days > 30) return;
    setSavingDays(true);
    try {
      const res = await fetch(`/api/user/meal-prep-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        setGroup((prev) => prev ? { ...prev, days, recipes: prev.recipes.map((r) => ({ ...r, servings: days })) } : prev);
      }
    } finally {
      setSavingDays(false);
    }
  }

  async function handleRenameGroup() {
    const name = nameInput.trim();
    if (!name || !group) return;
    setNameError(null);
    const res = await fetch(`/api/user/meal-prep-groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setGroup((prev) => prev ? { ...prev, name } : prev);
      setEditingName(false);
    } else {
      const data = await res.json();
      setNameError(data.error ?? "Failed to rename.");
    }
  }

  async function handleCalGoalSave() {
    const goal = Number.parseInt(calGoalInput, 10);
    if (Number.isNaN(goal) || goal <= 0 || !group) return;
    const res = await fetch(`/api/user/meal-prep-groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calorieGoal: goal }),
    });
    if (res.ok) {
      setGroup((prev) => prev ? { ...prev, calorieGoal: goal } : prev);
      setEditingCalGoal(false);
    }
  }

  async function handleDeleteGroup() {
    if (!group) return;
    setDeletingGroup(true);
    try {
      const res = await fetch(`/api/user/meal-prep-groups/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/profile/meal-prep-groups");
    } finally {
      setDeletingGroup(false);
    }
  }

  return (
    <>
      <HomeHeader showTraining={false} />
      <main className="min-h-screen bg-neutral-950 text-white pt-28 pb-20 px-4">
        <div className="mx-auto max-w-2xl">
          {/* Breadcrumb */}
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6">
            <Link href="/" className="hover:text-white transition">Home</Link>
            {" / "}
            <Link href="/profile" className="hover:text-white transition">Profile</Link>
            {" / "}
            <Link href="/profile/meal-prep-groups" className="hover:text-white transition">Meal Prep Groups</Link>
            {group && <>{" / "}{group.name}</>}
          </p>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <svg className="w-6 h-6 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}

          {!loading && notFound && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
              <p className="text-white/40 text-sm mb-3">Group not found.</p>
              <Link href="/profile/meal-prep-groups" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition">
                ← Back to groups
              </Link>
            </div>
          )}

          {!loading && group && (
            <div className="flex flex-col gap-5">
              {/* ── Group header card ── */}
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                {/* Name row */}
                <div className="flex items-center gap-3 px-4 py-4">
                  {editingName ? (
                    <div className="flex flex-1 gap-2 items-center min-w-0">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameGroup();
                          if (e.key === "Escape") setEditingName(false);
                        }}
                        maxLength={80}
                        autoFocus
                        className="flex-1 min-w-0 rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                      />
                      <button type="button" onClick={handleRenameGroup} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition shrink-0">Save</button>
                      <button type="button" onClick={() => setEditingName(false)} className="text-xs text-white/30 hover:text-white/60 transition shrink-0">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-extrabold tracking-tight text-white truncate">{group.name}</h1>
                      <p className="text-xs text-white/30 mt-0.5">
                        {group.recipes.length === 1 ? "1 recipe" : `${group.recipes.length} recipes`}
                      </p>
                    </div>
                  )}
                  {!editingName && (
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Days stepper */}
                      <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleDaysChange((group.days ?? 5) - 1)}
                          disabled={(group.days ?? 5) <= 1 || savingDays}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                        </button>
                        <span className="px-1.5 text-sm font-semibold text-white tabular-nums whitespace-nowrap">
                          {savingDays ? "…" : `${group.days ?? 5}d`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDaysChange((group.days ?? 5) + 1)}
                          disabled={(group.days ?? 5) >= 30 || savingDays}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditingName(true); setNameInput(group.name); setNameError(null); }}
                        title="Rename group"
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.414-6.414a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 16H7v-2a2 2 0 012-2z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteGroup}
                        disabled={deletingGroup}
                        title="Delete group"
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                {nameError && <p className="px-4 pb-2 text-xs text-red-400">{nameError}</p>}

                {/* Calorie goal row */}
                <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2">
                  {editingCalGoal ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="number"
                        value={calGoalInput}
                        onChange={(e) => setCalGoalInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCalGoalSave();
                          if (e.key === "Escape") setEditingCalGoal(false);
                        }}
                        min={1}
                        max={10000}
                        autoFocus
                        placeholder="e.g. 2000"
                        className="w-28 rounded-lg bg-white/10 border border-white/10 px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                      />
                      <span className="text-xs text-white/40">kcal / day</span>
                      <button type="button" onClick={handleCalGoalSave} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition">Save</button>
                      <button type="button" onClick={() => setEditingCalGoal(false)} className="text-xs text-white/30 hover:text-white/60 transition">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Daily goal:</span>
                      {group.calorieGoal ? (
                        <span className="text-xs font-semibold text-orange-400">{group.calorieGoal} kcal</span>
                      ) : (
                        <span className="text-xs text-white/30">not set</span>
                      )}
                      <button
                        type="button"
                        onClick={() => { setEditingCalGoal(true); setCalGoalInput(group.calorieGoal?.toString() ?? ""); }}
                        title="Set calorie goal"
                        className="p-1 rounded text-white/30 hover:text-white/70 transition"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.414-6.414a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 16H7v-2a2 2 0 012-2z" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Recipes ── */}
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                {group.recipes.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-white/30 mb-3">No recipes in this group yet.</p>
                    <Link href="/recipes" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition">
                      Browse recipes →
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-white/5">
                    {group.recipes.map((entry) => (
                      <RecipeRow
                        key={entry.recipeSlug}
                        groupId={id}
                        entry={entry}
                        onOverridesChange={(slug, overrides) =>
                          setGroup((prev) => applyOverrides(prev, slug, overrides))
                        }
                        onDelete={(slug) =>
                          setGroup((prev) => removeRecipe(prev, slug))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Totals ── */}
              {group.recipes.length > 0 && (
                <GroupTotals
                  recipes={group.recipes}
                  days={group.days ?? 5}
                  calorieGoal={group.calorieGoal ?? null}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <MainFooter />
    </>
  );
}
