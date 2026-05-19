"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CaloriesScreen from "./screens/CaloriesScreen";
import InventoryScreen from "./screens/InventoryScreen";
import SummaryScreen from "./screens/SummaryScreen";
import { useCurrentUser } from "@/lib/useCurrentUser";

type SavedMealPrepSession = {
  _id: string;
  title: string;
  calorieGoal: number;
  macros: { protein: number; fat: number; carbs: number };
  days: number;
  ingredients: { name: string; amount: string; unit: string }[];
  updatedAt: string;
};

function getStoredSettings() {
  try {
    const raw = localStorage.getItem('mealPrepSettings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function getStoredIngredients(): { name: string; amount: string; unit: string }[] {
  try {
    const raw = localStorage.getItem('mealPrepIngredients');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export default function MealPrepHelperPageBody() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const [macros, setMacros] = useState(() => getStoredSettings()?.macros ?? { protein: 35, fat: 30, carbs: 35 });
  const [calorieGoal, setCalorieGoal] = useState<number>(() => getStoredSettings()?.calorieGoal ?? 2300);
  const [days, setDays] = useState<number>(() => getStoredSettings()?.days ?? 5);
  const [step, setStep] = useState<'calories' | 'inventory' | 'summary'>(() => {
    try {
      const s = localStorage.getItem('mealPrepStep');
      if (s === 'inventory') return 'inventory';
    } catch {}
    return 'calories';
  });
  const [ingredients, setIngredients] = useState<{ name: string; amount: string; unit: string }[]>(getStoredIngredients);
  const [nutritionSummary, setNutritionSummary] = useState<any>(null);
  const [ingredientDB, setIngredientDB] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedMealPrepSession[]>([]);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");

  useEffect(() => {
    localStorage.setItem('mealPrepSettings', JSON.stringify({ calorieGoal, macros, days }));
  }, [calorieGoal, macros, days]);

  useEffect(() => {
    localStorage.setItem('mealPrepIngredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    if (step !== 'summary') {
      localStorage.setItem('mealPrepStep', step);
    }
  }, [step]);

  const handleLoadFromProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/auth/profile');
      if (!res.ok) return;
      const data = await res.json();
      if (data.dailyCalories) setCalorieGoal(data.dailyCalories);
      if (data.macroSplit) setMacros(data.macroSplit);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/ingredients")
      .then((res) => res.json())
      .then((data) => setIngredientDB(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/meal-prep-sessions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSavedSessions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  // Load session from ?session= URL param
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (!sessionId) return;
    fetch(`/api/meal-prep-sessions/${sessionId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setCalorieGoal(data.calorieGoal);
        setMacros(data.macros);
        setDays(data.days);
        setIngredients(data.ingredients);
        setSavedSessionId(data._id);
        setSessionTitle(data.title);
        setStep('inventory');
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate nutrition for all ingredients
  function calculateNutrition() {
    let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    for (const ing of ingredients) {
      const db = ingredientDB.find((i: any) => i.name === ing.name);
      if (!db) continue;
      const conv = db.unitConversions.find((u: any) => u.unit === ing.unit);
      if (!conv) continue;
      const grams = parseFloat(ing.amount) * conv.grams;
      totalKcal += grams * db.kcalPer1g;
      totalProtein += grams * db.proteinPer1g;
      totalCarbs += grams * db.carbsPer1g;
      totalFat += grams * db.fatPer1g;
    }
    return { totalKcal, totalProtein, totalCarbs, totalFat };
  }

  const handleContinueCalories = () => {
    setStep('inventory');
  };

  async function handleSaveSession(title: string) {
    const res = await fetch('/api/meal-prep-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, calorieGoal, macros, days, ingredients }),
    });
    if (!res.ok) throw new Error('Save failed');
    const data = await res.json();
    setSavedSessionId(data._id);
    setSessionTitle(title);
    const newSession: SavedMealPrepSession = {
      _id: data._id, title, calorieGoal, macros, days, ingredients,
      updatedAt: new Date().toISOString(),
    };
    setSavedSessions(prev => [newSession, ...prev]);
    localStorage.removeItem('mealPrepSettings');
    localStorage.removeItem('mealPrepIngredients');
    localStorage.removeItem('mealPrepStep');
  }

  async function handleUpdateSession(title: string) {
    if (!savedSessionId) return;
    const res = await fetch(`/api/meal-prep-sessions/${savedSessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, calorieGoal, macros, days, ingredients }),
    });
    if (!res.ok) throw new Error('Update failed');
    setSessionTitle(title);
    setSavedSessions(prev => prev.map(s =>
      s._id === savedSessionId
        ? { ...s, title, calorieGoal, macros, days, ingredients, updatedAt: new Date().toISOString() }
        : s
    ));
  }

  function handleLoadSession(session: SavedMealPrepSession) {
    setCalorieGoal(session.calorieGoal);
    setMacros(session.macros);
    setDays(session.days);
    setIngredients(session.ingredients);
    setSavedSessionId(session._id);
    setSessionTitle(session.title);
    setStep('inventory');
  }

  const handleContinueInventory = () => {
    // Calculate nutrition and show summary
    const nutrition = calculateNutrition();
    setNutritionSummary(nutrition);
    setStep('summary');

    const ingredientList = ingredients.map((i) => `  • ${i.amount} ${i.unit} ${i.name}`).join('\n');
    fetch('/api/notifications/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🥗 <b>Meal Prep Helper used</b>\n👤 ${user?.email ?? 'Guest'}\n📅 ${days} days · 🎯 ${calorieGoal} kcal/day\n🥩 P ${macros.protein}% · 🧈 F ${macros.fat}% · 🍚 C ${macros.carbs}%\n🛒 Ingredients:\n${ingredientList}\n🔥 Total: ${Math.round(nutrition.totalKcal)} kcal | P ${Math.round(nutrition.totalProtein)}g | F ${Math.round(nutrition.totalFat)}g | C ${Math.round(nutrition.totalCarbs)}g`,
      }),
    }).catch(() => {});
  };

  // Calculate daily goals
  const dailyProtein = (macros.protein / 100) * calorieGoal / 4;
  const dailyFat = (macros.fat / 100) * calorieGoal / 9;
  const dailyCarbs = (macros.carbs / 100) * calorieGoal / 4;
  const totalGoal = {
    kcal: calorieGoal * days,
    protein: dailyProtein * days,
    fat: dailyFat * days,
    carbs: dailyCarbs * days,
  };

  // Helper: check if within 5% of goal
  function isWithinGoal(actual: number, goal: number) {
    return actual >= goal * 0.95 && actual <= goal * 1.05;
  }

  return (
    <div className="sm:mx-auto sm:w-4xl px-4 pt-24 text-neutral-900 dark:text-neutral-100">
      {step === 'calories' && (<section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Meal Prep Helper
        </h1>
        {user && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleLoadFromProfile}
              disabled={profileLoading}
              className="flex items-center gap-1.5 rounded-full border border-[#d2a852] dark:border-[#f0c46a] px-4 py-1.5 text-xs font-semibold text-[#d2a852] dark:text-[#f0c46a] transition hover:bg-[#d2a852] hover:text-black dark:hover:bg-[#f0c46a] dark:hover:text-[#23232a] disabled:opacity-50"
            >
              {profileLoading ? 'Loading…' : 'Use saved data'}
            </button>
          </div>
        )}
        {user && savedSessions.length > 0 && (
          <div className="mt-6 max-w-md mx-auto text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">My saved meal preps</div>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-700 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              {savedSessions.map(session => (
                <li key={session._id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition">
                  <div>
                    <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{session.title}</div>
                    <div className="text-xs text-neutral-400">{session.calorieGoal} kcal · {session.days} days</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadSession(session)}
                    className="ml-4 rounded-lg bg-yellow-500 px-3 py-1 text-xs font-bold text-white hover:bg-yellow-600 transition"
                  >
                    Load
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>)}
      {step === 'calories' && (
        <CaloriesScreen
          calorieGoal={calorieGoal}
          setCalorieGoal={setCalorieGoal}
          macros={macros}
          setMacros={setMacros}
          days={days}
          setDays={setDays}
          onContinue={handleContinueCalories}
        />
      )}
      {step === 'inventory' && (
        <InventoryScreen
          ingredients={ingredients}
          setIngredients={setIngredients}
          ingredientDB={ingredientDB}
          calorieGoal={calorieGoal}
          macros={macros}
          days={days}
          onContinue={handleContinueInventory}
          onBack={() => setStep('calories')}
        />
      )}
      {step === 'summary' && nutritionSummary && (
        <SummaryScreen
          calorieGoal={calorieGoal}
          macros={macros}
          days={days}
          ingredients={ingredients}
          nutritionSummary={nutritionSummary}
          totalGoal={totalGoal}
          isWithinGoal={isWithinGoal}
          ingredientDB={ingredientDB}
          onBack={() => setStep('inventory')}
          onBackCalories={() => setStep('calories')}
          onSave={user ? handleSaveSession : undefined}
          onUpdate={user && savedSessionId ? handleUpdateSession : undefined}
          savedSessionId={savedSessionId}
          initialTitle={sessionTitle}
        />
      )}
    </div>
  );
}