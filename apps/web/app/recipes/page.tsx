"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlansToolbar from "@/components/meal-prep-plans/PlansToolbar";
import RecipeCard from "@/components/recipes/RecipeCard";
import type { RecipeRecord } from "@/app/data/models/recipe";
import { useCurrentUser } from "@/lib/useCurrentUser";

type SortKey = "date" | "calories" | "protein";
type RecipeData = RecipeRecord & { createdAt: string };

function RecipesContent() {
  const sp = useSearchParams();
  const sortParam = sp.get("sort");
  const sort: SortKey =
    sortParam === "calories" || sortParam === "protein" || sortParam === "date"
      ? sortParam
      : "date";

  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useCurrentUser();

  const [showModal, setShowModal] = useState(false);
  const [recipesEmail, setRecipesEmail] = useState("");

  useEffect(() => {
    if (user?.email) setRecipesEmail(user.email);
  }, [user?.email]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleReceive() {
    if (!recipesEmail.includes("@")) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/send-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipesEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong.");
      }
      setSubmitted(true);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSubmitted(false);
    setRecipesEmail("");
    setSubmitError("");
  }

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data: unknown) => setRecipes(Array.isArray(data) ? (data as RecipeData[]) : []))
      .finally(() => setLoading(false));
  }, []);

  const sortedRecipes = useMemo(() => {
    const list = [...recipes];

    if (sort === "calories") {
      return list.sort(
        (a, b) =>
          (b.nutritionTotals?.perServing?.kcal ?? 0) -
          (a.nutritionTotals?.perServing?.kcal ?? 0)
      );
    }

    if (sort === "protein") {
      return list.sort(
        (a, b) =>
          (b.nutritionTotals?.perServing?.protein ?? 0) -
          (a.nutritionTotals?.perServing?.protein ?? 0)
      );
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [recipes, sort]);

  return (
    <main className="min-h-dvh text-slate-900 dark:text-[#F3F4F6]">
      <div className="mx-auto w-full max-w-6xl px-2 pb-16 pt-24 sm:px-6">
        <header className="mb-1 flex flex-col items-center text-center">
          <h1 className="text-[42px] font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
            Recipes
          </h1>
          <p className="text-base max-w-2xl text-slate-500 dark:text-[#9CA3AF] mb-10" style={{ fontSize: 16 }}>
            High-protein, meal-prep-friendly recipes to fuel your training and hit your macros.
          </p>
        </header>

        {/* High Protein Recipes Download CTA */}
        <div className="mb-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-lg text-emerald-900 dark:text-emerald-300">
              Download 10 high protein meal-prep-friendly recipes
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              Show your interest — and I&apos;ll keep adding more high protein meal-prep-friendly recipes to the site!
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-colors"
          >
            Download Free
          </button>
        </div>

        <div className="mb-8">
          <PlansToolbar />
        </div>

        {/* Cards Grid */}
        <section className="mt-4">
          {loading && (
            <div className="grid gap-6 grid-cols-1">
              {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((key) => (
                <div
                  key={key}
                  className="h-32 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          )}
          {!loading && sortedRecipes.length === 0 && (
            <p className="text-center text-slate-500 dark:text-[#9CA3AF] py-16">
              No recipes found yet. Check back soon!
            </p>
          )}
          {!loading && sortedRecipes.length > 0 && (
            <div className="grid gap-6 grid-cols-1">
              {sortedRecipes.map((recipe) => (
                <RecipeCard key={recipe._id} recipe={recipe} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recipes Download Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-8 w-full max-w-md shadow-xl relative">
            {submitted ? (
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your inbox! 🎉</p>
                <p className="text-slate-500 dark:text-[#9CA3AF] text-sm">The recipes are on their way to your email.</p>
                <button
                  onClick={closeModal}
                  className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Thank you for your interest!
                </h2>
                <p className="text-slate-500 dark:text-[#9CA3AF] text-sm mb-6">
                  I will add more recipes in future. Now get your High Protein Recipes.
                </p>
                <input
                  type="email"
                  value={recipesEmail}
                  onChange={(e) => setRecipesEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleReceive(); }}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                />
                {submitError && (
                  <p className="text-red-500 text-xs mb-3">{submitError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-3 text-sm font-medium text-slate-600 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReceive}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors"
                  >
                    {submitting ? "Sending…" : "Receive"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh text-slate-900 dark:text-[#F3F4F6]" />}>
      <RecipesContent />
    </Suspense>
  );
}
