import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { getDb } from "@/lib/mongodb";
import { signToken } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential } = body as { credential?: string };

    if (!credential || typeof credential !== "string") {
      return NextResponse.json(
        { error: "Missing Google credential." },
        { status: 400 }
      );
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid Google token." },
        { status: 401 }
      );
    }

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return NextResponse.json(
        { error: "Could not retrieve email from Google account." },
        { status: 401 }
      );
    }

    const { email, name, sub: googleId } = payload;
    const normalizedEmail = email.toLowerCase();

    const db = await getDb();
    const users = db.collection("Users");

    let user = await users.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const fullName = name ?? normalizedEmail.split("@")[0];
      const result = await users.insertOne({
        fullName,
        email: normalizedEmail,
        googleId,
        role: "User",
        createdAt: new Date(),
      });

      user = {
        _id: result.insertedId,
        fullName,
        email: normalizedEmail,
        googleId,
        role: "User",
        createdAt: new Date(),
      };

      sendTelegramMessage(
        `🆕 <b>New Google sign-up</b>\n👤 ${fullName} (${normalizedEmail})\n🕐 ${new Date().toUTCString()}`
      ).catch((err) => console.error("[telegram] notification error:", err));
    } else {
      // Link Google account to existing user if not already linked
      if (!user.googleId) {
        await users.updateOne({ _id: user._id }, { $set: { googleId } });
      }

      sendTelegramMessage(
        `🔐 <b>Google login</b>\n👤 ${user.fullName} (${user.email})\n🕐 ${new Date().toUTCString()}`
      ).catch((err) => console.error("[telegram] notification error:", err));
    }

    const token = signToken({
      userId: user._id.toHexString(),
      email: user.email,
      role: user.role as "Admin" | "User",
    });

    const response = NextResponse.json(
      {
        message: isNewUser
          ? "Account created successfully."
          : "Logged in successfully.",
        user: { fullName: user.fullName, email: user.email, role: user.role },
      },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("[google-auth]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
