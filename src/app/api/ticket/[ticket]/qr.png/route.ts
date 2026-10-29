import QRCode from "qrcode";
import { buildQrPayload, isWellFormedTicket, normaliseTicket } from "@/lib/ticket";
import { supabase, supabaseConfigured } from "@/lib/supabase";

/**
 * The ticket QR, as a PNG.
 *
 * Served as an image rather than embedded in the registration response so it
 * can be referenced straight from the confirmation email and cached. The
 * payload inside is REF2.<ticket>.<ed25519 signature>, which a scanner can
 * verify with no network at all.
 *
 * Deliberately high error correction: this gets photographed off a cracked
 * phone screen, in sunlight, at a gate.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticket: string }> },
) {
  const { ticket: raw } = await params;
  const ticket = normaliseTicket(raw.replace(/\.png$/i, ""));

  if (!isWellFormedTicket(ticket)) {
    return new Response("Not found", { status: 404 });
  }

  // Don't mint a QR for a ticket that was never issued.
  if (supabaseConfigured()) {
    const { data } = await supabase()
      .from("registrations")
      .select("ticket")
      .eq("ticket", ticket)
      .maybeSingle();
    if (!data) return new Response("Not found", { status: 404 });
  }

  let png: Buffer;
  try {
    png = await QRCode.toBuffer(await buildQrPayload(ticket), {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 2,
      width: 600,
      color: { dark: "#1a1207ff", light: "#ffffffff" },
    });
  } catch (err) {
    console.error("[qr] generation failed:", err);
    return new Response("QR unavailable", { status: 500 });
  }

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // A ticket's QR never changes, and email clients re-fetch it often.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(png.length),
    },
  });
}
