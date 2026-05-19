import React, { useState } from "react";
import NutritionDashboardCard from "@/components/MealPrepHelper/NutritionDashboardCard";

interface Ingredient {
	name: string;
	unit: string;
	amount: string;
}

interface InventoryScreenProps {
	ingredients: Ingredient[];
	setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
	ingredientDB: any[];
	calorieGoal: number;
	macros: { protein: number; fat: number; carbs: number };
	days: number;
	onContinue: () => void;
	onBack: () => void;
}
export default function InventoryScreen({ ingredients, setIngredients, ingredientDB, calorieGoal, macros, days, onContinue, onBack }: InventoryScreenProps) {
	const [showModal, setShowModal] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
	const [unit, setUnit] = useState("");
	const [amount, setAmount] = useState("");

	const filteredIngredients = ingredientDB.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
	const [editingIdx, setEditingIdx] = useState<number | null>(null);

	const handleAdd = () => {
		setShowModal(true);
	};

	const handleModalAdd = () => {
		if (!selectedIngredient || !unit || !amount) return;
		// Blur any focused input to prevent iOS zoom lock
		if (typeof window !== "undefined" && document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		// Reset viewport scale on iOS
		const viewport = document.querySelector('meta[name=viewport]');
		if (viewport) {
			viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
			setTimeout(() => {
				viewport.setAttribute('content', 'width=device-width, initial-scale=1');
			}, 300);
		}
		setIngredients([    
			...ingredients,
			{ name: `${selectedIngredient}`, unit, amount }
		]);
		setShowModal(false);
		setSearch("");
		setSelectedIngredient(null);
		setUnit("");
		setAmount("");
	};

    const selectIngredient = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient.name);
        setUnit("g");
        setAmount("100");
    }

    const deselectIngredient = () => {
        setSelectedIngredient(null);
        setUnit("");
        setAmount("");
    }

	const totals = ingredients.reduce((acc, ing) => {
		const db = ingredientDB.find((i: any) => i.name === ing.name);
		const conv = db?.unitConversions.find((u: any) => u.unit === ing.unit);
		const grams = conv ? parseFloat(ing.amount) * conv.grams : 0;
		if (db && conv) {
			acc.kcal += grams * db.kcalPer1g;
			acc.protein += grams * db.proteinPer1g;
			acc.fat += grams * db.fatPer1g;
			acc.carbs += grams * db.carbsPer1g;
		}
		return acc;
	}, { kcal: 0, protein: 0, fat: 0, carbs: 0 });

	return (
		<div>
			<section className="mb-5 text-center">
				<h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Inventory</h2>
				<p className="text-sm text-neutral-700 dark:text-neutral-200">Add your available ingredients for the week.</p>
			</section>
			{/* Modal Popup */}
			{showModal && (
				<div
					className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
					onClick={() => { setShowModal(false); deselectIngredient(); }}
				>
				{/* Sheet */}
				<div
					className="
						relative w-full sm:max-w-md
						bg-white dark:bg-neutral-900
						rounded-t-3xl sm:rounded-2xl
						shadow-2xl
						p-6 pb-8
						flex flex-col gap-5
					"
					onClick={e => e.stopPropagation()}
				>
					{/* Close button */}
					<button
						className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
						onClick={() => { setShowModal(false); deselectIngredient(); }}
						aria-label="Close"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
						</svg>
					</button>

					{!selectedIngredient ? (
						<>
							<div>
								<h3 className="text-base font-bold text-neutral-900 dark:text-white">Add Ingredient</h3>
								<p className="text-xs text-neutral-400 mt-0.5">Search and select from your ingredient list</p>
							</div>

							{/* Search */}
							<div className="relative">
								<svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 20 20" fill="none">
									<circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
									<path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								</svg>
								<input
									type="text"
									placeholder="Search ingredients…"
									value={search}
									onChange={e => setSearch(e.target.value)}
									className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
									style={{ fontSize: 16 }}
									autoFocus
								/>
							</div>

							{/* Results */}
							<ul className="max-h-56 overflow-y-auto -mx-1 divide-y divide-neutral-100 dark:divide-neutral-800 scrollbar-thin">
								{filteredIngredients.length === 0 ? (
									<li className="py-6 text-center text-sm text-neutral-400">No ingredients found</li>
								) : (
									filteredIngredients.map(i => (
										<li
											key={i.name}
											className="flex items-center justify-between px-2 py-2.5 rounded-lg cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition group"
											onClick={() => selectIngredient(i)}
										>
											<span className="text-sm text-neutral-800 dark:text-neutral-100 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition">{i.name}</span>
											<svg className="text-neutral-300 group-hover:text-yellow-500 transition" width="14" height="14" viewBox="0 0 16 16" fill="none">
												<path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</li>
									))
								)}
							</ul>
						</>
					) : (
						<>
							<div>
								<h3 className="text-base font-bold text-neutral-900 dark:text-white">Set Amount</h3>
								{/* Selected ingredient pill */}
								<div className="mt-2 inline-flex items-center gap-2 rounded-full bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1">
									<span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{selectedIngredient}</span>
									<button
										className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition"
										onClick={deselectIngredient}
										aria-label="Change ingredient"
									>
										<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
											<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
										</svg>
									</button>
								</div>
							</div>

							{/* Amount + unit row */}
							<div className="flex gap-3">
								<div className="flex-1 flex flex-col gap-1">
									<label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Amount</label>
									<input
										type="number"
										min="0"
										value={amount}
										onChange={e => setAmount(e.target.value)}
										className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
										style={{ fontSize: 16 }}
									/>
								</div>
								<div className="flex-1 flex flex-col gap-1">
									<label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Unit</label>
									<select
										value={unit}
										onChange={e => setUnit(e.target.value)}
										className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2.5 text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
										style={{ fontSize: 16 }}
									>
										<option value="">Select unit</option>
										{ingredientDB.find(i => i.name === selectedIngredient)?.unitConversions.map((u: any) => (
											<option key={u.unit} value={u.unit}>{u.unit}</option>
										))}
									</select>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3 pt-1">
								<button
									className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
									onClick={() => { setShowModal(false); deselectIngredient(); }}
								>
									Cancel
								</button>
								<button
									className="flex-1 rounded-xl bg-yellow-500 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-yellow-600 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
									onClick={handleModalAdd}
									disabled={!unit || !amount}
								>
									Add
								</button>
							</div>
						</>
					)}
				</div>
			</div>
			)}
			<section className="mb-4">
				<div className="overflow-x-auto w-full">
					<table className="min-w-full text-sm border-separate border-spacing-y-1">
						<thead>
							<tr className="text-neutral-700 dark:text-neutral-200">
								<th className="text-left px-2 py-1">Ingredient</th>
								<th className="text-left px-2 py-1">Amount</th>
								<th className="text-left px-2 py-1">Kcal</th>
								<th className="text-center px-2 py-1">P/F/C</th>
								<th className="text-left px-2 py-1"> </th>
							</tr>
						</thead>
						<tbody>
							{ingredients.length === 0 && (
								<tr><td colSpan={5} className="py-2 text-neutral-500 text-center">No ingredients added yet.</td></tr>
							)}
							{ingredients.map((ing, idx) => {
								// Nutrition calculation (copied from SummaryScreen logic)
								const db = ingredientDB.find(i => i.name === ing.name);
								const conv = db?.unitConversions.find((u: any) => u.unit === ing.unit);
								const grams = conv ? parseFloat(ing.amount) * conv.grams : 0;
								const nut = db && conv ? {
									kcal: grams * db.kcalPer1g,
									protein: grams * db.proteinPer1g,
									fat: grams * db.fatPer1g,
									carbs: grams * db.carbsPer1g,
								} : null;
								return (
									<tr key={idx} className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
										<td className="px-2 py-1">{ing.name}</td>
										<td className="px-2 py-1">
											{editingIdx === idx ? (
												<input
												type="number"
												min="0"
												value={ing.amount}
												autoFocus
												onBlur={() => setEditingIdx(null)}
												onChange={e => {
													const newAmount = e.target.value;
													setIngredients((ings: Ingredient[]) => ings.map((item, i) => i === idx ? { ...item, amount: newAmount } : item));
												}}
												className="rounded border px-2 py-1 text-sm w-20 bg-neutral-50 dark:bg-neutral-900 text-neutral-500"
											/>
											) : (
											<span className="flex items-center">
												<span className="text-neutral-500 mr-1 text-nowrap">{ing.amount} {ing.unit}</span>
												<button
												type="button"
												className="p-1 text-neutral-400 hover:text-yellow-600 cursor-pointer transition"
												onClick={() => setEditingIdx(idx)}
												aria-label="Edit amount"
												>
												<svg width="16" height="16" fill="none" viewBox="0 0 16 16">
													<path d="M2 13.5V14h.5l9.06-9.06-1.5-1.5L2 13.5zM14.06 4.06a1 1 0 0 0 0-1.41l-1.71-1.71a1 1 0 0 0-1.41 0l-.88.88 3.12 3.12.88-.88z" fill="currentColor"/>
												</svg>
												</button>
											</span>
											)}
									</td>
									<td className="px-2 py-1">{nut ? nut.kcal.toFixed(0) : '-'}</td>
									<td className="px-2 py-1 text-center">{nut ? nut.protein.toFixed(1) : '-'}/{nut ? nut.fat.toFixed(1) : '-'}/{nut ? nut.carbs.toFixed(1) : '-'}</td>
									<td className="px-2 py-1">
										<button
											type="button"
											className="p-1 text-neutral-400 hover:text-yellow-600 cursor-pointer transition"
											onClick={() => {
												setIngredients((ings: Ingredient[]) => ings.filter((_, i) => i !== idx));
											}}
											aria-label="Remove ingredient"
											>
											<svg width="16" height="16" fill="none" viewBox="0 0 16 16">
												<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</button>
									</td>
								</tr>
							);
							})}
						</tbody>
						{ingredients.length > 0 && (
							<tfoot>
								<tr className="font-bold text-neutral-900 dark:text-white border-t-2 border-neutral-300 dark:border-neutral-600">
									<td className="px-2 py-2 text-yellow-700 dark:text-yellow-400">Total</td>
									<td className="px-2 py-2"></td>
									<td className="px-2 py-2">{totals.kcal.toFixed(0)}</td>
									<td className="px-2 py-2 text-center">{totals.protein.toFixed(1)}/{totals.fat.toFixed(1)}/{totals.carbs.toFixed(1)}</td>
									<td></td>
								</tr>
							</tfoot>
						)}
					</table>
					<div className="text-right">
						<button
							type="button"
							className="rounded bg-yellow-600 dark:bg-yellow-400 px-4 py-2 text-sm font-semibold text-white dark:text-black shadow hover:bg-yellow-700 dark:hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
							onClick={handleAdd}
						>
							+ Add Ingredient
						</button>
					</div>
				</div>
			</section>
			{ingredients.length > 0 && (
				<div className="mb-4">
					<NutritionDashboardCard
						goalKcal={calorieGoal}
						intakeKcal={totals.kcal / days}
						burnedKcal={0}
						showOverflow={true}
						showMenuDots={false}
						nutrients={{
							protein: { currentG: totals.protein / days, targetG: (macros.protein / 100) * calorieGoal / 4 },
							fat: { currentG: totals.fat / days, targetG: (macros.fat / 100) * calorieGoal / 9 },
							carbs: { currentG: totals.carbs / days, targetG: (macros.carbs / 100) * calorieGoal / 4 },
						}}
					/>
				</div>
			)}
			<section className="text-center">
                {ingredients.length > 0 && (
                    <div className="mt-10">
                        <button
                            type="button"
                            className="rounded-full bg-yellow-600 dark:bg-yellow-400 px-8 py-2 text-sm font-semibold text-white dark:text-black shadow-lg hover:bg-yellow-700 dark:hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                            onClick={onContinue}
                            disabled={ingredients.length === 0}
                        >
                            Go to Summary
                        </button>
                    </div>
                )}
				<button
					type="button"
					className="my-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition underline underline-offset-2"
					onClick={onBack}
				>
					← Back to calories & macros
				</button>
			</section>
		</div>
	);
}
