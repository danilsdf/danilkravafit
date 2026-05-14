"use client";

import Link from "next/link";
import type { SavedPlanItem } from "./types";

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SavedMealPrepsProps {
  loading: boolean;
  items: SavedPlanItem[];
}

export default function SavedMealPreps({ loading, items }: Readonly<SavedMealPrepsProps>) {
  if (loading) return <p className="text-sm text-white/30">Loading…</p>;
  if (items.length === 0) return <p className="text-sm text-white/30">No saved meal prep plans yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Link
          key={item.plan.id}
          href={`/meal-prep-plan/${item.plan.id}`}
          className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
        >
          <img
            src={item.plan.imageUrl ?? "/home-page/results/meal-prep.jpg"}
            alt={item.plan.title}
            className="h-14 w-14 rounded-lg object-cover shrink-0 border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">
                {formatDateShort(item.plan.startDate)} – {formatDateShort(item.plan.endDate)}
              </span>
              {item.plan.isCurrentWeek && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">Current week</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-orange-400 font-semibold">{item.plan.calories} kcal</span>
              <span className="text-xs text-blue-400">{item.plan.protein}g P</span>
              <span className="text-xs text-purple-400">{item.plan.fat}g F</span>
              <span className="text-xs text-amber-400">{item.plan.carbs}g C</span>
            </div>
          </div>
          <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
