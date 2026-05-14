"use client";

import Link from "next/link";
import type { SavedRecipeItem } from "./types";

interface SavedRecipesProps {
  loading: boolean;
  items: SavedRecipeItem[];
}

export default function SavedRecipes({ loading, items }: Readonly<SavedRecipesProps>) {
  if (loading) return <p className="text-sm text-white/30">Loading…</p>;
  if (items.length === 0) return <p className="text-sm text-white/30">No saved recipes yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const macros = item.recipe.nutritionTotals?.perServing ?? null;
        return (
          <Link
            key={item.recipe.slug}
            href={`/recipe/${item.recipe.slug}`}
            className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
          >
            <img
              src={item.recipe.imageUrl ?? "/home-page/results/meal-prep.jpg"}
              alt={item.recipe.title}
              className="h-14 w-14 rounded-lg object-cover shrink-0 border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{item.recipe.title}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {item.targetCalories != null && (
                  <span className="text-xs text-orange-400 font-semibold">{item.targetCalories} kcal target</span>
                )}
                {macros?.kcal != null && item.targetCalories == null && (
                  <span className="text-xs text-orange-400">{macros.kcal} kcal</span>
                )}
                {macros?.protein != null && <span className="text-xs text-blue-400">{macros.protein}g P</span>}
                {macros?.fat != null && <span className="text-xs text-purple-400">{macros.fat}g F</span>}
                {macros?.carbs != null && <span className="text-xs text-amber-400">{macros.carbs}g C</span>}
              </div>
            </div>
            <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
