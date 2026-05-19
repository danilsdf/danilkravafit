import React, { useState } from "react";
import NutritionDashboardCard from "@/components/MealPrepHelper/NutritionDashboardCard";

interface SummaryScreenProps {
	calorieGoal: number;
	macros: { protein: number; fat: number; carbs: number };
	days: number;
	ingredients: { name: string; unit: string; amount: string }[];
	nutritionSummary: { totalKcal: number; totalProtein: number; totalCarbs: number; totalFat: number };
	totalGoal: { kcal: number; protein: number; fat: number; carbs: number };
	isWithinGoal: (actual: number, goal: number) => boolean;
	ingredientDB: any[];
	onBack: () => void;
	onBackCalories: () => void;
	// Save / update
	onSave?: (title: string) => Promise<void>;
	onUpdate?: (title: string) => Promise<void>;
	savedSessionId?: string | null;
	initialTitle?: string;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({
	calorieGoal,
	macros,
	days,
	ingredients,
	nutritionSummary,
	totalGoal,
	isWithinGoal,
	ingredientDB,
	onBack,
    onBackCalories,
	onSave,
	onUpdate,
	savedSessionId,
	initialTitle = "",
}) => {
	const [title, setTitle] = useState(initialTitle);
	const [saving, setSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

	async function handleSave() {
		if (!title.trim() || saving) return;
		setSaving(true);
		setSaveStatus("idle");
		try {
			if (savedSessionId && onUpdate) {
				await onUpdate(title.trim());
			} else if (onSave) {
				await onSave(title.trim());
			}
			setSaveStatus("saved");
		} catch {
			setSaveStatus("error");
		} finally {
			setSaving(false);
		}
	}

	function getIngredientNutrition(ing: { name: string; unit: string; amount: string }) {
		const db = (ingredientDB as any[]).find(i => i.name === ing.name);
		if (!db) return null;
		const conv = db.unitConversions.find((u: any) => u.unit === ing.unit);
		if (!conv) return null;
		const grams = parseFloat(ing.amount) * conv.grams;
		return {
			kcal: grams * db.kcalPer1g,
			protein: grams * db.proteinPer1g,
			carbs: grams * db.carbsPer1g,
			fat: grams * db.fatPer1g,
		};
	}

	return (
		<div className="max-w-xl mx-auto">
			<h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400 text-center">Meal Prep Results</h2>
			<div className="rounded">
                <NutritionDashboardCard
                    goalKcal={totalGoal.kcal / days}
                    intakeKcal={nutritionSummary.totalKcal / days}
                    burnedKcal={0}
                    showOverflow={true}
                    nutrients={{
                        protein: { currentG: nutritionSummary.totalProtein / days, targetG: totalGoal.protein / days },
                        fat: { currentG: nutritionSummary.totalFat / days, targetG: totalGoal.fat / days },
                        carbs: { currentG: nutritionSummary.totalCarbs / days, targetG: totalGoal.carbs / days },
                    }}
                    onBackCalories={onBackCalories}
                ></NutritionDashboardCard>
			</div>
			<div className="mb-6 mt-4 relative">
                <button
					type="button"
					className="absolute top-2 right-2 p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-700"
					title="Edit inventory"
					onClick={onBack}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-600 dark:text-yellow-400">
						<path d="M15.232 5.232a2.5 2.5 0 0 0-3.535 0l-7.071 7.07A2 2 0 0 0 4 15h3.5a.5.5 0 0 0 .5-.5V13a.5.5 0 0 1 .146-.354l7.07-7.07a2.5 2.5 0 0 0 0-3.535zM13.5 3.5a1.5 1.5 0 0 1 2.121 2.121l-1.06 1.06-2.12-2.12 1.06-1.06z" />
						<path d="M2 17.5A.5.5 0 0 1 2.5 17H17a.5.5 0 0 1 0 1H2.5a.5.5 0 0 1-.5-.5z" />
					</svg>
				</button>
				<div className="font-semibold mb-2">Inventory:</div>
				{(() => {
					const [showAll, setShowAll] = React.useState(false);
					const visibleIngredients = showAll ? ingredients : ingredients.slice(0, 3);
					return (
						<>
						<ul className="divide-y divide-neutral-300 dark:divide-neutral-700">
							{ingredients.length === 0 && (
								<li className="py-2 text-sm text-neutral-500">No ingredients added yet.</li>
							)}
							{visibleIngredients.map((ing, idx) => {
								const nut = getIngredientNutrition(ing);
								return (
									<li key={idx} className="py-2 flex flex-col text-sm">
										<div className="flex justify-between items-center">
											<span>{ing.name}</span>
											<span>{ing.amount} {ing.unit}</span>
										</div>
										{nut && (
											<div className="flex flex-wrap gap-4 text-xs text-neutral-500 mt-1 ml-2">
												<span>Kcal: {nut.kcal.toFixed(0)}</span>
												<span>Protein: {nut.protein.toFixed(1)}g</span>
												<span>Fat: {nut.fat.toFixed(1)}g</span>
												<span>Carbs: {nut.carbs.toFixed(1)}g</span>
											</div>
										)}
									</li>
								);
							})}
						</ul>
						{ingredients.length > 3 && (
							<button
								className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 underline"
								onClick={() => setShowAll(v => !v)}
							>
								{showAll ? 'Show less' : `Show all (${ingredients.length})`}
							</button>
						)}
					</>
					);
				})()}
			</div>
			<h3 className="text-lg font-bold mb-2 text-yellow-600 dark:text-yellow-400">Nutrition Summary(for {days} days)</h3>
			<div className="mb-4">
				{(() => {
					const over = (actual: number, goal: number) => actual > goal * 1.01;
					const getValueColor = (actual: number, goal: number) => over(actual, goal) ? "text-green-600" : "text-black dark:text-white";
					const renderRow = (label: string, actual: number, goal: number) => (
						<div className="flex justify-between">
							<span>{label}</span>
							<span>
								<span className={getValueColor(actual, goal)}>{actual.toFixed(0)}</span>
								<span className="text-neutral-400"> / </span>
								<span className="text-black dark:text-white">{goal.toFixed(0)}</span>
							</span>
						</div>
					);
					return (
						<>
							{renderRow("Total kcal:", nutritionSummary.totalKcal, totalGoal.kcal)}
							{renderRow("Protein (g):", nutritionSummary.totalProtein, totalGoal.protein)}
							{renderRow("Fat (g):", nutritionSummary.totalFat, totalGoal.fat)}
							{renderRow("Carbs (g):", nutritionSummary.totalCarbs, totalGoal.carbs)}
						</>
					);
				})()}
			</div>
			<div className="mb-4">
				{isWithinGoal(nutritionSummary.totalKcal, totalGoal.kcal) &&
					isWithinGoal(nutritionSummary.totalProtein, totalGoal.protein) &&
					isWithinGoal(nutritionSummary.totalFat, totalGoal.fat) &&
					isWithinGoal(nutritionSummary.totalCarbs, totalGoal.carbs) && (
						<div className="text-green-600 font-semibold">Your plan matches your goal! ✅</div>
				)}
				{(nutritionSummary.totalProtein > totalGoal.protein * 1.05) && (
					<div className="text-yellow-600 mt-2">Protein is over the goal by more than 5%. Consider removing some protein sources.</div>
				)}
				{(nutritionSummary.totalKcal > totalGoal.kcal * 1.05) && (
					<div className="text-yellow-600 mt-2">Calories are over the goal by more than 5%. Consider reducing portions.</div>
				)}
			</div>
			{(onSave || onUpdate) && (
				<div className="mt-6 mb-2 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4 flex flex-col gap-3">
					<div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
						{savedSessionId ? "Update saved meal prep" : "Save this meal prep"}
					</div>
					<input
						type="text"
						placeholder="Meal prep title…"
						value={title}
						onChange={e => { setTitle(e.target.value); setSaveStatus("idle"); }}
						className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
					/>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleSave}
							disabled={saving || !title.trim()}
							className="rounded-xl bg-yellow-500 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-yellow-600 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
						>
							{saving ? "Saving…" : savedSessionId ? "Update" : "Save"}
						</button>
						{saveStatus === "saved" && (
							<span className="text-sm text-green-600 dark:text-green-400">✓ {savedSessionId ? "Updated!" : "Saved!"}</span>
						)}
						{saveStatus === "error" && (
							<span className="text-sm text-red-500">Failed to save. Try again.</span>
						)}
					</div>
				</div>
			)}
			<button
				className="rounded bg-yellow-600 dark:bg-yellow-400 px-6 py-2 text-xs font-semibold text-white dark:text-black hover:bg-yellow-700 dark:hover:bg-yellow-300 justify-center transition mx-auto block"
				onClick={onBack}
			>Back to Inventory</button>
		</div>
	);
};

export default SummaryScreen;
