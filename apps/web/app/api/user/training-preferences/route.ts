import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

const ALLOWED_TIMES = [
  "Early morning",
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Night",
] as const;
const ALLOWED_STYLES = [
  "Hybrid",
  "Running-focused",
  "Strength-focused",
  "Cycling-focused",
  "General Fitness",
] as const;
const ALLOWED_RECOVERY = [
  "Yoga",
  "Foam rolling",
  "Cold shower",
  "Sauna",
  "Stretching",
  "Active recovery",
  "Full rest",
] as const;
const ALLOWED_EQUIPMENT = [
  "Barbell",
  "Dumbbells",
  "Pull-up bar",
  "Resistance bands",
  "Kettlebell",
  "Cable machine",
  "Treadmill",
  "Bike",
  "None",
] as const;
const ALLOWED_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Elite",
] as const;

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const doc = await db
    .collection("Users")
    .findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { trainingPreferences: 1 } }
    );

  return NextResponse.json(doc?.trainingPreferences ?? null);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const prefs: Record<string, unknown> = {};

  if (body.preferredWorkoutTimes !== undefined) {
    if (!Array.isArray(body.preferredWorkoutTimes)) {
      return NextResponse.json({ error: "Invalid preferredWorkoutTimes." }, { status: 400 });
    }
    prefs.preferredWorkoutTimes = body.preferredWorkoutTimes.filter(
      (t): t is string => ALLOWED_TIMES.includes(t as never)
    );
  }

  if (body.trainingStyle !== undefined) {
    if (!ALLOWED_STYLES.includes(body.trainingStyle as never)) {
      return NextResponse.json({ error: "Invalid trainingStyle." }, { status: 400 });
    }
    prefs.trainingStyle = body.trainingStyle;
  }

  if (body.recoveryPreferences !== undefined) {
    if (!Array.isArray(body.recoveryPreferences)) {
      return NextResponse.json({ error: "Invalid recoveryPreferences." }, { status: 400 });
    }
    prefs.recoveryPreferences = body.recoveryPreferences.filter(
      (r): r is string => ALLOWED_RECOVERY.includes(r as never)
    );
  }

  if (body.gymAccess !== undefined) {
    prefs.gymAccess = !!body.gymAccess;
  }

  if (body.availableEquipment !== undefined) {
    if (!Array.isArray(body.availableEquipment)) {
      return NextResponse.json({ error: "Invalid availableEquipment." }, { status: 400 });
    }
    prefs.availableEquipment = body.availableEquipment.filter(
      (e): e is string => ALLOWED_EQUIPMENT.includes(e as never)
    );
  }

  if (body.goal !== undefined) {
    prefs.goal = String(body.goal).slice(0, 100);
  }

  if (body.experienceLevel !== undefined) {
    if (!ALLOWED_LEVELS.includes(body.experienceLevel as never)) {
      return NextResponse.json({ error: "Invalid experienceLevel." }, { status: 400 });
    }
    prefs.experienceLevel = body.experienceLevel;
  }

  const db = await getDb();
  await db
    .collection("Users")
    .updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: { trainingPreferences: prefs } }
    );

  return NextResponse.json({ ok: true });
}
