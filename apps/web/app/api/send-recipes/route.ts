import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import fs from "node:fs";
import path from "node:path";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email: unknown = body?.email;

    if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

    const filePath = path.join(process.cwd(), "public", "high-protein-recipes.pdf");
    const fileContent = fs.readFileSync(filePath);

    await sgMail.send({
      from: process.env.SENDGRID_FROM ?? "noreply@yourdomain.com",
      to: sanitizedEmail,
      subject: "Your 10 Best High Protein Recipes 💪",
      text: "Thank you for your interest! Attached are your 10 best high protein recipes. Stay tuned — more meal prep plans are coming soon!",
      html: `<p>Thank you for your interest!</p><p>Attached are your <strong>10 best high protein recipes</strong>. Stay tuned — more meal prep plans are coming soon!</p>`,
      attachments: [
        {
          filename: "high-protein-recipes.pdf",
          content: fileContent.toString("base64"),
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    await sendTelegramMessage(`📧 <b>High Protein Recipes sent</b>\n📬 To: ${sanitizedEmail}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
