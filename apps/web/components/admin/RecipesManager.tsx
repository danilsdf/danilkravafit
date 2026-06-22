"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { RecipeRecord as Recipe, RecipeIngredientLineRecord, RecipeStatus, InstructionBlock } from "@/app/data/models/recipe";
import type { IngredientRecord } from "@/app/data/models/ingredient";
import { ImageUpload } from "./ImageUpload";

type FormState = {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  tags: string; // comma-separated in form
  servings: number;
  servingUnit: string;
  status: RecipeStatus;
  ingredients: RecipeIngredientLineRecord[];
  instructions: InstructionBlock[];
};

const defaultForm = (): FormState => ({
  title: "",
  slug: "",
  description: "",
  imageUrl: "",
  tags: "",
  servings: 1,
  servingUnit: "",
  status: "draft",
  ingredients: [],
  instructions: [],
});

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-500/10 text-green-400 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  archived: "bg-white/5 text-white/30 border-white/10",
};

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

function IngredientLineRow({
  line,
  allIngredients,
  onChange,
  onRemove,
}: Readonly<{
  line: RecipeIngredientLineRecord;
  allIngredients: IngredientRecord[];
  onChange: (updated: RecipeIngredientLineRecord) => void;
  onRemove: () => void;
}>) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={line.ingredientId}
        onChange={(e) => onChange({ ...line, ingredientId: e.target.value })}
        className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none transition"
      >
        <option value="">Select ingredient…</option>
        {allIngredients.map((ing) => (
          <option key={ing._id} value={ing._id}>{ing.name}{ing.brand ? ` (${ing.brand})` : ""}</option>
        ))}
      </select>
      <input
        type="number"
        step="0.1"
        value={line.quantity ?? ""}
        onChange={(e) => onChange({ ...line, quantity: e.target.value === "" ? null : Number.parseFloat(e.target.value) })}
        placeholder="qty"
        className="w-20 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
      />
      <input
        type="text"
        value={line.unit}
        onChange={(e) => onChange({ ...line, unit: e.target.value })}
        placeholder="unit"
        className="w-20 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
      />
      <input
        type="text"
        value={line.note ?? ""}
        onChange={(e) => onChange({ ...line, note: e.target.value || null })}
        placeholder="note"
        className="w-28 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
      />
      <button
        type="button"
        onClick={onRemove}
        className="px-2.5 py-2 text-xs border border-red-500/25 text-red-400/70 rounded-lg hover:border-red-500/50 hover:text-red-400 transition"
      >
        ✕
      </button>
    </div>
  );
}

