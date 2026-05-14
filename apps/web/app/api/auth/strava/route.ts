import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_AUTH_REDIRECT_URI = process.env.STRAVA_AUTH_REDIRECT_URI;

function safeReturnPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/profile";
  return path;
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyToken(token).userId;
  } catch {
    return null;
  }
}

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: StravaAthlete;
}

// GET /api/auth/strava             → initiate OAuth (user must be logged in)
// GET /api/auth/strava?code=...    → OAuth callback, link Strava to current user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const state = searchParams.get("state");

  if (errorParam) {
    const returnPath = safeReturnPath(state);
    return NextResponse.redirect(
      new URL(`${returnPath}?error=strava_denied`, req.url)
    );
  }

  if (!code) {
    // Initiate OAuth — store returnPath in OAuth state param
    const returnPath = safeReturnPath(searchParams.get("returnPath"));
    const stravaAuthUrl =
      `https://www.strava.com/oauth/authorize` +
      `?client_id=${STRAVA_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(STRAVA_AUTH_REDIRECT_URI ?? "")}` +
      `&approval_prompt=auto` +
      `&scope=read` +
      `&state=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(stravaAuthUrl);
  }

  // Callback — user must be logged in to link their account
  const returnPath = safeReturnPath(state);

  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.redirect(
      new URL(`/login?returnPath=${encodeURIComponent(returnPath)}`, req.url)
    );
  }

  // Exchange code for tokens + athlete profile
  let tokenData: StravaTokenResponse;
  try {
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("[strava-auth] token exchange failed", await tokenRes.text());
      return NextResponse.redirect(
        new URL(`${returnPath}?error=strava_token_failed`, req.url)
      );
    }
    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("[strava-auth] token exchange error", err);
    return NextResponse.redirect(
      new URL(`${returnPath}?error=strava_network_error`, req.url)
    );
  }

  const { athlete, access_token, refresh_token, expires_at } = tokenData;
  const stravaId = String(athlete.id);

  try {
    const db = await getDb();
    const users = db.collection("Users");

    // Ensure this Strava account isn't already linked to a different user
    const alreadyLinked = await users.findOne({
      stravaId,
      _id: { $ne: new ObjectId(userId) },
    });
    if (alreadyLinked) {
      return NextResponse.redirect(
        new URL(`${returnPath}?error=strava_already_linked`, req.url)
      );
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          stravaId,
          stravaAccessToken: access_token,
          stravaRefreshToken: refresh_token,
          stravaTokenExpiresAt: expires_at,
          stravaProfilePicture: athlete.profile,
        },
      }
    );

    return NextResponse.redirect(new URL(returnPath, req.url));
  } catch (err) {
    console.error("[strava-auth]", err);
    return NextResponse.redirect(
      new URL(`${returnPath}?error=strava_auth_failed`, req.url)
    );
  }
}

// DELETE /api/auth/strava → disconnect (unlink) Strava from current user
export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const db = await getDb();
    await db.collection("Users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          stravaId: "",
          stravaAccessToken: "",
          stravaRefreshToken: "",
          stravaTokenExpiresAt: "",
          stravaProfilePicture: "",
        },
      }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[strava-disconnect]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

