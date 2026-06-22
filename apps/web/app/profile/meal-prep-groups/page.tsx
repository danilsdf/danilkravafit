"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeHeader from "@/components/headers/HomeHeader";
import MainFooter from "@/components/footer/MainFooter";
import MealPrepGroups from "@/app/profile/MealPrepGroups";
import type { MealPrepGroupItem } from "@/app/profile/types";

export default function MealPrepGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<MealPrepGroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/meal-prep-groups")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.ok ? r.json() : [];
      })
      .then((data) => {
        if (data) setGroups(Array.isArray(data) ? data : []);
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
            {" / "}Meal Prep Groups
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight mb-8">
            Meal Prep Groups
            {!loading && groups.length > 0 && (
              <span className="ml-2 text-base font-normal text-white/30">({groups.length})</span>
            )}
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="w-6 h-6 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <MealPrepGroups
              loading={false}
              items={groups}
              onDelete={(id) => setGroups((prev) => prev.filter((g) => g._id !== id))}
              onUpdate={(updated) =>
                setGroups((prev) => prev.map((g) => (g._id === updated._id ? updated : g)))
              }
            />
          )}
        </div>
      </main>
      <MainFooter />
    </>
  );
}
