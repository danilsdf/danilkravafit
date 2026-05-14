"use client";

import { useState } from "react";
import type { SavedProgramItem } from "./types";

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TrainingProgramsProps {
  loading: boolean;
  items: SavedProgramItem[];
  onDelete: (id: string) => void;
}

export default function TrainingPrograms({ loading, items, onDelete }: Readonly<TrainingProgramsProps>) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/user/saved-programs/${id}`, { method: "DELETE" });
      onDelete(id);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <p className="text-sm text-white/30">Loading…</p>;
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-white/30 mb-3">No saved training programs yet.</p>
        <a
          href="/tool/training-program-generator"
          className="inline-block text-xs font-bold uppercase tracking-widest px-5 py-2.5 border border-white/15 text-white/50 hover:text-white hover:border-white/40 rounded-xl transition"
        >
          Generate a Program
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4" id="programs">
      {items.map((item) => {
        const totalWeeks = item.program.weeklySchedule.length;
        const totalWorkouts = item.program.weeklySchedule.reduce(
          (sum, w) => sum + w.workouts.filter((wo) => wo.workoutType !== "rest").length,
          0
        );
        return (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{item.program.programTitle}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-xs text-yellow-400/80 font-medium">{item.program.goal}</span>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/50">{item.program.duration}</span>
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/50">{item.program.experienceLevel}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-xs text-white/30">{totalWeeks} weeks · {totalWorkouts} workouts</span>
                  {item.programStartDate && (
                    <>
                      <span className="text-xs text-white/30">·</span>
                      <span className="text-xs text-white/30">
                        Starts {formatDateShort(item.programStartDate)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/tool/training-program-generator"
                  className="text-xs text-white/40 hover:text-white transition border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 font-medium"
                >
                  Open
                </a>
                <button
                  type="button"
                  disabled={deleting === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-white/20 hover:text-red-400 transition disabled:opacity-40 border border-white/10 hover:border-red-500/30 rounded-lg px-3 py-1.5"
                >
                  {deleting === item.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
