"use client";

// ─────────────────────────────────────────────────────────────────────────────

export type MacroAdjustTarget = "protein" | "carbs" | "fat" | "all";
export type MacroOverrides = { kcal: number; protein: number; carbs: number; fat: number };

export function computeAdjustOverrides(
  base: { kcal: number; protein: number; carbs: number; fat: number },
  targetKcal: number,
  macro: MacroAdjustTarget,
): MacroOverrides | null {
  if (targetKcal <= 0) return null;
  if (macro === "all") {
    const s = base.kcal > 0 ? targetKcal / base.kcal : 1;
    return {
      kcal: targetKcal,
      protein: Math.round(base.protein * s * 10) / 10,
      carbs: Math.round(base.carbs * s * 10) / 10,
      fat: Math.round(base.fat * s * 10) / 10,
    };
  }
  let fixedKcal: number;
  let divisor: number;
  if (macro === "fat") {
    fixedKcal = base.protein * 4 + base.carbs * 4;
    divisor = 9;
  } else if (macro === "carbs") {
    fixedKcal = base.protein * 4 + base.fat * 9;
    divisor = 4;
  } else {
    fixedKcal = base.carbs * 4 + base.fat * 9;
    divisor = 4;
  }
  const remainingKcal = targetKcal - fixedKcal;
  if (remainingKcal < 0) return null;
  const newMacroG = Math.round((remainingKcal / divisor) * 10) / 10;
  if (macro === "protein") return { kcal: targetKcal, protein: newMacroG, carbs: base.carbs, fat: base.fat };
  if (macro === "carbs") return { kcal: targetKcal, protein: base.protein, carbs: newMacroG, fat: base.fat };
  return { kcal: targetKcal, protein: base.protein, carbs: base.carbs, fat: newMacroG };
}

export interface AdjustStepModalProps {
  adjustBase: { kcal: number; protein: number; carbs: number; fat: number };
  adjustKcal: string;
  setAdjustKcal: (v: string) => void;
  adjustMacro: MacroAdjustTarget;
  setAdjustMacro: (v: MacroAdjustTarget) => void;
  /** Label for the left "no-adjustment" button. Default: "Save as-is" */
  saveAsIsLabel?: string;
  /** Label for the right "apply" button. Default: "Continue" */
  continueLabel?: string;
  onClose: () => void;
  onSaveAsIs: () => void;
  onContinue: (overrides: MacroOverrides) => void;
}

export function AdjustStepModal({
  adjustBase,
  adjustKcal,
  setAdjustKcal,
  adjustMacro,
  setAdjustMacro,
  saveAsIsLabel = "Save as-is",
  continueLabel = "Continue",
  onClose,
  onSaveAsIs,
  onContinue,
}: Readonly<AdjustStepModalProps>) {
  const adjustTargetNum = Number.parseFloat(adjustKcal);
  const adjustValid = !Number.isNaN(adjustTargetNum) && adjustTargetNum > 0;
  const adjustPreview = adjustValid ? computeAdjustOverrides(adjustBase, adjustTargetNum, adjustMacro) : null;
  const adjustInvalid = adjustValid && adjustPreview === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-black/60 cursor-default"
        onClick={onClose}
      />
      <dialog open aria-modal className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#171c25] p-6 shadow-2xl">
        <h2 className="text-lg font-extrabold text-white mb-1">Adjust calories</h2>
        <p className="text-sm text-white/40 mb-4">Set a target calorie amount — choose which macro absorbs the difference.</p>

        <div className="flex flex-wrap gap-2 mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-white/40 w-full mb-0.5">Original per serving</span>
          <span className="text-xs rounded-full bg-orange-400/10 text-orange-400 px-2.5 py-1">{Math.round(adjustBase.kcal)} kcal</span>
          <span className="text-xs rounded-full bg-blue-400/10 text-blue-400 px-2.5 py-1">{Math.round(adjustBase.protein)}g protein</span>
          <span className="text-xs rounded-full bg-amber-400/10 text-amber-400 px-2.5 py-1">{Math.round(adjustBase.carbs)}g carbs</span>
          <span className="text-xs rounded-full bg-purple-400/10 text-purple-400 px-2.5 py-1">{Math.round(adjustBase.fat)}g fat</span>
        </div>

        <label
          className="text-xs font-semibold uppercase tracking-wide text-white/40 block mb-1"
          htmlFor="adj-kcal"
        >
          Target kcal per serving
        </label>
        <input
          id="adj-kcal"
          type="number"
          min={1}
          value={adjustKcal}
          onChange={(e) => setAdjustKcal(e.target.value)}
          placeholder={String(Math.round(adjustBase.kcal))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 mb-4"
        />

        <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">Adjust via</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(["protein", "carbs", "fat", "all"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setAdjustMacro(m)}
              className={[
                "rounded-xl py-2 text-xs font-semibold capitalize transition border",
                adjustMacro === m
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white",
              ].join(" ")}
            >
              {m === "all" ? "Scale all" : m}
            </button>
          ))}
        </div>

        {adjustPreview && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/40 w-full mb-0.5">Preview</span>
            <span className="text-xs rounded-full bg-orange-400/10 text-orange-400 px-2.5 py-1">{Math.round(adjustPreview.kcal)} kcal</span>
            <span className={`text-xs rounded-full px-2.5 py-1 ${adjustPreview.protein === adjustBase.protein ? "bg-blue-400/10 text-blue-400" : "bg-blue-400/20 text-blue-300 ring-1 ring-blue-400/30"}`}>{adjustPreview.protein}g protein</span>
            <span className={`text-xs rounded-full px-2.5 py-1 ${adjustPreview.carbs === adjustBase.carbs ? "bg-amber-400/10 text-amber-400" : "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30"}`}>{adjustPreview.carbs}g carbs</span>
            <span className={`text-xs rounded-full px-2.5 py-1 ${adjustPreview.fat === adjustBase.fat ? "bg-purple-400/10 text-purple-400" : "bg-purple-400/20 text-purple-300 ring-1 ring-purple-400/30"}`}>{adjustPreview.fat}g fat</span>
          </div>
        )}
        {adjustInvalid && (
          <p className="text-xs text-red-400 mb-4">Target too low — results in negative {adjustMacro}.</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSaveAsIs}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            {saveAsIsLabel}
          </button>
          <button
            type="button"
            disabled={!adjustPreview}
            onClick={() => { if (adjustPreview) onContinue(adjustPreview); }}
            className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition disabled:opacity-40"
          >
            {continueLabel}
          </button>
        </div>
      </dialog>
    </div>
  );
}
