import { NextResponse } from "next/server";
import { issueToken, pinIsCorrect, scannerConfigured } from "@/lib/scanner-auth";

/** Exchanges the shared staff PIN for a device token. */

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 6;
const attempts = new Map<string, number[]>();

export async function POST(request: Request) {
  if (!scannerConfigured()) {
    return NextResponse.json(
      { message: "Scanner is not configured. See README.md." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);

  // A 4-6 digit PIN is brute-forceable without this.
  if (recent.length > MAX_ATTEMPTS) {
    return NextResponse.json(
      { message: "Too many attempts. Wait a minute." },
      { status: 429 },
    );
  }

  let body: { pin?: string; device?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const pin = (body.pin ?? "").trim();
  const device = (body.device ?? "").trim().slice(0, 40) || "Unnamed device";

  if (!pin || !pinIsCorrect(pin)) {
    return NextResponse.json({ message: "That PIN isn't right." }, { status: 401 });
  }

  attempts.delete(ip);
  return NextResponse.json({ ok: true, token: issueToken(device), device });
}
