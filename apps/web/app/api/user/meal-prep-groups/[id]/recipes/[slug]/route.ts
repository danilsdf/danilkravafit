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

const OVERRIDE_FIELDS = ["kcalOverride", "proteinOverride", "carbsOverride", "fatOverride"] as const;

function applyOverrides(body: Record<string, unknown>, fields: Record<string, unknown>): boolean {
  let hasUpdate = false;
  for (const key of OVERRIDE_FIELDS) {
    if (typeof body[key] === "number") {
      fields[`recipes.$.${key}`] = body[key];
      hasUpdate = true;
    } else if (body[key] === null) {
      fields[`recipes.$.${key}`] = null;
      hasUpdate = true;
    }
  }
  return hasUpdate;
}

// PATCH /api/user/meal-prep-groups/[id]/recipes/[slug] — update servings or overrides for a recipe in group
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slug: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, slug } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });

  const body = await req.json();
  const servings = typeof body?.servings === "number" ? body.servings : null;

  const setFields: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (servings !== null) setFields["recipes.$.servings"] = servings;
  const hasOverrideUpdate = applyOverrides(body, setFields);

  if (servings === null && !hasOverrideUpdate) {
    return NextResponse.json({ error: "Provide at least one field to update." }, { status: 400 });
  }
  if (servings !== null && (servings <= 0 || servings > 100)) {
    return NextResponse.json({ error: "servings must be a positive number up to 100." }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("MealPrepGroups").updateOne(
    { _id: new ObjectId(id), userId: user.userId, "recipes.recipeSlug": slug },
    { $set: setFields }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Group or recipe not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/user/meal-prep-groups/[id]/recipes/[slug] — remove recipe from group
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; slug: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, slug } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid group ID." }, { status: 400 });

  const db = await getDb();
  const result = await db.collection("MealPrepGroups").updateOne(
    { _id: new ObjectId(id), userId: user.userId },
    {
      $pull: { recipes: { recipeSlug: slug } },
      $set: { updatedAt: new Date().toISOString() },
    } as any
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
