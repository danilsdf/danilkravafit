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

// POST /api/user/meal-prep-groups/[id]/recipes — add recipe to group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });

  const body = await req.json();
  const recipeSlug = typeof body?.recipeSlug === "string" ? body.recipeSlug.trim() : "";
  if (!recipeSlug) return NextResponse.json({ error: "recipeSlug is required." }, { status: 400 });

  const db = await getDb();

  // Verify recipe exists
  const recipe = await db.collection("Recipes").findOne({ slug: recipeSlug, status: "published" });
  if (!recipe) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });

  // Check recipe not already in group
  const group = await db.collection("MealPrepGroups").findOne({
    _id: new ObjectId(id),
    userId: user.userId,
  });
  if (!group) return NextResponse.json({ error: "Group not found." }, { status: 404 });

  const alreadyAdded = (group.recipes ?? []).some(
    (r: { recipeSlug: string }) => r.recipeSlug === recipeSlug
  );
  if (alreadyAdded) return NextResponse.json({ error: "Recipe already in this group." }, { status: 409 });

  const now = new Date().toISOString();
  const kcalOverride = typeof body?.kcalOverride === "number" ? body.kcalOverride : null;
  const proteinOverride = typeof body?.proteinOverride === "number" ? body.proteinOverride : null;
  const carbsOverride = typeof body?.carbsOverride === "number" ? body.carbsOverride : null;
  const fatOverride = typeof body?.fatOverride === "number" ? body.fatOverride : null;
  const entry = { recipeSlug, addedAt: now, servings: group.days ?? 5, kcalOverride, proteinOverride, carbsOverride, fatOverride };

  await db.collection("MealPrepGroups").updateOne(
    { _id: new ObjectId(id), userId: user.userId },
    { $push: { recipes: entry }, $set: { updatedAt: now } } as any
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
