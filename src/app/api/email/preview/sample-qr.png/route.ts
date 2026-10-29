import QRCode from "qrcode";

/** A QR for the email preview that doesn't need a real ticket in the database. */
export async function GET() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_EMAIL_PREVIEW) {
    return new Response("Not found", { status: 404 });
  }
  const png = await QRCode.toBuffer("REF2.A7K2M9XP.sample-signature-not-valid", {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 600,
    color: { dark: "#1a1207ff", light: "#ffffffff" },
  });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
