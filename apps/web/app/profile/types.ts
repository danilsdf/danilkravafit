export type SavedPlanItem = {
  savedAt: string;
  plan: {
    id: string;
    title: string;
    imageUrl?: string | null;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    startDate: string;
    endDate: string;
    isCurrentWeek?: boolean;
  };
};

export type SavedRecipeItem = {
  savedAt: string;
  targetCalories?: number | null;
  targetMacroSplit?: { protein: number; fat: number; carbs: number } | null;
  recipe: {
    title: string;
    slug: string;
    imageUrl?: string | null;
    description?: string | null;
    tags?: string[];
    servings: number;
    servingUnit?: string;
    nutritionTotals?: {
      perServing?: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null };
    };
  };
};

export type SavedProgramItem = {
  id: string;
  savedAt: string;
  programStartDate?: string | null;
  program: {
    programTitle: string;
    goal: string;
    duration: string;
    experienceLevel: string;
    weeklySchedule: { week: number; workouts: { workoutType: string }[] }[];
  };
};

export type MealPrepSessionItem = {
  _id: string;
  title: string;
  calorieGoal: number;
  macros: { protein: number; fat: number; carbs: number };
  days: number;
  ingredients: { name: string; amount: string; unit: string }[];
  updatedAt: string;
};

export type MealPrepGroupRecipeEntry = {
  recipeSlug: string;
  addedAt: string;
  servings: number;
  kcalOverride?: number | null;
  proteinOverride?: number | null;
  carbsOverride?: number | null;
  fatOverride?: number | null;
  recipe: {
    title: string;
    slug: string;
    imageUrl?: string | null;
    servings: number;
    servingUnit?: string;
    nutritionTotals?: {
      perServing?: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null };
    };
  } | null;
};

export type MealPrepGroupItem = {
  _id: string;
  name: string;
  days: number;
  calorieGoal?: number | null;
  recipes: MealPrepGroupRecipeEntry[];
  createdAt: string;
  updatedAt: string;
};

export type MembershipInfo = {
  tier: "Runner" | "HybridAthlete" | "EliteSupporter";
  status: "active" | "trialing" | "canceled" | "past_due" | "unpaid";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  interval: "month" | "year";
};

export type ProfileData = {
  fullName: string;
  email: string;
  role: string;
  googleId?: string | null;
  stravaId?: string | null;
  discordId?: string | null;
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: "male" | "female" | null;
  goal?: "maintain" | "lose" | "gain" | null;
  dailyCalories?: number | null;
  macroSplit?: { protein: number; fat: number; carbs: number } | null;
  membership?: MembershipInfo | null;
};
