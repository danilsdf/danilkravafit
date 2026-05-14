import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createCalendarEvent, listCalendarEvents } from "@/lib/googleCalendar";

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

/** GET /api/calendar/events?timeMin=ISO&timeMax=ISO — fetch for conflict detection */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timeMin = req.nextUrl.searchParams.get("timeMin");
  const timeMax = req.nextUrl.searchParams.get("timeMax");

  if (!timeMin || !timeMax) {
    return NextResponse.json(
      { error: "timeMin and timeMax are required." },
      { status: 400 }
    );
  }

  // Validate ISO dates
  if (isNaN(Date.parse(timeMin)) || isNaN(Date.parse(timeMax))) {
    return NextResponse.json({ error: "Invalid datetime format." }, { status: 400 });
  }

  try {
    const events = await listCalendarEvents(user.userId, timeMin, timeMax);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[GET /api/calendar/events]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** POST /api/calendar/events — create a new event */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    summary?: unknown;
    description?: unknown;
    startDateTime?: unknown;
    endDateTime?: unknown;
    timeZone?: unknown;
    colorId?: unknown;
  };

  const { summary, description, startDateTime, endDateTime, timeZone, colorId } = body;

  if (!summary || !startDateTime || !endDateTime) {
    return NextResponse.json(
      { error: "summary, startDateTime, and endDateTime are required." },
      { status: 400 }
    );
  }

  const start = String(startDateTime);
  const end = String(endDateTime);

  if (isNaN(Date.parse(start)) || isNaN(Date.parse(end))) {
    return NextResponse.json({ error: "Invalid datetime format." }, { status: 400 });
  }
  if (new Date(end) <= new Date(start)) {
    return NextResponse.json(
      { error: "endDateTime must be after startDateTime." },
      { status: 400 }
    );
  }

  try {
    const event = await createCalendarEvent(user.userId, {
      summary: String(summary).slice(0, 250),
      description: description ? String(description).slice(0, 8000) : undefined,
      start: { dateTime: start, timeZone: String(timeZone ?? "UTC") },
      end: { dateTime: end, timeZone: String(timeZone ?? "UTC") },
      colorId: colorId ? String(colorId) : undefined,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[POST /api/calendar/events]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
