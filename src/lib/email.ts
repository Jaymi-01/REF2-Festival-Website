import {
  CONFIRMATION_SUBJECT,
  renderEventReminderEmail,
  renderEventReminderText,
  renderConfirmationEmail,
  renderConfirmationText,
} from "@/emails/confirmation";

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

/** Schedules both event reminders in Lagos time after registration succeeds. */
export async function scheduleEventReminders(data: { firstName: string; email: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) return false;

  const reminders = [
    {
      scheduledAt: "2026-11-04T12:00:00+01:00",
      subject: "Reminder: Real Essence Festival 2.0 is this week",
      final: false,
    },
    {
      scheduledAt: "2026-11-06T12:00:00+01:00",
      subject: "Tomorrow: Real Essence Festival 2.0",
      final: true,
    },
  ];

  let allScheduled = true;
  for (const reminder of reminders) {
    if (new Date(reminder.scheduledAt).getTime() <= Date.now()) continue;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [data.email],
        subject: reminder.subject,
        html: renderEventReminderEmail({ firstName: data.firstName, final: reminder.final }),
        text: renderEventReminderText({ firstName: data.firstName, final: reminder.final }),
        scheduled_at: reminder.scheduledAt,
      }),
    });

    if (!response.ok) {
      allScheduled = false;
      console.error("[email] Resend rejected a scheduled reminder:", {
        status: response.status,
        detail: (await response.text().catch(() => "")).slice(0, 500),
      });
    }
  }

  return allScheduled;
}
