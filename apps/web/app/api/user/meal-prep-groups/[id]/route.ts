import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
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

// GET /api/user/meal-prep-groups/[id] — get single group with populated recipe data
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });

  const db = await getDb();
  const group = await db.collection("MealPrepGroups").findOne({
    _id: new ObjectId(id),
    userId: user.userId,
  });

  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  // Populate recipe details
  const slugs: string[] = (group.recipes ?? []).map((r: { recipeSlug: string }) => r.recipeSlug);
  const recipeDocs = slugs.length > 0
    ? await db.collection("Recipes").find(
        { slug: { $in: slugs }, status: "published" },
        { projection: { _id: 0, title: 1, slug: 1, imageUrl: 1, servings: 1, servingUnit: 1, nutritionTotals: 1 } }
      ).toArray()
    : [];

  const recipeMap = new Map(recipeDocs.map((r) => [r.slug, r]));

  const populatedRecipes = (group.recipes ?? []).map((r: { recipeSlug: string; addedAt: string; servings?: number }) => ({
    ...r,
    recipe: recipeMap.get(r.recipeSlug) ?? null,
  }));

  return NextResponse.json({ ...group, _id: group._id.toString(), recipes: populatedRecipes });
}

// PATCH /api/user/meal-prep-groups/[id] — update group name and/or days
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const days = typeof body?.days === "number" ? Math.max(1, Math.min(30, Math.round(body.days))) : null;
  const calorieGoal = typeof body?.calorieGoal === "number" ? Math.max(1, Math.round(body.calorieGoal)) : null;

  if (!name && days === null && calorieGoal === null) {
    return NextResponse.json({ error: "Provide name, days, or calorieGoal to update." }, { status: 400 });
  }
  if (name !== null && name.length > 80) {
    return NextResponse.json({ error: "Group name too long." }, { status: 400 });
  }

  const setFields: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (name) setFields.name = name;
  if (days !== null) {
    setFields.days = days;
    setFields["recipes.$[].servings"] = days;
  }
  if (calorieGoal !== null) setFields.calorieGoal = calorieGoal;

  const db = await getDb();
  const result = await db.collection("MealPrepGroups").updateOne(
    { _id: new ObjectId(id), userId: user.userId },
    { $set: setFields }
  );

  if (result.matchedCount === 0) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  return NextResponse.json({ success: true });
}

// DELETE /api/user/meal-prep-groups/[id] — delete entire group
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });

  const db = await getDb();
  const result = await db.collection("MealPrepGroups").deleteOne({
    _id: new ObjectId(id),
    userId: user.userId,
  });

  if (result.deletedCount === 0) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  return NextResponse.json({ success: true });
}
