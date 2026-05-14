import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { verifyToken } from "@/lib/auth";
import { getCalendarAuthUrl } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  // Must be logged in
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  const returnPath =
    req.nextUrl.searchParams.get("returnPath") ?? "/tool/training-program-generator";

  if (!authToken) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(returnPath)}`, req.url)
    );
  }

  let userId: string;
  try {
    userId = verifyToken(authToken).userId;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Generate a one-time nonce; sign it alongside userId + returnPath in a cookie
  const nonce = crypto.randomUUID();
  const stateCookie = jwt.sign(
    { nonce, userId, returnPath },
    process.env.JWT_SECRET!,
    { expiresIn: "5m" }
  );

  const authUrl = getCalendarAuthUrl(nonce);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("calendar_oauth_state", stateCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return response;
}
