"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeHeader from "@/components/headers/HomeHeader";
import MainFooter from "@/components/footer/MainFooter";
import ProfileMain, { MembershipBadge } from "./ProfileMain";
import SavedMealPreps from "./SavedMealPreps";
import SavedRecipes from "./SavedRecipes";
import TrainingPrograms from "./TrainingPrograms";
import type { ProfileData, SavedPlanItem, SavedRecipeItem, SavedProgramItem } from "./types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedPlans, setSavedPlans] = useState<SavedPlanItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeItem[]>([]);
  const [savedPrograms, setSavedPrograms] = useState<SavedProgramItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [tab, setTab] = useState<"main" | "plans" | "recipes" | "programs">("main");

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data: ProfileData | null) => {
        if (!data) return;
        setProfile(data);
      })
      .finally(() => setLoading(false));

    Promise.all([
      fetch("/api/user/saved-plans").then((r) => r.ok ? r.json() : []),
      fetch("/api/user/saved-recipes").then((r) => r.ok ? r.json() : []),
      fetch("/api/user/saved-programs").then((r) => r.ok ? r.json() : []),
    ]).then(([plans, recipes, programs]) => {
      setSavedPlans(plans);
      setSavedRecipes(recipes);
      setSavedPrograms(programs);
    }).catch(() => {}).finally(() => setSavedLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <HomeHeader showTraining={false} />
      <main className="min-h-screen bg-neutral-950 text-white pt-28 pb-20 px-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
              <Link href="/" className="hover:text-white transition">Home</Link>
              {" / "}Profile
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-extrabold uppercase">
                {profile.fullName?.[0] ?? profile.email[0]}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{profile.fullName}</h1>
                <p className="text-sm text-white/40">{profile.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      profile.role === "Admin"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-white/5 text-white/30 border-white/10"
                    }`}
                  >
                    {profile.role}
                  </span>
                  {profile.membership?.status === "active" || profile.membership?.status === "trialing" ? (
                    <MembershipBadge tier={profile.membership.tier} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-white/10">
            {([
              ["main", "Main"],
              ["plans", "Saved Meal Plans"],
              ["recipes", "Saved Recipes"],
              ["programs", "Training Programs"],
            ] as const).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  "px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px",
                  tab === t
                    ? "border-white text-white"
                    : "border-transparent text-white/40 hover:text-white/70",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "main" && (
            <ProfileMain profile={profile} onProfileUpdate={(updated) => setProfile(updated)} />
          )}
          {tab === "plans" && (
            <SavedMealPreps loading={savedLoading} items={savedPlans} />
          )}
          {tab === "recipes" && (
            <SavedRecipes loading={savedLoading} items={savedRecipes} />
          )}
          {tab === "programs" && (
            <TrainingPrograms
              loading={savedLoading}
              items={savedPrograms}
              onDelete={(id) => setSavedPrograms((prev) => prev.filter((p) => p.id !== id))}
            />
          )}
        </div>
      </main>
      <MainFooter />
    </>
  );
}
