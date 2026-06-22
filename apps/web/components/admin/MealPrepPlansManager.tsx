"use client";

import { useEffect, useState, useCallback } from "react";
import type { MealPrepPlan, MealPlanRecipeEntry } from "@/app/data/models/meal-prep-plan";
import { ImageUpload } from "./ImageUpload";

type RecipeOption = { _id: string; title: string };

type RecipeFormEntry = {
  type: MealPlanRecipeEntry["type"];
  order: number;
  recipeId: string;
};

type FormState = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  ingredientNames: string;
  isCurrentWeek: boolean;
  isActive: boolean;
  recipes: RecipeFormEntry[];
};

const defaultForm = (): FormState => ({
  id: "",
  title: "",
  startDate: "",
  endDate: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  imageUrl: "",
  ingredientNames: "",
  isCurrentWeek: false,
  isActive: true,
  recipes: [],
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
}: Readonly<{
  label: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}>) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
      />
      {hint && <p className="text-xs text-white/25 mt-1">{hint}</p>}
    </div>
  );
}

export default function MealPrepPlansManager() {
  const [items, setItems] = useState<MealPrepPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<MealPrepPlan | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [availableRecipes, setAvailableRecipes] = useState<RecipeOption[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meal-prep-plans");
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadRecipes = useCallback(async () => {
    if (availableRecipes.length > 0) return;
    setLoadingRecipes(true);
    try {
      const res = await fetch("/api/admin/recipes");
      const data: Array<{ _id: string; title: string }> = await res.json();
      setAvailableRecipes(data.map((r) => ({ _id: r._id, title: r.title })));
    } finally {
      setLoadingRecipes(false);
    }
  }, [availableRecipes.length]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addRecipeEntry() {
    const nextOrder =
      form.recipes.length > 0
        ? Math.max(...form.recipes.map((r) => r.order)) + 1
        : 1;
    setForm((f) => ({
      ...f,
      recipes: [...f.recipes, { type: "Breakfast", order: nextOrder, recipeId: "" }],
    }));
  }

  function removeRecipeEntry(idx: number) {
    setForm((f) => ({ ...f, recipes: f.recipes.filter((_, i) => i !== idx) }));
  }

  function updateRecipeEntry<K extends keyof RecipeFormEntry>(
    idx: number,
    key: K,
    value: RecipeFormEntry[K]
  ) {
    setForm((f) => ({
      ...f,
      recipes: f.recipes.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    }));
  }

  function openCreate() {
    setForm(defaultForm());
    setEditItem(null);
    setFormError("");
    setModal("create");
    loadRecipes();
  }

  function openEdit(item: MealPrepPlan) {
    setForm({
      id: item.id,
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      imageUrl: item.imageUrl ?? "",
      ingredientNames: (item.ingredientNames ?? []).join(", "),
      isCurrentWeek: item.isCurrentWeek ?? false,
      isActive: item.isActive ?? true,
      recipes: (item.recipes ?? []).map((r) => ({
        type: r.type,
        order: r.order,
        recipeId: r.recipeId,
      })),
    });
    setEditItem(item);
    setFormError("");
    setModal("edit");
    loadRecipes();
  }

  function closeModal() {
    setModal(null);
    setEditItem(null);
    setFormError("");
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        ingredientNames: form.ingredientNames
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      };
      const url =
        modal === "edit"
          ? `/api/admin/meal-prep-plans/${editItem?._id ?? ""}`
          : "/api/admin/meal-prep-plans";
      const method = modal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || "Failed to save.");
        return;
      }
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: MealPrepPlan) {
    setTogglingId(item._id);
    try {
      await fetch(`/api/admin/meal-prep-plans/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !(item.isActive ?? true) }),
      });
      load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/meal-prep-plans/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    load();
  }

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">
            Admin / Meal Prep Plans
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Meal Prep Plans</h1>
          <p className="text-sm text-white/40 mt-1">{items.length} total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition"
        >
          <span className="text-lg leading-none">+</span> New Plan
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search by title or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none transition"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-sm py-12">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading meal prep plans…
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04]">
                <tr>
                  {["Title", "ID", "Dates", "Cal/day", "P/C/F (g)", "Current Week", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/30 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const active = item.isActive ?? true;
                  return (
                    <tr
                      key={item._id}
                      className={`border-t border-white/5 transition hover:bg-white/[0.03] ${
                          i % 2 === 0 ? "" : "bg-white/[0.015]"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold whitespace-nowrap max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-white/40 font-mono text-xs whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="px-4 py-3 text-white/50 whitespace-nowrap text-xs">
                        {item.startDate || "—"}
                        {item.endDate ? ` → ${item.endDate}` : ""}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{item.calories}</td>
                      <td className="px-4 py-3 tabular-nums text-white/60 text-xs whitespace-nowrap">
                        {item.protein}g / {item.carbs}g / {item.fat}g
                      </td>
                      <td className="px-4 py-3">
                        {item.isCurrentWeek ? (
                          <span className="text-xs font-semibold text-blue-400">Yes</span>
                        ) : (
                          <span className="text-white/25 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            active
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-white/5 text-white/30 border-white/10"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-2.5 py-1 text-xs border border-white/15 rounded-lg text-white/60 hover:text-white hover:border-white/35 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggle(item)}
                            disabled={togglingId === item._id}
                            className={`px-2.5 py-1 text-xs border rounded-lg transition disabled:opacity-50 ${
                              active
                                ? "border-yellow-500/25 text-yellow-400/80 hover:border-yellow-500/50 hover:text-yellow-400"
                                : "border-green-500/25 text-green-400/80 hover:border-green-500/50 hover:text-green-400"
                            }`}
                          >
                            {active ? "Deactivate" : "Activate"}
                          </button>
                          {confirmDelete === item._id ? (
                            <>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-2.5 py-1 text-xs border border-white/15 rounded-lg text-white/50 hover:text-white transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(item._id)}
                              className="px-2.5 py-1 text-xs border border-red-500/25 text-red-400/70 rounded-lg hover:border-red-500/50 hover:text-red-400 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-white/25 text-sm"
                    >
                      {search ? "No plans match your search." : "No meal prep plans yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900 z-10">
              <h2 className="font-bold text-base">
                {modal === "create" ? "New Meal Prep Plan" : `Edit: ${editItem?.title}`}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Field
                label="Title *"
                value={form.title}
                onChange={(v) => {
                  setField("title", v);
                  if (modal === "create") setField("id", slugify(v));
                }}
                placeholder="e.g. Week 18 — High Protein Cut"
              />
              <Field
                label="ID *"
                value={form.id}
                onChange={(v) => setField("id", slugify(v))}
                placeholder="e.g. week-18-high-protein-cut"
                hint="URL-friendly identifier — auto-generated from title"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={(v) => setField("startDate", v)}
                />
                <Field
                  label="End Date"
                  type="date"
                  value={form.endDate}
                  onChange={(v) => setField("endDate", v)}
                />
              </div>

              <p className="text-xs text-white/30">Macros per day</p>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Calories"
                  type="number"
                  value={form.calories}
                  onChange={(v) => setField("calories", Number.parseInt(v) || 0)}
                />
                <Field
                  label="Protein (g)"
                  type="number"
                  value={form.protein}
                  onChange={(v) => setField("protein", Number.parseInt(v) || 0)}
                />
                <Field
                  label="Carbs (g)"
                  type="number"
                  value={form.carbs}
                  onChange={(v) => setField("carbs", Number.parseInt(v) || 0)}
                />
                <Field
                  label="Fat (g)"
                  type="number"
                  value={form.fat}
                  onChange={(v) => setField("fat", Number.parseInt(v) || 0)}
                />
              </div>

              <ImageUpload
                value={form.imageUrl}
                onChange={(v) => setField("imageUrl", v)}
              />
              <Field
                label="Ingredient Names"
                value={form.ingredientNames}
                onChange={(v) => setField("ingredientNames", v)}
                placeholder="Chicken Breast, Ground Turkey, Rice"
                hint="Comma-separated display list"
              />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isCurrentWeek}
                    onClick={() => setField("isCurrentWeek", !form.isCurrentWeek)}
                    className={`relative w-10 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-white/20 ${
                      form.isCurrentWeek ? "bg-blue-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.isCurrentWeek ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-white/70">Current Week</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => setField("isActive", !form.isActive)}
                    className={`relative w-10 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-white/20 ${
                      form.isActive ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.isActive ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-white/70">Active</span>
                </div>
              </div>

              {/* Recipes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                    Recipes
                  </p>
                  <button
                    type="button"
                    onClick={addRecipeEntry}
                    disabled={loadingRecipes}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/35 disabled:opacity-40 transition"
                  >
                    + Add Recipe
                  </button>
                </div>
                {loadingRecipes && (
                  <p className="text-xs text-white/30 py-1">Loading recipes…</p>
                )}
                {!loadingRecipes && form.recipes.length === 0 && (
                  <p className="text-xs text-white/25 py-2">No recipes added yet.</p>
                )}
                {!loadingRecipes && form.recipes.length > 0 && (
                  <div className="space-y-2">
                    {form.recipes.map((entry, idx) => {
                      const entryKey = `${entry.recipeId}-${idx}`;
                      return (
                        <div
                          key={entryKey}
                          className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10"
                        >
                          <select
                            value={entry.type}
                            onChange={(e) =>
                              updateRecipeEntry(idx, "type", e.target.value as RecipeFormEntry["type"])
                            }
                            className="rounded-lg bg-neutral-800 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none"
                          >
                            {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={entry.order}
                            title="Order"
                            onChange={(e) =>
                              updateRecipeEntry(idx, "order", Number(e.target.value) || 0)
                            }
                            className="w-14 rounded-lg bg-neutral-800 border border-white/10 px-2 py-1.5 text-xs text-white text-center focus:border-white/30 focus:outline-none"
                          />
                          <select
                            value={entry.recipeId}
                            onChange={(e) => updateRecipeEntry(idx, "recipeId", e.target.value)}
                            className="rounded-lg bg-neutral-800 border border-white/10 px-2 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none w-full"
                          >
                            <option value="">— Select recipe —</option>
                            {availableRecipes.map((r) => (
                              <option key={r._id} value={r._id}>{r.title}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeRecipeEntry(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {formError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 transition"
                >
                  {(() => {
                    if (saving) return "Saving…";
                    return modal === "create" ? "Create Plan" : "Save Changes";
                  })()}
                </button>
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-white/15 text-sm rounded-xl text-white/60 hover:text-white hover:border-white/35 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
