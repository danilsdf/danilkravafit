import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth";
import { isCalendarConnected } from "@/lib/googleCalendar";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ connected: false });

    const { userId } = verifyToken(token);
    const connected = await isCalendarConnected(userId);
    return NextResponse.json({ connected });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

/** DELETE /api/calendar/status — disconnect Google Calendar */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = verifyToken(token);
    const db = await getDb();

    await db.collection("Users").updateOne(
      { _id: new ObjectId(userId) },
      { $unset: { googleCalendarTokens: "", trainingCalendarId: "" } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
