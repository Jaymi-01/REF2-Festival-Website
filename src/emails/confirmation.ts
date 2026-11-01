import { FESTIVAL } from "@/lib/utils";

/* ===========================================================================
 * REGISTRATION CONFIRMATION EMAIL
 *
 * Written for email clients, not browsers. That means:
 *   - tables for layout, because Outlook renders with Word's engine
 *   - every style inlined; <style> blocks are stripped by Gmail's clipper
 *   - no flexbox, no grid, no custom fonts, no background-image
 *   - max width 600px, the safe column for Outlook and mobile alike
 *   - a bulletproof (VML) button so Outlook still shows a filled shape
 *   - total weight under 102KB, so the message remains reliable in email clients
 * ========================================================================= */

export type ConfirmationData = {
  firstName: string;
};

const RED = "#b10008";
const YELLOW = "#ffd701";
const GREEN = "#0a4e24";
const CREAM = "#fff9ec";
const INK = "#1a1207";
const LOGO_URL = "https://www.supremenoodlefest.com/brand/festival-logo.png";

/** Google Calendar link — one tap to put it in the diary. */
function calendarUrl() {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Real Essence Festival 2.0",
    dates: `${fmt(FESTIVAL.startsAt)}/${fmt(FESTIVAL.endsAt)}`,
    details: "Good food. Great music. Cool games. See you at the festival.",
    location: `${FESTIVAL.venue}, ${FESTIVAL.city}, Nigeria`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Outlook needs VML to render a filled, rounded button. */
function button(href: string, label: string, bg: string, fg: string) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr><td align="center" bgcolor="${bg}" style="border-radius:999px;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="${href}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="${bg}">
      <w:anchorlock/>
      <center style="color:${fg};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:${fg};text-decoration:none;border-radius:999px;background:${bg};">${label}</a>
    <!--<![endif]-->
  </td></tr>
</table>`;
}

export function renderConfirmationEmail(d: ConfirmationData) {
  const preheader = `Your spot has been saved for ${FESTIVAL.dateLabel.replace(/ /g, " ")}.`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Your spot has been saved</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-text-size-adjust:100%;">

<!-- preheader: the grey line beside the subject in the inbox -->
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">&#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};">
<tr><td align="center" style="padding:24px 12px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">

    <!-- ============ header ============ -->
    <tr><td align="center" bgcolor="${YELLOW}" style="background:${YELLOW};padding:28px 24px 22px;">
      <img src="${LOGO_URL}" alt="Real Essence Festival" width="160" style="display:block;width:160px;max-width:100%;height:auto;margin:0 auto;" />
    </td></tr>

    <!-- scalloped edge, drawn with table cells so no image is needed -->
    <tr><td style="font-size:0;line-height:0;" bgcolor="#ffffff">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        ${Array.from({ length: 20 })
          .map(
            (_, i) =>
              `<td height="12" bgcolor="${i % 2 ? YELLOW : "#ffffff"}" style="font-size:0;line-height:0;">&nbsp;</td>`,
          )
          .join("")}
      </tr></table>
    </td></tr>

    <!-- ============ you're in ============ -->
    <tr><td align="center" style="padding:30px 32px 6px;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.2;font-weight:bold;color:${GREEN};">
        Your spot has been saved, ${escapeHtml(d.firstName)}!
      </p>
      <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:${INK};">
        Your spot at the festival has been saved.
        Entry is free.
      </p>
    </td></tr>

    <!-- ============ registration confirmed ============ -->
    <tr><td align="center" style="padding:24px 24px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:420px;border:3px dashed ${RED};border-radius:16px;background:${CREAM};">
        <tr><td align="center" style="padding:22px 20px 6px;">
          <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#7a6a52;">
            Registration confirmed
          </p>

          <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#7a6a52;">
            We&rsquo;ll see you at the festival
          </p>
        </td></tr>
      </table>
    </td></tr>

    <!-- ============ when and where ============ -->
    <tr><td style="padding:14px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${row("When", `${FESTIVAL.dateLabel.replace(/ /g, " ")}, from ${FESTIVAL.doors}`)}
        ${row("Where", `${FESTIVAL.venue}, ${FESTIVAL.city}`)}
        ${row("Cost", "Free. Nothing to pay at the gate.")}
      </table>
    </td></tr>

    <tr><td align="center" style="padding:24px 32px 6px;">
      ${button(calendarUrl(), "Add to calendar", GREEN, "#ffffff")}
    </td></tr>

    <!-- ============ keep this email ============ -->
    <tr><td style="padding:26px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${INK};">
            Keep this email for your records. We&rsquo;ll see you at Real Essence
            Festival 2.0.
          </p>
        </td></tr>
      </table>
    </td></tr>

    <!-- ============ footer ============ -->
    <tr><td align="center" style="padding:30px 32px 34px;">
      <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b5c47;">
        Questions? Just reply to this email.
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a7a63;">
        Seedap Supreme Noodles &middot; Plot 4&ndash;6, Block 1, Industrial Opic Estate, Agbara, Ogun State<br />
        &copy; 2026 Sedaap Supreme Noodles. All Rights Reserved.
      </p>
    </td></tr>

  </table>

  <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9a8b74;">
    You received this because you saved a spot for the festival.
  </p>

