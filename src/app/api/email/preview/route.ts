import { renderConfirmationEmail, renderConfirmationText } from "@/emails/confirmation";

/**
 * Renders the confirmation email so it can be eyeballed, screenshotted and
 * pasted into Litmus/Email on Acid.
 *
 *   /api/email/preview                     → the HTML
 *   /api/email/preview?format=text         → the plain-text part
 *   /api/email/preview?name=Ada → different sample data
 *
 * Disabled in production so the template isn't a public endpoint.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_EMAIL_PREVIEW) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const data = {
    firstName: url.searchParams.get("name") ?? "Ada",
    siteUrl: url.origin,
  };

  if (url.searchParams.get("format") === "text") {
    return new Response(renderConfirmationText(data), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(renderConfirmationEmail(data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
