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

// GET /api/meal-prep-sessions/[id] — fetch a single session
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let objId: ObjectId;
  try {
    objId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();
  const session = await db
    .collection("MealPrepSessions")
    .findOne({ _id: objId, userId: user.userId });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...session, _id: session._id.toString() });
}

// PATCH /api/meal-prep-sessions/[id] — update title, macros, ingredients, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let objId: ObjectId;
  try {
    objId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

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
  const result = await db.collection("MealPrepSessions").updateOne(
    { _id: objId, userId: user.userId },
    {
      $set: {
        title: title.trim(),
        calorieGoal,
        macros,
        days,
        ingredients,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/meal-prep-sessions/[id] — delete a session
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let objId: ObjectId;
  try {
    objId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("MealPrepSessions").deleteOne({ _id: objId, userId: user.userId });

  return NextResponse.json({ success: true });
}
