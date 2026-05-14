import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/googleCalendar";

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

/** PATCH /api/calendar/events/[eventId] — reschedule or update event */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;

  const body = await req.json() as {
    summary?: unknown;
    description?: unknown;
    startDateTime?: unknown;
    endDateTime?: unknown;
    timeZone?: unknown;
  };

  const patch: Record<string, unknown> = {};

  if (body.summary !== undefined) {
    patch.summary = String(body.summary).slice(0, 250);
  }
  if (body.description !== undefined) {
    patch.description = String(body.description).slice(0, 8000);
  }

  if (body.startDateTime !== undefined || body.endDateTime !== undefined) {
    const start = String(body.startDateTime ?? "");
    const end = String(body.endDateTime ?? "");
    const tz = String(body.timeZone ?? "UTC");

    if (!start || !end || isNaN(Date.parse(start)) || isNaN(Date.parse(end))) {
      return NextResponse.json(
        { error: "Valid startDateTime and endDateTime are required." },
        { status: 400 }
      );
    }
    if (new Date(end) <= new Date(start)) {
      return NextResponse.json(
        { error: "endDateTime must be after startDateTime." },
        { status: 400 }
      );
    }

    patch.start = { dateTime: start, timeZone: tz };
    patch.end = { dateTime: end, timeZone: tz };
  }

  try {
    const event = await updateCalendarEvent(user.userId, eventId, patch as Parameters<typeof updateCalendarEvent>[2]);
    return NextResponse.json(event);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** DELETE /api/calendar/events/[eventId] — remove event from Google Calendar */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;

  try {
    await deleteCalendarEvent(user.userId, eventId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
