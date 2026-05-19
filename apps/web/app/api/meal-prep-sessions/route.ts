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

// GET /api/meal-prep-sessions — list current user's sessions
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const sessions = await db
    .collection("MealPrepSessions")
    .find({ userId: user.userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json(sessions);
}

// POST /api/meal-prep-sessions — create a new session
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, calorieGoal, macros, days, ingredients } = body;

  if (
    typeof title !== "string" || !title.trim() ||
    typeof calorieGoal !== "number" ||
    !macros || typeof days !== "number" ||
    !Array.isArray(ingredients)
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();
  const result = await db.collection("MealPrepSessions").insertOne({
    userId: user.userId,
    title: title.trim(),
    calorieGoal,
    macros,
    days,
    ingredients,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ _id: result.insertedId.toString() }, { status: 201 });
}
