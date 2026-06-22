// components/RecipeDetailBody.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/app/data/models/recipe";
import type { MealPrepPlan } from "@/app/data/models/meal-prep-plan";
import SaveToGroupModal from "@/components/MealPrepGroups/SaveToGroupModal";
import { AdjustStepModal, type MacroAdjustTarget, type MacroOverrides } from "@/components/MealPrepGroups/AdjustMacrosModal";

// ─────────────────────────────────────────────────────────────────────────────

type RecipeDetailBodyProps = {
  recipe: Recipe | null;
  onBack: () => void;
};

function getAdjustBase(recipe: Recipe): { kcal: number; protein: number; carbs: number; fat: number } | null {
  const n = recipe.nutritionTotals?.perServing ?? recipe.nutritionTotals?.perRecipe;
  if (!n?.kcal || n.kcal <= 0 || n.protein == null || n.carbs == null || n.fat == null) return null;
  return { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat };
}

export function RecipeDetailBody({ recipe, onBack }: Readonly<RecipeDetailBodyProps>) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isSavedToGroup, setIsSavedToGroup] = useState(false);
  const [showAdjustStep, setShowAdjustStep] = useState(false);
  const [adjustKcal, setAdjustKcal] = useState("");
  const [adjustMacro, setAdjustMacro] = useState<MacroAdjustTarget>("protein");
  const [groupOverrides, setGroupOverrides] = useState<MacroOverrides | null>(null);
  const [relatedPlans, setRelatedPlans] = useState<MealPrepPlan[]>([]);

  useEffect(() => {
    if (!recipe) return;
    const slug = recipe.slug;
    function containsSlug(g: { recipes: { recipeSlug: string }[] }) {
      return g.recipes?.some((r) => r.recipeSlug === slug);
    }
    fetch("/api/user/meal-prep-groups")
      .then((r) => (r.ok ? r.json() : []))
      .then((groups: { recipes: { recipeSlug: string }[] }[]) => {
        if (Array.isArray(groups)) setIsSavedToGroup(groups.some(containsSlug));
      })
      .catch(() => {});
  }, [recipe?.slug]);

  useEffect(() => {
    if (!recipe?._id) return;
    const recipeId = String(recipe._id);
    fetch("/api/meal-prep-plans")
      .then((r) => (r.ok ? r.json() : []))
      .then((plans: MealPrepPlan[]) => {
        if (!Array.isArray(plans)) return;
        const matching = plans.filter((p) =>
          Array.isArray(p.recipes) && p.recipes.some((e) => e.recipeId === recipeId)
        );
        setRelatedPlans(matching);
      })
      .catch(() => {});
  }, [recipe?._id]);

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-24 text-center text-red-600 dark:text-red-400">
        Recipe not found.
      </div>
    );
  }

  // Nutrition
  const macros = recipe.nutritionTotals?.perServing || recipe.nutritionTotals?.perRecipe || null;
  const adjustBase = getAdjustBase(recipe);
  const createdDate = recipe.createdAt
    ? new Date(recipe.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "";

  return (
    <main className="min-h-dvh from-slate-100 via-slate-100 to-slate-200">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-24 sm:px-6">
      {/* Back link + Save button */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-sky-400 transition hover:text-sky-300"
        >
          <span aria-hidden="true" className="text-sky-400 transition group-hover:text-sky-300">←</span>
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (adjustBase) {
                setAdjustKcal(String(Math.round(adjustBase.kcal)));
                setAdjustMacro("protein");
                setGroupOverrides(null);
                setShowAdjustStep(true);
              } else {
                setShowGroupModal(true);
              }
            }}
            title={isSavedToGroup ? "Saved to a group" : "Save to Meal Prep Group"}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border",
              isSavedToGroup
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                : "bg-transparent border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10",
            ].join(" ")}
          >
            {isSavedToGroup ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            {isSavedToGroup ? "Saved to group" : "Save to group"}
          </button>
        </div>
      </div>

      {showAdjustStep && adjustBase && (
        <AdjustStepModal
          adjustBase={adjustBase}
          adjustKcal={adjustKcal}
          setAdjustKcal={setAdjustKcal}
          adjustMacro={adjustMacro}
          setAdjustMacro={setAdjustMacro}
          onClose={() => setShowAdjustStep(false)}
          onSaveAsIs={() => { setGroupOverrides(null); setShowAdjustStep(false); setShowGroupModal(true); }}
          onContinue={(overrides) => { setGroupOverrides(overrides); setShowAdjustStep(false); setShowGroupModal(true); }}
        />
      )}

      {showGroupModal && recipe && (
        <SaveToGroupModal
          recipeSlug={recipe.slug}
          recipeTitle={recipe.title}
          overrides={groupOverrides}
          onClose={() => { setShowGroupModal(false); setIsSavedToGroup(true); }}
        />
      )}

      {/* TITLE + TAGS + DATE */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]" style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 10px 30px rgba(0,0,0,0.35)' }}>
        <h1 className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 sm:text-4xl text-center">
          {recipe.title}
        </h1>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {recipe.tags.map((tag) => (
              <span key={tag} className="rounded-full px-3 py-1 text-xs font-semibold tracking-wider bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {createdDate && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1">Created {createdDate}</span>}
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1">{recipe.servings} {recipe.servingUnit || "servings"}</span>
        </div>
      </section>

      {/* IMAGE (placeholder for now) */}
      <section className="mt-5">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-60 w-full rounded-2xl border border-slate-200 dark:border-slate-700 object-cover shadow-lg sm:h-72 md:h-96"
          />
        ) : (
          <div className="h-60 w-full rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900 shadow-lg sm:h-72 md:h-96" />
        )}
      </section>

      {/* DESCRIPTION */}
      {recipe.description && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25] dark:text-slate-300 sm:text-base">
          {recipe.description}
        </section>
      )}

      {/* MACROS & SERVINGS */}
      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Nutrition
          </h2>
          {macros ? (
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <li className="rounded-xl bg-sky-100 px-3 py-2 text-slate-700 dark:bg-sky-900/30 dark:text-slate-200">Calories: <span className="font-semibold text-sky-600 dark:text-sky-300">{macros.kcal ?? "-"}</span></li>
              <li className="rounded-xl bg-blue-100 px-3 py-2 text-slate-700 dark:bg-blue-900/30 dark:text-slate-200">Protein: <span className="font-semibold text-blue-600 dark:text-blue-300">{macros.protein ?? "-"}g</span></li>
              <li className="rounded-xl bg-amber-100 px-3 py-2 text-slate-700 dark:bg-amber-900/30 dark:text-slate-200">Carbs: <span className="font-semibold text-amber-600 dark:text-amber-300">{macros.carbs ?? "-"}g</span></li>
              <li className="rounded-xl bg-purple-100 px-3 py-2 text-slate-700 dark:bg-purple-900/30 dark:text-slate-200">Fat: <span className="font-semibold text-purple-600 dark:text-purple-300">{macros.fat ?? "-"}g</span></li>
            </ul>
          ) : (
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">No nutrition info</div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Servings
          </h2>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {recipe.servings} {recipe.servingUnit || "servings"}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Adjust ingredient quantities based on your target number of portions.</p>
        </div>
      </section>

      {/* INGREDIENTS */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]">
        <h2 className="mb-2 text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
          Ingredients
        </h2>
        <ul className="space-y-2">
          {Array.isArray(recipe.ingredients) && recipe.ingredients.map((line) => (
            <li key={`${line.ingredient?.name ?? "ing"}-${String(line.quantity ?? 0)}-${line.unit ?? ""}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-600 dark:border-slate-700 dark:bg-[#1f2937] dark:text-slate-300">
              {/* If populated, show ingredient name, else fallback */}
              <span className="font-medium text-slate-900 dark:text-white">{line.ingredient?.name ?? "Ingredient"}</span>
              {line.quantity !== null && (
                <span className="ml-2 text-slate-600 dark:text-slate-300">
                  {line.quantity} {line.unit}
                </span>
              )}
              {line.note && (
                <span className="ml-2 italic text-slate-500 dark:text-slate-400">({line.note})</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* INSTRUCTIONS */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]">
        <h2 className="mb-2 text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
          Instructions
        </h2>
        {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 ? (
          <div className="space-y-5">
            {recipe.instructions.map((block) => (
              <div key={block.section ?? block.steps[0]?.slice(0, 20) ?? "block"} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-[#1f2937]">
                {block.section && (
                  <div className="mb-1 text-sm font-semibold text-sky-600 dark:text-sky-300">
                    {block.section}
                  </div>
                )}
                <ol className="list-decimal pl-5 space-y-2">
                  {block.steps.map((step) => (
                    <li key={step.slice(0, 30)} className="text-sm text-slate-700 dark:text-slate-200 sm:text-base">
                      {step}
                    </li>
                  ))}
                </ol>
                {block.timing && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {block.timing.activeMin && <span>Active: {block.timing.activeMin} min. </span>}
                    {block.timing.minutes && <span>Total: {block.timing.minutes} min. </span>}
                    {block.timing.ovenC && <span>Oven: {block.timing.ovenC}&deg;C</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">No instructions provided.</div>
        )}
      </section>

      {/* FEATURED IN MEAL PREP PLANS */}
      {relatedPlans.length > 0 && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]">
          <h2 className="mb-3 text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
            Featured in Meal Prep Plans
          </h2>
          <ul className="space-y-2">
            {relatedPlans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/meal-prep-plan/${plan.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1f2937] dark:hover:bg-slate-700/60"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{plan.title}</span>
                  <span className="ml-4 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {plan.calories} kcal &middot; {plan.protein}g protein
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* MEAL PREP INFO */}
      {recipe.mealPrep && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#171c25]">
          <h2 className="mb-2 text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">
            Meal Prep Info
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {recipe.mealPrep.fridgeDays && (
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-[#1f2937]">Fridge: <span className="font-medium text-slate-900 dark:text-white">{recipe.mealPrep.fridgeDays} days</span></li>
            )}
            {recipe.mealPrep.freezerDays && (
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-[#1f2937]">Freezer: <span className="font-medium text-slate-900 dark:text-white">{recipe.mealPrep.freezerDays} days</span></li>
            )}
            {recipe.mealPrep.reheatNotes && (
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-[#1f2937]">Reheat: <span className="italic text-slate-500 dark:text-slate-400">{recipe.mealPrep.reheatNotes}</span></li>
            )}
          </ul>
        </section>
      )}
      </div>
    </main>
  );
}