function InstructionBlockEditor({
  block,
  onChange,
  onRemove,
}: Readonly<{
  block: InstructionBlock;
  onChange: (updated: InstructionBlock) => void;
  onRemove: () => void;
}>) {
  const stepKeyCounter = useRef(block.steps.length);
  const [stepKeys, setStepKeys] = useState<number[]>(() => block.steps.map((_, i) => i));

  function updateStep(stepIdx: number, value: string) {
    const steps = [...block.steps];
    steps[stepIdx] = value;
    onChange({ ...block, steps });
  }

  function addStep() {
    onChange({ ...block, steps: [...block.steps, ""] });
    setStepKeys((ks) => [...ks, ++stepKeyCounter.current]);
  }

  function removeStep(stepIdx: number) {
    onChange({ ...block, steps: block.steps.filter((_, i) => i !== stepIdx) });
    setStepKeys((ks) => ks.filter((_, i) => i !== stepIdx));
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={block.section}
          onChange={(e) => onChange({ ...block, section: e.target.value })}
          placeholder="Section name (e.g. Prep, Cook)"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm font-semibold text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
        />
        <button
          type="button"
          onClick={onRemove}
          className="px-2.5 py-2 text-xs border border-red-500/25 text-red-400/70 rounded-lg hover:border-red-500/50 hover:text-red-400 transition"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 pl-2">
        {block.steps.map((step, stepIdx) => (
          <div key={stepKeys[stepIdx]} className="flex items-start gap-2">
            <span className="text-xs text-white/30 mt-2.5 w-4 shrink-0">{stepIdx + 1}.</span>
            <textarea
              value={step}
              onChange={(e) => updateStep(stepIdx, e.target.value)}
              placeholder="Step description…"
              rows={2}
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition resize-none"
            />
            <button
              type="button"
              onClick={() => removeStep(stepIdx)}
              className="mt-1 px-2 py-1.5 text-xs border border-white/10 text-white/30 rounded-lg hover:border-red-500/40 hover:text-red-400 transition"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStep}
          className="text-xs text-white/35 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1 rounded-lg transition"
        >
          + Add step
        </button>
      </div>
    </div>
  );
}

export default function RecipesManager() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<Recipe | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [allIngredients, setAllIngredients] = useState<IngredientRecord[]>([]);
  const ingKeyCounter = useRef(0);
  const [ingKeys, setIngKeys] = useState<number[]>([]);
  const blockKeyCounter = useRef(0);
  const [blockKeys, setBlockKeys] = useState<number[]>([]);

  function nextIngKey() { return ++ingKeyCounter.current; }
  function nextBlockKey() { return ++blockKeyCounter.current; }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recipes");
      setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/admin/ingredients")
      .then((r) => r.json())
      .then(setAllIngredients)
      .catch(() => {});
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setForm(defaultForm());
    setIngKeys([]);
    setBlockKeys([]);
    setEditItem(null);
    setFormError("");
    setModal("create");
  }

  function openEdit(item: Recipe) {
    const iKeys = (item.ingredients ?? []).map(() => nextIngKey());
    const bKeys = (item.instructions ?? []).map(() => nextBlockKey());
    setIngKeys(iKeys);
    setBlockKeys(bKeys);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      tags: (item.tags ?? []).join(", "),
      servings: item.servings,
      servingUnit: item.servingUnit ?? "",
      status: item.status,
      ingredients: item.ingredients ?? [],
      instructions: item.instructions ?? [],
    });
    setEditItem(item);
    setFormError("");
    setModal("edit");
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
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        servings: Number(form.servings) || 1,
      };
      const url =
        modal === "edit"
          ? `/api/admin/recipes/${editItem?._id ?? ""}`
          : "/api/admin/recipes";
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

  async function handleToggleStatus(item: Recipe) {
    const nextStatus: RecipeStatus =
      item.status === "published" ? "archived" : "published";
    setTogglingId(item._id);
    try {
      await fetch(`/api/admin/recipes/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    load();
  }

  function addIngredientLine() {
    setField("ingredients", [
      ...form.ingredients,
      { ingredientId: "", quantity: null, unit: "g" },
    ]);
    setIngKeys((ks) => [...ks, nextIngKey()]);
  }

  function updateIngredientLine(idx: number, updated: RecipeIngredientLineRecord) {
    const next = [...form.ingredients];
    next[idx] = updated;
    setField("ingredients", next);
  }

  function removeIngredientLine(idx: number) {
    setField("ingredients", form.ingredients.filter((_, i) => i !== idx));
    setIngKeys((ks) => ks.filter((_, i) => i !== idx));
  }

  function addInstructionBlock() {
    setField("instructions", [...form.instructions, { section: "", steps: [""] }]);
    setBlockKeys((ks) => [...ks, nextBlockKey()]);
  }

  function updateInstructionBlock(idx: number, updated: InstructionBlock) {
    const next = [...form.instructions];
    next[idx] = updated;
    setField("instructions", next);
  }

  function removeInstructionBlock(idx: number) {
    setField("instructions", form.instructions.filter((_, i) => i !== idx));
    setBlockKeys((ks) => ks.filter((_, i) => i !== idx));
  }

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.slug.toLowerCase().includes(search.toLowerCase()) ||
      (i.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">
            Admin / Recipes
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Recipes</h1>
          <p className="text-sm text-white/40 mt-1">
            {items.length} total ·{" "}
            {items.filter((i) => i.status === "published").length} published
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition"
        >
          <span className="text-lg leading-none">+</span> New Recipe
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
          placeholder="Search by title, slug, tags…"
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
          Loading recipes…
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04]">
                <tr>
                  {["Title", "Slug", "Tags", "Servings", "Status", "Actions"].map(
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
                {filtered.map((item, i) => (
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
                      {item.slug}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(item.tags ?? []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10"
                          >
                            {t}
                          </span>
                        ))}
                        {(item.tags ?? []).length > 3 && (
                          <span className="text-xs text-white/30">
                            +{(item.tags ?? []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50">
                      {item.servings}
                      {item.servingUnit ? ` ${item.servingUnit}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[item.status]}`}
                      >
                        {item.status}
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
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item._id}
                          className={`px-2.5 py-1 text-xs border rounded-lg transition disabled:opacity-50 ${
                            item.status === "published"
                              ? "border-yellow-500/25 text-yellow-400/80 hover:border-yellow-500/50 hover:text-yellow-400"
                              : "border-green-500/25 text-green-400/80 hover:border-green-500/50 hover:text-green-400"
                          }`}
                        >
                          {item.status === "published" ? "Archive" : "Publish"}
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
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-white/25 text-sm"
                    >
                      {search ? "No recipes match your search." : "No recipes yet."}
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
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-neutral-900 z-10">
              <h2 className="font-bold text-base">
                {modal === "create" ? "New Recipe" : `Edit: ${editItem?.title}`}
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
                  if (modal === "create") setField("slug", slugify(v));
                }}
                placeholder="e.g. High-Protein Chicken Bowl"
              />
              <Field
                label="Slug *"
                value={form.slug}
                onChange={(v) => setField("slug", slugify(v))}
                placeholder="e.g. high-protein-chicken-bowl"
                hint="URL-friendly identifier — auto-generated from title"
              />
              <div>
                <label
                  htmlFor="desc-textarea"
                  className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5"
                >
                  Description
                </label>
                <textarea
                  id="desc-textarea"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Short description…"
                  rows={3}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition resize-none"
                />
              </div>
              <ImageUpload
                value={form.imageUrl}
                onChange={(v) => setField("imageUrl", v)}
              />
              <Field
                label="Tags"
                value={form.tags}
                onChange={(v) => setField("tags", v)}
                placeholder="high-protein, meal-prep, chicken"
                hint="Comma-separated"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Servings"
                  type="number"
                  value={form.servings}
                  onChange={(v) => setField("servings", Number.parseInt(v) || 1)}
                />
                <Field
                  label="Serving Unit"
                  value={form.servingUnit}
                  onChange={(v) => setField("servingUnit", v)}
                  placeholder="e.g. container"
                />
              </div>
              <div>
                <label
                  htmlFor="recipe-status"
                  className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5"
                >
                  Status
                </label>
                <select
                  id="recipe-status"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as RecipeStatus)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none transition"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Ingredients */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Ingredients</p>
                <div className="space-y-2">
                  {form.ingredients.map((line, idx) => (
                    <IngredientLineRow
                      key={ingKeys[idx]}
                      line={line}
                      allIngredients={allIngredients}
                      onChange={(updated) => updateIngredientLine(idx, updated)}
                      onRemove={() => removeIngredientLine(idx)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={addIngredientLine}
                    className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg transition"
                  >
                    + Add ingredient
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Instructions</p>
                <div className="space-y-3">
                  {form.instructions.map((block, idx) => (
                    <InstructionBlockEditor
                      key={blockKeys[idx]}
                      block={block}
                      onChange={(updated) => updateInstructionBlock(idx, updated)}
                      onRemove={() => removeInstructionBlock(idx)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={addInstructionBlock}
                    className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-lg transition"
                  >
                    + Add section
                  </button>
                </div>
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
                    return modal === "create" ? "Create Recipe" : "Save Changes";
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
