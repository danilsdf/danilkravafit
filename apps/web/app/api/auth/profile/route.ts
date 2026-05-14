import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
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

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const db = await getDb();
    const doc = await db
      .collection("Users")
      .findOne(
        { _id: new ObjectId(user.userId) },
        { projection: { fullName: 1, email: 1, role: 1, googleId: 1, stravaId: 1, discordId: 1, weight: 1, height: 1, age: 1, gender: 1, goal: 1, dailyCalories: 1, macroSplit: 1, membership: 1 } }
      );
    if (!doc) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function parseMetric(
  value: unknown,
  min: number,
  max: number,
  name: string
): { ok: true; val: number | null } | { ok: false; error: string } {
  if (value === "" || value === null || value === undefined)
    return { ok: true, val: null };
  const n = Number(value);
  if (Number.isNaN(n) || n <= min || n > max)
    return { ok: false, error: `Invalid ${name}.` };
  return { ok: true, val: n };
}

function parseEnum(
  value: unknown,
  allowed: readonly string[],
  name: string
): { ok: true; val: string | null } | { ok: false; error: string } {
  if (value === "" || value === null || value === undefined) return { ok: true, val: null };
  if (typeof value !== "string" || !allowed.includes(value))
    return { ok: false, error: `Invalid ${name}.` };
  return { ok: true, val: value };
}

type UpdateResult =
  | { ok: true; data: Record<string, number | string | null> }
  | { ok: false; error: string };

function buildProfileUpdate(body: Record<string, unknown>): UpdateResult {
  const data: Record<string, number | string | null> = {};
  const metrics = [
    { key: "weight", min: 0, max: 500 },
    { key: "height", min: 0, max: 300 },
    { key: "age", min: 0, max: 120 },
    { key: "dailyCalories", min: 0, max: 9999 },
  ] as const;
  for (const { key, min, max } of metrics) {
    if (body[key] === undefined) continue;
    const r = parseMetric(body[key], min, max, key);
    if (!r.ok) return { ok: false, error: r.error };
    data[key] = r.val;
  }
  if (body.gender !== undefined) {
    const r = parseEnum(body.gender, ["male", "female"], "gender");
    if (!r.ok) return { ok: false, error: r.error };
    data.gender = r.val;
  }
  if (body.goal !== undefined) {
    const r = parseEnum(body.goal, ["lose", "maintain", "gain"], "goal");
    if (!r.ok) return { ok: false, error: r.error };
    data.goal = r.val;
  }
  return { ok: true, data };
}

function parseMacroSplit(
  value: unknown
): { ok: true; val: { protein: number; fat: number; carbs: number } | null } | { ok: false; error: string } {
  if (value === null || value === undefined) return { ok: true, val: null };
  if (typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Invalid macroSplit." };
  const { protein, fat, carbs } = value as Record<string, unknown>;
  const p = Number(protein);
  const f = Number(fat);
  const c = Number(carbs);
  if (!Number.isFinite(p) || !Number.isFinite(f) || !Number.isFinite(c)) return { ok: false, error: "Invalid macroSplit values." };
  if (p < 5 || f < 5 || c < 5 || p > 90 || f > 90 || c > 90) return { ok: false, error: "Each macro must be between 5 and 90%." };
  if (Math.round(p + f + c) !== 100) return { ok: false, error: "Macro split must sum to 100%." };
  return { ok: true, val: { protein: Math.round(p), fat: Math.round(f), carbs: Math.round(c) } };
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json() as Record<string, unknown>;
    const result = buildProfileUpdate(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

    const updateData: Record<string, unknown> = { ...result.data, updatedAt: new Date() };

    if (body.macroSplit !== undefined) {
      const macroResult = parseMacroSplit(body.macroSplit);
      if (!macroResult.ok) return NextResponse.json({ error: macroResult.error }, { status: 400 });
      updateData.macroSplit = macroResult.val;
    }

    const db = await getDb();
    await db
      .collection("Users")
      .updateOne(
        { _id: new ObjectId(user.userId) },
        { $set: updateData }
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
