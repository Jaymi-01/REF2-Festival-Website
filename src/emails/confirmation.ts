import { formatTicket } from "@/lib/ticket";
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
 *   - total weight under 102KB, or Gmail clips the message and hides the QR
 *
 * IMAGES ARE BLOCKED BY DEFAULT in most clients, so the QR can never be the
 * only way in. The ticket number is set in large live text directly beneath
 * it, and the scanner has a manual-entry mode that takes exactly that string.
 * ========================================================================= */

export type ConfirmationData = {
  firstName: string;
  ticket: string;
  /** Absolute URL to the QR PNG, e.g. https://site/api/ticket/ABC/qr.png */
  qrUrl: string;
  /** Where "view in browser" and the footer links point. */
  siteUrl: string;
};

const RED = "#b10008";
const YELLOW = "#ffd701";
const GREEN = "#0a4e24";
const CREAM = "#fff9ec";
const INK = "#1a1207";

/** Google Calendar link — one tap to put it in the diary. */
function calendarUrl() {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Real Essence Festival 2.0",
    dates: `${fmt(FESTIVAL.startsAt)}/${fmt(FESTIVAL.endsAt)}`,
    details: "Good food. Great music. Cool games. Bring your ticket QR.",
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
  const pretty = formatTicket(d.ticket);
  const preheader = `You're in. Ticket ${pretty} — show this at the gate on ${FESTIVAL.dateLabel.replace(/ /g, " ")}.`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>You're registered — Real Essence Festival 2.0</title>
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
      <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${GREEN};">
        Sedaap Supreme Noodles presents
      </p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:bold;color:${RED};">
        Real Essence Festival 2.0
      </p>
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
        You&rsquo;re in, ${escapeHtml(d.firstName)}!
      </p>
      <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:${INK};">
        Two days of good food, great music, cool games and unforgettable vibes.
        Entry is free &mdash; just bring the ticket below.
      </p>
    </td></tr>

    <!-- ============ the ticket ============ -->
    <tr><td align="center" style="padding:24px 24px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:420px;border:3px dashed ${RED};border-radius:16px;background:${CREAM};">
        <tr><td align="center" style="padding:22px 20px 6px;">
          <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#7a6a52;">
            Admit one &middot; show at the gate
          </p>

          <!-- QR. Images are blocked by default in most clients, so the ticket
               number beneath it is the real fallback, not a nicety. -->
          <img src="${d.qrUrl}" width="200" height="200" alt="QR code for ticket ${pretty}"
               style="display:block;margin:0 auto;width:200px;height:200px;border:0;outline:none;text-decoration:none;background:#ffffff;" />

          <p style="margin:16px 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#7a6a52;">
            Can&rsquo;t see the code? Read this out instead
          </p>
          <p style="margin:0 0 18px;font-family:'Courier New',Courier,monospace;font-size:26px;line-height:1.2;font-weight:bold;letter-spacing:3px;color:${RED};">
            ${pretty}
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

    <!-- ============ what's on ============ -->
    <tr><td style="padding:26px 32px 0;">
      <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:${RED};">
        What&rsquo;s waiting for you
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${bullet("A &#8358;1,000,000 cooking competition")}
        ${bullet("Live artistes, DJs and an MC all weekend")}
        ${bullet("Games, free tasting and goodie bags")}
      </table>
    </td></tr>

    <!-- ============ keep this email ============ -->
    <tr><td style="padding:26px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${INK};">
            <strong>Keep this email.</strong> One entry per ticket &mdash; once it&rsquo;s
            scanned it can&rsquo;t be used again, so don&rsquo;t forward it on. No signal at the gate?
            The team can type in your ticket number.
          </p>
        </td></tr>
      </table>
    </td></tr>

    <!-- ============ footer ============ -->
    <tr><td align="center" style="padding:30px 32px 34px;">
      <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b5c47;">
        Questions? Just reply to this email, or DM us
        <a href="${d.siteUrl}" style="color:${RED};">@sedaapsupremenoodles</a>.
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a7a63;">
        Seedap Supreme Noodles &middot; Plot 4&ndash;6, Block 1, Industrial Opic Estate, Agbara, Ogun State<br />
        &copy; 2026 Sedaap Supreme Noodles. All Rights Reserved.
      </p>
    </td></tr>

  </table>

  <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9a8b74;">
    You received this because you registered for Real Essence Festival 2.0.
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

function bullet(text: string) {
  return `<tr>
    <td width="22" valign="top" style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${YELLOW};">&#9679;</td>
    <td valign="top" style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${INK};">${text}</td>
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
  return `You're in, ${d.firstName}!

REAL ESSENCE FESTIVAL 2.0
${FESTIVAL.dateLabel.replace(/ /g, " ")}, from ${FESTIVAL.doors}
${FESTIVAL.venue}, ${FESTIVAL.city}
Free entry.

YOUR TICKET: ${formatTicket(d.ticket)}
Show the QR code in this email at the gate, or read out the ticket number above.

What's waiting for you:
- A N1,000,000 cooking competition
- Live artistes, DJs and an MC all weekend
- Games, free tasting and goodie bags

Keep this email. One entry per ticket — once it's scanned it can't be used
again, so please don't forward it on.

Add to calendar: ${calendarUrl()}

Questions? Reply to this email.

Seedap Supreme Noodles
Plot 4-6, Block 1, Industrial Opic Estate, Agbara, Ogun State
© 2026 Sedaap Supreme Noodles. All Rights Reserved.`;
}

export const CONFIRMATION_SUBJECT = "You're in — your Real Essence Festival 2.0 ticket";