</td></tr>
</table>
</body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td width="80" valign="top" style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#7a6a52;">${label}</td>
    <td valign="top" style="padding:7px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${INK};">${value}</td>
  </tr>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text alternative. Always send both parts — text-only clients and
 *  spam filters both expect it. */
export function renderConfirmationText(d: ConfirmationData) {
  return `Your spot has been saved, ${d.firstName}!

YOUR SPOT HAS BEEN SAVED
${FESTIVAL.dateLabel.replace(/ /g, " ")}, from ${FESTIVAL.doors}
${FESTIVAL.venue}, ${FESTIVAL.city}
Free entry.

REGISTRATION: CONFIRMED

Keep this email for your records.

Add to calendar: ${calendarUrl()}

Questions? Reply to this email.

Seedap Supreme Noodles
Plot 4-6, Block 1, Industrial Opic Estate, Agbara, Ogun State
© 2026 Sedaap Supreme Noodles. All Rights Reserved.`;
}

export const CONFIRMATION_SUBJECT = "Your spot has been saved";

type ReminderData = {
  firstName: string;
  final: boolean;
};

export function renderEventReminderEmail(d: ReminderData) {
  const heading = d.final
    ? "The festival is tomorrow"
    : "The festival is this week";
  const message = d.final
    ? "This is a reminder that Real Essence Festival 2.0 starts tomorrow."
    : "This is a reminder that Real Essence Festival 2.0 is happening this week.";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#fff9ec;color:#1a1207;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eadfca;border-radius:12px;overflow:hidden;">
    <div style="padding:24px;background:#ffd701;text-align:center;">
      <img src="${LOGO_URL}" alt="Real Essence Festival" width="160" style="display:block;width:160px;max-width:100%;height:auto;margin:0 auto;" />
    </div>
    <div style="padding:30px 28px;">
      <p style="margin:0;color:#0a4e24;font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:bold;">${heading}, ${escapeHtml(d.firstName)}.</p>
      <p style="margin:16px 0 0;font-size:16px;line-height:1.6;">${message}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;width:100%;font-size:15px;line-height:1.6;">
        ${row("When", `${FESTIVAL.dateLabel.replace(/Â /g, " ")}, from ${FESTIVAL.doors}`)}
        ${row("Where", `${FESTIVAL.venue}, ${FESTIVAL.city}`)}
        ${row("Entry", "Free")}
      </table>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b5c47;">Keep this email for your records. Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderEventReminderText(d: ReminderData) {
  const heading = d.final
    ? "The festival is tomorrow"
    : "The festival is this week";

  return `${heading}, ${d.firstName}.

REAL ESSENCE FESTIVAL 2.0
${FESTIVAL.dateLabel.replace(/Â /g, " ")}, from ${FESTIVAL.doors}
${FESTIVAL.venue}, ${FESTIVAL.city}
Free entry.

Keep this email for your records. Questions? Reply to this email.`;
}

/* duplicate reminder block follows
type ReminderData = {
  firstName: string;
  final: boolean;
};

export function renderEventReminderEmail(d: ReminderData) {
  const heading = d.final
    ? "The festival is tomorrow"
    : "The festival is this week";
  const message = d.final
    ? "This is a reminder that Real Essence Festival 2.0 starts tomorrow."
    : "This is a reminder that Real Essence Festival 2.0 is happening this week.";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#fff9ec;color:#1a1207;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eadfca;border-radius:12px;overflow:hidden;">
    <div style="padding:24px;background:#ffd701;text-align:center;">
      <p style="margin:0 0 6px;color:#0a4e24;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Sedaap Supreme Noodles</p>
      <h1 style="margin:0;color:#b10008;font-family:Georgia,'Times New Roman',serif;font-size:28px;">Real Essence Festival 2.0</h1>
    </div>
    <div style="padding:30px 28px;">
      <p style="margin:0;color:#0a4e24;font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:bold;">${heading}, ${escapeHtml(d.firstName)}.</p>
      <p style="margin:16px 0 0;font-size:16px;line-height:1.6;">${message}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;width:100%;font-size:15px;line-height:1.6;">
        ${row("When", `${FESTIVAL.dateLabel.replace(/Â /g, " ")}, from ${FESTIVAL.doors}`)}
        ${row("Where", `${FESTIVAL.venue}, ${FESTIVAL.city}`)}
        ${row("Entry", "Free")}
      </table>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b5c47;">Keep this email for your records. Questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}
/*

export function renderEventReminderText(d: ReminderData) {
  const heading = d.final
    ? "The festival is tomorrow"
    : "The festival is this week";

  return `${heading}, ${d.firstName}.

REAL ESSENCE FESTIVAL 2.0
${FESTIVAL.dateLabel.replace(/Â /g, " ")}, from ${FESTIVAL.doors}
${FESTIVAL.venue}, ${FESTIVAL.city}
Free entry.

Keep this email for your records. Questions? Reply to this email.`;
}
*/
