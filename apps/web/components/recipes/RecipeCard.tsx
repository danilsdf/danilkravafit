"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecipeRecord } from "@/app/data/models/recipe";
import SaveToGroupModal from "@/components/MealPrepGroups/SaveToGroupModal";

export default function RecipeCard({ recipe }: Readonly<{ recipe: RecipeRecord }>) {
  const macros = recipe.nutritionTotals?.perServing;
  const tags = recipe.tags ?? [];
  const href = `/recipe/${recipe.slug}`;
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const slug = recipe.slug;
    function containsSlug(g: { recipes: { recipeSlug: string }[] }) {
      return g.recipes?.some((r) => r.recipeSlug === slug);
    }
    fetch("/api/user/meal-prep-groups")
      .then((r) => (r.ok ? r.json() : []))
      .then((groups: { recipes: { recipeSlug: string }[] }[]) => {
        if (Array.isArray(groups)) setIsSaved(groups.some(containsSlug));
      })
      .catch(() => {});
  }, [recipe.slug]);

  return (
    <>
    <Link
      href={href}
      className="
        group
        grid grid-cols-1 gap-4
        sm:grid-cols-[128px_1fr] sm:items-start
        lg:grid-cols-[150px_1fr_140px] lg:items-center
        rounded-2xl border border-slate-200
        bg-white
        shadow-sm
        dark:border-white/10
        dark:bg-[#171c25]
        dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_26px_rgba(0,0,0,0.45)]
        transition duration-200
        hover:bg-slate-50 hover:-translate-y-[2px]
        dark:hover:bg-[#1A2236]
        px-4 py-4
      "
    >
      {/* Image */}
      <div className="h-[180px] w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-[#0F1424] dark:ring-white/5 sm:h-[128px] sm:w-[128px] lg:h-[144px] lg:w-[144px]">
        <img
          src={
            recipe.imageUrl ??
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"
          }
          alt={recipe.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Middle content */}
      <div className="min-w-0 self-start">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-800 dark:text-[#E5E7EB] sm:truncate">
            {recipe.title}
          </h2>
          <span className="text-slate-500 dark:text-[#9CA3AF]">
            {recipe.servings} {recipe.servings === 1 ? (recipe.servingUnit ?? "serving") : `${recipe.servingUnit ?? "serving"}s`}
          </span>
        </div>

        {/* Macro pills */}
        <div className="mt-2 flex flex-wrap gap-2">
          {macros?.protein != null && (
            <span className="rounded-md bg-blue-100 px-2.5 py-1 text-[14px] font-semibold text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20">
              {Math.round(macros.protein)}g protein
            </span>
          )}
          {macros?.fat != null && (
            <span className="rounded-md bg-violet-100 px-2.5 py-1 text-[14px] font-semibold text-violet-600 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-300/20">
              {Math.round(macros.fat)}g fat
            </span>
          )}
          {macros?.carbs != null && (
            <span className="rounded-md bg-amber-100 px-2.5 py-1 text-[14px] font-semibold text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-300/20">
              {Math.round(macros.carbs)}g carbs
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] text-slate-500 dark:bg-white/5 dark:text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="flex h-full flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-1 lg:flex-col lg:items-end lg:justify-between lg:gap-0">
        <div className="text-[14px]">
          <span className="font-semibold text-slate-500 dark:text-[#6d737f]">Calories: </span>
          <span className="font-bold">
            {macros?.kcal == null ? "–" : Math.round(macros.kcal)}
          </span>
        </div>

        <button
          className="
            w-full rounded-2xl bg-blue-100 px-8 py-2 sm:w-auto
            text-[14px] font-semibold text-blue-700
            shadow-sm ring-1 ring-blue-200
            dark:bg-blue-500/20 dark:text-white dark:ring-white/10
            transition text-nowrap
            hover:bg-blue-500 hover:text-white
          "
          type="button"
        >
          View Recipe
        </button>

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGroupModal(true); }}
          title={isSaved ? "Saved to a group" : "Save to Meal Prep Group"}
          className={[
            "flex items-center gap-1.5 w-full justify-center rounded-2xl px-4 py-2 sm:w-auto",
            "text-[13px] font-semibold transition text-nowrap",
            isSaved
              ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20 cursor-default"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white",
          ].join(" ")}
        >
          {isSaved ? (
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
          {isSaved ? "Saved" : "Save to Group"}
        </button>
      </div>
    </Link>

    {showGroupModal && (
      <SaveToGroupModal
        recipeSlug={recipe.slug}
        recipeTitle={recipe.title}
        onClose={() => { setShowGroupModal(false); setIsSaved(true); }}
      />
    )}
    </>
  );
}
