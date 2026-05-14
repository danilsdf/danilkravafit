import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { exchangeCalendarCode, storeCalendarTokens } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const fallback = "/tool/training-program-generator";

  if (oauthError) {
    return NextResponse.redirect(new URL(`${fallback}?calendar=denied`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL(`${fallback}?calendar=error`, req.url));
  }

  // Verify state cookie
  const cookieStore = await cookies();
  const stateCookieValue = cookieStore.get("calendar_oauth_state")?.value;

  if (!stateCookieValue) {
    return NextResponse.redirect(new URL(`${fallback}?calendar=error`, req.url));
  }

  let statePayload: { nonce: string; userId: string; returnPath: string };
  try {
    statePayload = jwt.verify(
      stateCookieValue,
      process.env.JWT_SECRET!
    ) as typeof statePayload;
  } catch {
    return NextResponse.redirect(new URL(`${fallback}?calendar=error`, req.url));
  }

  // CSRF check
  if (statePayload.nonce !== state) {
    return NextResponse.redirect(
      new URL(`${statePayload.returnPath}?calendar=error`, req.url)
    );
  }

  // Exchange code → tokens
  try {
    const tokens = await exchangeCalendarCode(code);
    await storeCalendarTokens(statePayload.userId, tokens);
  } catch (err) {
    console.error("[calendar/callback] token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`${statePayload.returnPath}?calendar=error`, req.url)
    );
  }

  const response = NextResponse.redirect(
    new URL(`${statePayload.returnPath}?calendar=connected`, req.url)
  );
  response.cookies.delete("calendar_oauth_state");
  return response;
}
