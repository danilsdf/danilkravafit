import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { signToken, verifyToken } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";
import { cookies } from "next/headers";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

function safeReturnPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  email: string | null;
  verified: boolean;
}

// GET /api/auth/discord           → initiate OAuth
// GET /api/auth/discord?code=...  → OAuth callback
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const state = searchParams.get("state");

  if (errorParam) {
    const returnPath = safeReturnPath(state);
    return NextResponse.redirect(
      new URL(`${returnPath}?error=discord_denied`, req.url)
    );
  }

  if (!code) {
    // Initiate OAuth
    const returnPath = safeReturnPath(searchParams.get("returnPath"));
    const discordAuthUrl =
      `https://discord.com/api/oauth2/authorize` +
      `?client_id=${DISCORD_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI ?? "")}` +
      `&response_type=code` +
      `&scope=identify+email` +
      `&state=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(discordAuthUrl);
  }

  // Callback — exchange code for token
  const returnPath = safeReturnPath(state);

  let accessToken: string;
  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID ?? "",
        client_secret: DISCORD_CLIENT_SECRET ?? "",
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI ?? "",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[discord-auth] token exchange failed", await tokenRes.text());
      return NextResponse.redirect(
        new URL(`/login?error=discord_token_failed`, req.url)
      );
    }

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } catch (err) {
    console.error("[discord-auth] token exchange error", err);
    return NextResponse.redirect(
      new URL(`/login?error=discord_network_error`, req.url)
    );
  }

  // Fetch user info from Discord
  let discordUser: DiscordUser;
  try {
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("[discord-auth] user fetch failed", await userRes.text());
      return NextResponse.redirect(
        new URL(`/login?error=discord_user_failed`, req.url)
      );
    }

    discordUser = await userRes.json();
  } catch (err) {
    console.error("[discord-auth] user fetch error", err);
    return NextResponse.redirect(
      new URL(`/login?error=discord_network_error`, req.url)
    );
  }

  if (!discordUser.email || !discordUser.verified) {
    return NextResponse.redirect(
      new URL(`/login?error=discord_no_verified_email`, req.url)
    );
  }

  const normalizedEmail = discordUser.email.toLowerCase();
  const discordId = discordUser.id;
  const fullName =
    discordUser.global_name ?? discordUser.username ?? normalizedEmail.split("@")[0];

  try {
    const db = await getDb();
    const users = db.collection("Users");

    const existingUser = await users.findOne({ email: normalizedEmail });
    let user: typeof existingUser;

    if (existingUser) {
      if (!existingUser.discordId) {
        await users.updateOne({ _id: existingUser._id }, { $set: { discordId } });
      }

      sendTelegramMessage(
        `🔐 <b>Discord login</b>\n👤 ${existingUser.fullName} (${existingUser.email})\n🕐 ${new Date().toUTCString()}`
      ).catch((err) => console.error("[telegram] notification error:", err));

      user = existingUser;
    } else {
      const result = await users.insertOne({
        fullName,
        email: normalizedEmail,
        discordId,
        role: "User",
        createdAt: new Date(),
      });

      user = {
        _id: result.insertedId,
        fullName,
        email: normalizedEmail,
        discordId,
        role: "User",
        createdAt: new Date(),
      };

      sendTelegramMessage(
        `🆕 <b>New Discord sign-up</b>\n👤 ${fullName} (${normalizedEmail})\n🕐 ${new Date().toUTCString()}`
      ).catch((err) => console.error("[telegram] notification error:", err));
    }

    const token = signToken({
      userId: user._id.toHexString(),
      email: user.email,
      role: user.role as "Admin" | "User",
    });

    const response = NextResponse.redirect(new URL(returnPath, req.url));

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("[discord-auth]", err);
    return NextResponse.redirect(
      new URL(`/login?error=discord_server_error`, req.url)
    );
  }
}

// DELETE /api/auth/discord → disconnect (unlink) Discord from current user
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const payload = verifyToken(token);

    const db = await getDb();
    await db.collection("Users").updateOne(
      { _id: new ObjectId(payload.userId) },
      { $unset: { discordId: "" } }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[discord-disconnect]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
