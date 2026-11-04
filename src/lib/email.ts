import {
  CONFIRMATION_SUBJECT,
  renderEventReminderEmail,
  renderEventReminderText,
  renderConfirmationEmail,
  renderConfirmationText,
} from "@/emails/confirmation";
import {
  BROADCAST_SUBJECT,
  renderBroadcastEmail,
  renderBroadcastText,
} from "@/emails/broadcast";
import nodemailer from "nodemailer";

type ConfirmationEmail = {
  firstName: string;
  email: string;
};

/**
 * Sends the registration confirmation through Resend's HTTP API.
 *
 * Email configuration is optional while the site is being set up. A missing
 * key skips delivery, and a provider failure is logged without invalidating a
 * registration that has already been saved.
 */
export async function sendConfirmationEmail(data: ConfirmationEmail) {
  return sendEmailWithFallback({
    to: data.email,
    subject: CONFIRMATION_SUBJECT,
    html: renderConfirmationEmail(data),
    text: renderConfirmationText(data),
    label: "confirmation",
  });
}

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  label: string;
};

/** Sends through Resend first, then SMTP when Resend is unavailable or rejects. */
async function sendEmailWithFallback(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.EMAIL_FROM;

  if (apiKey && resendFrom) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

      if (response.ok) return true;

      const detail = await response.text().catch(() => "");
      console.error(`[email] Resend rejected ${message.label}; trying SMTP fallback:`, {
        status: response.status,
        detail: detail.slice(0, 500),
      });
    } catch (error) {
      console.error(`[email] Resend request failed for ${message.label}; trying SMTP fallback:`, error);
    }
  } else {
    console.warn("[email] Resend is not configured; trying SMTP fallback.");
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM ?? process.env.EMAIL_FROM;

  if (!host || !user || !password || !from) {
    console.warn(
      "[email] SMTP fallback is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM or EMAIL_FROM.",
    );
    return false;
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });

  try {
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    console.info(`[email] ${message.label} sent through SMTP fallback.`);
    return true;
  } catch (error) {
    console.error("[email] SMTP fallback failed:", error);
    return false;
  }
}

/** Sends one event reminder immediately through the same provider fallback. */
export async function sendEventReminderEmail(data: { firstName: string; email: string; final: boolean }) {
  return sendEmailWithFallback({
    to: data.email,
    subject: data.final ? "Tomorrow: Real Essence Festival 2.0" : "Reminder: Real Essence Festival 2.0 is this week",
    html: renderEventReminderEmail({ firstName: data.firstName, final: data.final }),
    text: renderEventReminderText({ firstName: data.firstName, final: data.final }),
    label: data.final ? "final reminder" : "event reminder",
  });
}

/** Sends one 1.0 audience message through the existing Resend/SMTP fallback. */
export async function sendBroadcastEmail(email: string) {
  return sendEmailWithFallback({
    to: email,
    subject: BROADCAST_SUBJECT,
    html: renderBroadcastEmail(),
    text: renderBroadcastText(),
    label: "1.0 broadcast",
  });
}

