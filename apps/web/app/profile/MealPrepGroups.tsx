"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import type { MealPrepGroupItem, MealPrepGroupRecipeEntry } from "./types";
import { AdjustStepModal, type MacroAdjustTarget, type MacroOverrides } from "@/components/MealPrepGroups/AdjustMacrosModal";

type RecipeOverrideFields = Partial<Pick<MealPrepGroupRecipeEntry, "kcalOverride" | "proteinOverride" | "carbsOverride" | "fatOverride">>;

// ── Types ─────────────────────────────────────────────────────────────────────

interface MealPrepGroupsProps {
  loading: boolean;
  items: MealPrepGroupItem[];
  onDelete: (id: string) => void;
  onUpdate: (updated: MealPrepGroupItem) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pluralRecipes(count: number): string {
  return count === 1 ? "1 recipe" : `${count} recipes`;
}

function updateRecipeServings(
  prev: MealPrepGroupItem | null,
  slug: string,
  servings: number
): MealPrepGroupItem | null {
  if (!prev) return prev;
  return {
    ...prev,
    recipes: prev.recipes.map((r) => (r.recipeSlug === slug ? { ...r, servings } : r)),
  };
}

function removeRecipeFromDetail(
  prev: MealPrepGroupItem | null,
  slug: string
): MealPrepGroupItem | null {
  if (!prev) return prev;
  return { ...prev, recipes: prev.recipes.filter((r) => r.recipeSlug !== slug) };
}

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

// ── Expanded group content ────────────────────────────────────────────────────

interface ExpandedContentProps {
  loading: boolean;
  groupDetail: MealPrepGroupItem | null;
  groupId: string;
  days: number;
  calorieGoal: number | null;
  onRecipeUpdate: (slug: string, servings: number) => void;
  onOverridesChange: (slug: string, overrides: RecipeOverrideFields) => void;
  onRecipeDelete: (slug: string) => void;
}

function ExpandedContent({ loading, groupDetail, groupId, days, calorieGoal, onRecipeUpdate, onOverridesChange, onRecipeDelete }: Readonly<ExpandedContentProps>) {
  if (loading) return <p className="px-4 py-4 text-sm text-white/30">Loading recipes…</p>;
  if (!groupDetail) return <p className="px-4 py-4 text-sm text-white/30">Failed to load.</p>;
  if (groupDetail.recipes.length === 0) return <p className="px-4 py-4 text-sm text-white/30">No recipes in this group yet.</p>;

  return (
    <>
      <GroupRecipeList
        groupId={groupId}
        recipes={groupDetail.recipes}
        onRecipeUpdate={onRecipeUpdate}
        onOverridesChange={onOverridesChange}
        onRecipeDelete={onRecipeDelete}
      />
      <GroupTotals recipes={groupDetail.recipes} days={days} calorieGoal={calorieGoal} />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MealPrepGroups({ loading, items, onDelete, onUpdate }: Readonly<MealPrepGroupsProps>) {
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);
  const [savingDays, setSavingDays] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const savedCount = new Set(items.flatMap((g) => g.recipes.map((r) => r.recipeSlug))).size;
  function getSavedLabel() {
    if (loading) return "…";
    if (savedCount === 0) return "No saved recipes yet";
    return `${savedCount} recipe${savedCount === 1 ? "" : "s"}`;
  }
  const savedLabel = getSavedLabel();

  async function handleDaysChange(id: string, days: number) {
    if (days < 1 || days > 30) return;
    setSavingDays(id);
    try {
      const res = await fetch(`/api/user/meal-prep-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        const group = items.find((g) => g._id === id);
        if (group) onUpdate({ ...group, days });
      }
    } finally {
      setSavingDays(null);
    }
  }

  async function handleDeleteGroup(id: string) {
    setDeletingGroup(id);
    try {
      const res = await fetch(`/api/user/meal-prep-groups/${id}`, { method: "DELETE" });
      if (res.ok) onDelete(id);
    } finally {
      setDeletingGroup(null);
    }
  }

  async function handleRenameGroup(id: string) {
    const name = nameInput.trim();
    if (!name) return;
    setNameError(null);
    const res = await fetch(`/api/user/meal-prep-groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const group = items.find((g) => g._id === id);
      if (group) onUpdate({ ...group, name });
      setEditingName(null);
    } else {
      const data = await res.json();
      setNameError(data.error ?? "Failed to rename.");
    }
  }

  let groupsBody: React.ReactNode;
  if (loading) {
    groupsBody = <p className="text-sm text-white/30">Loading…</p>;
  } else if (items.length === 0) {
    groupsBody = (
      <p className="text-sm text-white/30">
        No groups yet. Use{" "}
        <Link href="/recipes" className="text-emerald-400 hover:underline">Save to Group</Link>{" "}
        on any recipe to create one.
      </p>
    );
  } else {
    groupsBody = (
      <div className="flex flex-col gap-3">
        {items.map((group) => {
          const isDeleting = deletingGroup === group._id;
          const isEditingThisName = editingName === group._id;
          return (
            <div key={group._id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {isEditingThisName ? (
                  <div className="flex flex-1 gap-2 items-center min-w-0">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameGroup(group._id);
                        if (e.key === "Escape") setEditingName(null);
                      }}
                      maxLength={80}
                      autoFocus
                      className="flex-1 min-w-0 rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                    />
                    <button type="button" onClick={() => handleRenameGroup(group._id)} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition shrink-0">Save</button>
                    <button type="button" onClick={() => setEditingName(null)} className="text-xs text-white/30 hover:text-white/60 transition shrink-0">Cancel</button>
                  </div>
                ) : (
                  <Link href={`/profile/meal-prep-groups/${group._id}`} className="flex-1 min-w-0 text-left group/link">
                    <p className="text-sm font-semibold text-white truncate group-hover/link:text-emerald-400 transition">{group.name}</p>
                    <p className="text-xs text-white/30">{pluralRecipes(group.recipes?.length ?? 0)}</p>
                  </Link>
                )}
                {!isEditingThisName && (
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Days stepper */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleDaysChange(group._id, (group.days ?? 5) - 1)}
                        disabled={(group.days ?? 5) <= 1 || savingDays === group._id}
                        className="w-5 h-5 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="px-1 text-xs font-semibold text-white tabular-nums whitespace-nowrap">
                        {savingDays === group._id ? "…" : `${group.days ?? 5}d`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDaysChange(group._id, (group.days ?? 5) + 1)}
                        disabled={(group.days ?? 5) >= 30 || savingDays === group._id}
                        className="w-5 h-5 flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-30"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                    <button type="button" onClick={() => { setEditingName(group._id); setNameInput(group.name); setNameError(null); }} title="Rename group" className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.414-6.414a2 2 0 012.828 2.828L11.828 15.828A2 2 0 019 16H7v-2a2 2 0 012-2z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDeleteGroup(group._id)} disabled={isDeleting} title="Delete group" className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <Link href={`/profile/meal-prep-groups/${group._id}`} className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition" title="Open group">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </div>
                )}
              </div>
              {nameError && <p className="px-4 pb-2 text-xs text-red-400">{nameError}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── All Saved card ── */}
      <Link
        href="/profile/saved"
        className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 transition"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">All Saved</p>
          <p className="text-sm font-semibold text-white">{savedLabel}</p>
        </div>
        <svg className="w-5 h-5 text-white/20 group-hover:text-white/50 transition shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* ── Groups ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Your Groups</p>

        {groupsBody}
      </div>
    </div>
  );
}

// ── Recipe list inside an expanded group ──────────────────────────────────────

interface GroupRecipeListProps {
  groupId: string;
  recipes: MealPrepGroupRecipeEntry[];
  onRecipeUpdate: (slug: string, servings: number) => void;
  onOverridesChange: (slug: string, overrides: RecipeOverrideFields) => void;
  onRecipeDelete: (slug: string) => void;
}

function GroupRecipeList({ groupId, recipes, onRecipeUpdate, onOverridesChange, onRecipeDelete }: Readonly<GroupRecipeListProps>) {
  return (
    <div className="flex flex-col divide-y divide-white/5">
      {recipes.map((entry) => (
        <RecipeRow
          key={entry.recipeSlug}
          groupId={groupId}
          entry={entry}
          onUpdate={onRecipeUpdate}
          onOverridesChange={onOverridesChange}
          onDelete={onRecipeDelete}
        />
      ))}
    </div>
  );
}

// ── Single recipe row with servings editor ────────────────────────────────────

interface RecipeRowProps {
  groupId: string;
  entry: MealPrepGroupRecipeEntry;
  onUpdate: (slug: string, servings: number) => void;
  onOverridesChange: (slug: string, overrides: RecipeOverrideFields) => void;
  onDelete: (slug: string) => void;
}

function computeScaled(
  base: NonNullable<MealPrepGroupRecipeEntry["recipe"]>["nutritionTotals"] extends undefined ? never : { kcal?: number | null; protein?: number | null; fat?: number | null; carbs?: number | null },
  entry: Pick<MealPrepGroupRecipeEntry, "servings" | "kcalOverride" | "proteinOverride" | "carbsOverride" | "fatOverride">
) {
  const effectiveKcal = entry.kcalOverride ?? base.kcal ?? null;
  return {
    kcal: effectiveKcal == null ? null : Math.round(effectiveKcal * entry.servings),
    protein: (entry.proteinOverride ?? base.protein) == null ? null : Math.round((entry.proteinOverride ?? base.protein ?? 0) * entry.servings),
    fat: (entry.fatOverride ?? base.fat) == null ? null : Math.round((entry.fatOverride ?? base.fat ?? 0) * entry.servings),
    carbs: (entry.carbsOverride ?? base.carbs) == null ? null : Math.round((entry.carbsOverride ?? base.carbs ?? 0) * entry.servings),
  };
}

function buildOverrideBody(overrides: MacroOverrides | null): RecipeOverrideFields {
  if (overrides) {
    return { kcalOverride: overrides.kcal, proteinOverride: overrides.protein, carbsOverride: overrides.carbs, fatOverride: overrides.fat };
  }
  return { kcalOverride: null, proteinOverride: null, carbsOverride: null, fatOverride: null };
}

function RecipeRow({ groupId, entry, onUpdate: _onUpdate, onOverridesChange, onDelete }: Readonly<RecipeRowProps>) {
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
  const scaled = base ? computeScaled(base, entry) : null;
  const hasOverrides = kcalOverride != null || proteinOverride != null || carbsOverride != null || fatOverride != null;

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
      const res = await fetch(`/api/user/meal-prep-groups/${groupId}/recipes/${recipeSlug}`, {
        method: "DELETE",
      });
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

// ── Group totals ──────────────────────────────────────────────────────────────

function GroupTotals({ recipes, days, calorieGoal }: Readonly<{ recipes: MealPrepGroupRecipeEntry[]; days: number; calorieGoal: number | null }>) {
  let kcal = 0, protein = 0, fat = 0, carbs = 0;
  let hasData = false;

  for (const entry of recipes) {
    const base = entry.recipe?.nutritionTotals?.perServing;
    if (!base) continue;
    hasData = true;
    const entryKcal = entry.kcalOverride ?? base.kcal ?? 0;
    kcal += entryKcal * entry.servings;
    protein += (entry.proteinOverride ?? base.protein ?? 0) * entry.servings;
    fat += (entry.fatOverride ?? base.fat ?? 0) * entry.servings;
    carbs += (entry.carbsOverride ?? base.carbs ?? 0) * entry.servings;
  }

  if (!hasData) return null;

  const d = Math.max(1, days);
  const perDayKcal = Math.round(kcal / d);
  const goalPct = calorieGoal ? Math.min(100, Math.round((perDayKcal / calorieGoal) * 100)) : null;

  return (
    <div className="px-4 py-3 border-t border-white/10 flex flex-col gap-2">
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

