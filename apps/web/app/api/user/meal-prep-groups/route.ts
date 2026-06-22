import { NextRequest, NextResponse } from "next/server";
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

// GET /api/user/meal-prep-groups — list all groups for current user
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const groups = await db
    .collection("MealPrepGroups")
    .find({ userId: user.userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json(groups);
}

// POST /api/user/meal-prep-groups — create a new group
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Group name is required." }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "Group name too long." }, { status: 400 });

  const days = typeof body?.days === "number" && body.days >= 1 ? Math.min(30, Math.round(body.days)) : 5;

  const now = new Date().toISOString();
  const db = await getDb();
  const result = await db.collection("MealPrepGroups").insertOne({
    userId: user.userId,
    name,
    days,
    recipes: [],
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ _id: result.insertedId.toString(), name, days, recipes: [], createdAt: now, updatedAt: now }, { status: 201 });
}
