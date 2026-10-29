import {
  CONFIRMATION_SUBJECT,
  renderConfirmationEmail,
  renderConfirmationText,
} from "@/emails/confirmation";

type ConfirmationEmail = {
  firstName: string;
  email: string;
  ticket: string;
  qrUrl: string;
  siteUrl: string;
};

/**
 * Sends the ticket confirmation through Resend's HTTP API.
 *
 * Email configuration is optional while the site is being set up. A missing
 * key skips delivery, and a provider failure is logged without invalidating a
 * registration that has already been saved and ticketed.
 */
export async function sendConfirmationEmail(data: ConfirmationEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("[email] RESEND_API_KEY or EMAIL_FROM is not configured.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [data.email],
      subject: CONFIRMATION_SUBJECT,
      html: renderConfirmationEmail(data),
      text: renderConfirmationText(data),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[email] Resend rejected the confirmation email:", {
      status: response.status,
      detail: detail.slice(0, 500),
    });
    return false;
  }

  return true;
}
