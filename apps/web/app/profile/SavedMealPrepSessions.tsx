"use client";

import Link from "next/link";
import type { MealPrepSessionItem } from "./types";

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface SavedMealPrepSessionsProps {
  loading: boolean;
  items: MealPrepSessionItem[];
  onDelete: (id: string) => void;
}

export default function SavedMealPrepSessions({
  loading,
  items,
  onDelete,
}: Readonly<SavedMealPrepSessionsProps>) {
  if (loading) return <p className="text-sm text-white/30">Loading…</p>;
  if (items.length === 0)
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-sm text-white/30">No saved meal prep sessions yet.</p>
        <Link
          href="/tool/meal-prep-helper"
          className="px-5 py-2 rounded-xl bg-yellow-500 text-sm font-bold text-white hover:bg-yellow-600 transition"
        >
          Create one
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item._id}
          className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{item.title}</div>
            <div className="flex flex-wrap gap-3 mt-1">
              <span className="text-xs text-orange-400 font-semibold">{item.calorieGoal} kcal/day</span>
              <span className="text-xs text-neutral-400">{item.days} days</span>
              <span className="text-xs text-blue-400">P {item.macros.protein}%</span>
              <span className="text-xs text-purple-400">F {item.macros.fat}%</span>
              <span className="text-xs text-amber-400">C {item.macros.carbs}%</span>
              <span className="text-xs text-white/25">· {item.ingredients.length} ingredients</span>
            </div>
            <div className="text-[11px] text-white/20 mt-1">Updated {formatDate(item.updatedAt)}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/tool/meal-prep-helper?session=${item._id}`}
              className="px-3 py-1.5 rounded-lg bg-yellow-500 text-xs font-bold text-white hover:bg-yellow-600 transition"
            >
              Edit
            </Link>
            <DeleteButton id={item._id} onDelete={onDelete} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteButton({
  id,
  onDelete,
}: Readonly<{ id: string; onDelete: (id: string) => void }>) {
  async function handleDelete() {
    const res = await fetch(`/api/meal-prep-sessions/${id}`, { method: "DELETE" });
    if (res.ok) onDelete(id);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition"
      aria-label="Delete session"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
