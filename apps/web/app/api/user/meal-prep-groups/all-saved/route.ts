import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// GET /api/user/meal-prep-groups/all-saved
// Returns all unique recipes saved across all of the user's Meal Prep Groups,
// along with which group names each recipe belongs to.
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();

  const groups = await db
    .collection("MealPrepGroups")
    .find({ userId: user.userId }, { projection: { name: 1, "recipes.recipeSlug": 1 } })
    .toArray();

  // Build slug → group names map
  const slugGroupMap = new Map<string, string[]>();
  for (const group of groups) {
    for (const r of group.recipes ?? []) {
      const names = slugGroupMap.get(r.recipeSlug) ?? [];
      names.push(group.name as string);
      slugGroupMap.set(r.recipeSlug, names);
    }
  }

  const allSlugs = [...slugGroupMap.keys()];
  if (allSlugs.length === 0) return NextResponse.json([]);

  const recipes = await db
    .collection("Recipes")
    .find(
      { slug: { $in: allSlugs }, status: "published" },
      {
        projection: {
          _id: 0,
          title: 1,
          slug: 1,
          imageUrl: 1,
          servings: 1,
          servingUnit: 1,
          nutritionTotals: 1,
        },
      }
    )
    .toArray();

  const result = recipes.map((r) => ({
    recipe: r,
    groups: slugGroupMap.get(r.slug as string) ?? [],
  }));

  return NextResponse.json(result);
}
