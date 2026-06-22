"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SaveToGroupModalProps {
  recipeSlug: string;
  recipeTitle: string;
  overrides?: { kcal?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null } | null;
  onClose: () => void;
}

interface GroupOption {
  _id: string;
  name: string;
  recipes: { recipeSlug: string }[];
}

interface GroupListContentProps {
  loading: boolean;
  groups: GroupOption[];
  savedGroups: Set<string>;
  saving: string | null;
  onSave: (groupId: string) => void;
}

function pluralRecipes(count: number): string {
  return count === 1 ? "1 recipe" : `${count} recipes`;
}

function groupButtonLabel(already: boolean, isSaving: boolean): string {
  if (already) return "Saved ✓";
  if (isSaving) return "…";
  return "Add";
}

function groupContainsRecipe(group: GroupOption, slug: string): boolean {
  return group.recipes?.some((r) => r.recipeSlug === slug) ?? false;
}

function GroupListContent({ loading, groups, savedGroups, saving, onSave }: Readonly<GroupListContentProps>) {
  if (loading) return <p className="text-sm text-white/30">Loading groups…</p>;
  if (groups.length === 0) return <p className="text-sm text-white/30">No groups yet. Create one above.</p>;

  return (
    <>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Existing Groups</p>
      {groups.map((group) => {
        const already = savedGroups.has(group._id);
        const isSaving = saving === group._id;
        const label = groupButtonLabel(already, isSaving);
        return (
          <div
            key={group._id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{group.name}</p>
              <p className="text-xs text-white/30">{pluralRecipes(group.recipes?.length ?? 0)}</p>
            </div>
            <button
              type="button"
              onClick={() => { if (!already) onSave(group._id); }}
              disabled={already || isSaving}
              className={[
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                already
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 cursor-default"
                  : "bg-white/10 text-white hover:bg-emerald-500 hover:text-white",
                isSaving ? "opacity-50" : "",
              ].join(" ")}
            >
              {label}
            </button>
          </div>
        );
      })}
    </>
  );
}

export default function SaveToGroupModal({ recipeSlug, recipeTitle, overrides, onClose }: Readonly<SaveToGroupModalProps>) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [authError, setAuthError] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  const [saving, setSaving] = useState<string | null>(null);
  const [savedGroups, setSavedGroups] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    fetch("/api/user/meal-prep-groups")
      .then((r) => {
        if (r.status === 401) { setAuthError(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const list: GroupOption[] = Array.isArray(data) ? data : [];
        setGroups(list);
        const alreadyIn = new Set<string>(
          list.filter((g) => groupContainsRecipe(g, recipeSlug)).map((g) => g._id)
        );
        setSavedGroups(alreadyIn);
      })
      .catch(() => setError("Failed to load groups."))
      .finally(() => setLoadingGroups(false));
  }, [recipeSlug]);

  async function handleSaveToGroup(groupId: string) {
    setSaving(groupId);
    setError(null);
    try {
      const res = await fetch(`/api/user/meal-prep-groups/${groupId}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeSlug,
          kcalOverride: overrides?.kcal ?? null,
          proteinOverride: overrides?.protein ?? null,
          carbsOverride: overrides?.carbs ?? null,
          fatOverride: overrides?.fat ?? null,
        }),
      });
      if (res.status === 409) {
        setSavedGroups((prev) => new Set(prev).add(groupId));
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save.");
        return;
      }
      setSavedGroups((prev) => new Set(prev).add(groupId));
    } catch {
      setError("Network error.");
    } finally {
      setSaving(null);
    }
  }

  async function handleCreateAndSave() {
    const name = newGroupName.trim();
    if (!name) return;
    setCreatingNew(true);
    setError(null);
    try {
      const res = await fetch("/api/user/meal-prep-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create group.");
        return;
      }
      const group: GroupOption = await res.json();
      setGroups((prev) => [group, ...prev]);
      setNewGroupName("");
      await handleSaveToGroup(group._id);
    } catch {
      setError("Network error.");
    } finally {
      setCreatingNew(false);
    }
  }

  const modalCard = authError ? (
    <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 p-6 text-center">
      <p className="text-white/70 mb-4">You need to be logged in to save recipes to a group.</p>
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition"
      >
        Log In
      </button>
    </div>
  ) : (
    <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white">Save to Meal Prep Group</h2>
          <p className="text-xs text-white/40 mt-0.5 truncate max-w-[220px]">{recipeTitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/30 hover:text-white/70 transition p-1"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 border-b border-white/10 shrink-0">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">New Group</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndSave(); }}
            placeholder="Group name…"
            maxLength={80}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
          />
          <button
            type="button"
            onClick={handleCreateAndSave}
            disabled={!newGroupName.trim() || creatingNew}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creatingNew ? "…" : "Create"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
        <GroupListContent
          loading={loadingGroups}
          groups={groups}
          savedGroups={savedGroups}
          saving={saving}
          onSave={handleSaveToGroup}
        />
      </div>

      {error && <p className="px-5 pb-4 text-sm text-red-400 shrink-0">{error}</p>}
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-0 h-full w-full max-w-none bg-transparent p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex h-full w-full items-center justify-center p-4">
        <button
          type="button"
          aria-label="Close dialog"
          className="absolute inset-0 cursor-default"
          onClick={onClose}
          tabIndex={-1}
        />
        <div className="relative z-10 w-full max-w-sm">
          {modalCard}
        </div>
      </div>
    </dialog>
  );
}
