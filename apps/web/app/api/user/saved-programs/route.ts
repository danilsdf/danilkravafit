import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

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

  const db = await getDb();
  const programs = await db
    .collection("SavedTrainingPrograms")
    .find({ userId: user.userId })
    .sort({ savedAt: -1 })
    .project({ userId: 0 })
    .toArray();

  return NextResponse.json(
    programs.map((p) => ({ ...p, id: p._id.toHexString(), _id: undefined }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json() as {
    program?: unknown;
    programStartDate?: unknown;
  };

  if (!body.program || typeof body.program !== "object") {
    return NextResponse.json({ error: "program is required." }, { status: 400 });
  }

  const db = await getDb();

  // Check if user already has a saved program with same title — upsert by title
  const title = (body.program as Record<string, unknown>).programTitle;
  if (typeof title !== "string" || !title) {
    return NextResponse.json({ error: "Invalid program." }, { status: 400 });
  }

  const result = await db.collection("SavedTrainingPrograms").findOneAndUpdate(
    { userId: user.userId, "program.programTitle": title },
    {
      $set: {
        userId: user.userId,
        program: body.program,
        programStartDate: typeof body.programStartDate === "string" ? body.programStartDate : null,
        savedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const id = result?._id?.toHexString() ?? new ObjectId().toHexString();
  return NextResponse.json({ id }, { status: 201 });
}
