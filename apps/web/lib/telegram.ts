const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APP_ENV = process.env.APP_ENV ?? "dev";

const ENV_PREFIX = APP_ENV === "prod" ? "🟢 <b>[PROD]</b>" : "🟡 <b>[DEV]</b>";

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: `${ENV_PREFIX} ${text}`, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[telegram] Failed to send message:", body);
  }
}
