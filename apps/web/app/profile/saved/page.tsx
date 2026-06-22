"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeHeader from "@/components/headers/HomeHeader";
import MainFooter from "@/components/footer/MainFooter";

type AllSavedRecipe = {
  recipe: {
    title: string;
    slug: string;
    imageUrl?: string | null;
    servings: number;
    servingUnit?: string;
    nutritionTotals?: {
      perServing?: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null };
    };
  };
  groups: string[];
};

export default function AllSavedPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<AllSavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/meal-prep-groups/all-saved")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.ok ? r.json() : [];
      })
      .then((data) => {
        if (data) setRecipes(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

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
            {" / "}All Saved
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight mb-8">
            All Saved
            {!loading && recipes.length > 0 && (
              <span className="ml-2 text-base font-normal text-white/30">({recipes.length})</span>
            )}
          </h1>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <svg className="w-6 h-6 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}

          {!loading && recipes.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
              <p className="text-white/40 text-sm mb-3">No saved recipes yet.</p>
              <Link
                href="/recipes"
                className="inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                Browse recipes →
              </Link>
            </div>
          )}

          {!loading && recipes.length > 0 && (
            <div className="flex flex-col gap-2">
              {recipes.map(({ recipe, groups }) => {
                const macros = recipe.nutritionTotals?.perServing;
                return (
                  <Link
                    key={recipe.slug}
                    href={`/recipe/${recipe.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
                  >
                    <img
                      src={recipe.imageUrl ?? "/home-page/results/meal-prep.jpg"}
                      alt={recipe.title}
                      className="h-14 w-14 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition">
                        {recipe.title}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {macros?.kcal != null && <span className="text-xs text-orange-400">{Math.round(macros.kcal)} kcal</span>}
                        {macros?.protein != null && <span className="text-xs text-blue-400">{Math.round(macros.protein)}g P</span>}
                        {macros?.fat != null && <span className="text-xs text-purple-400">{Math.round(macros.fat)}g F</span>}
                        {macros?.carbs != null && <span className="text-xs text-amber-400">{Math.round(macros.carbs)}g C</span>}
                      </div>
                      {groups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groups.map((g) => (
                            <span
                              key={g}
                              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 rounded-full px-2 py-0.5"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <MainFooter />
    </>
  );
}
