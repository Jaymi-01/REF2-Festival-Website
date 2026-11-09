
const GREEN = "#0a4e24";
const YELLOW = "#ffd701";
const CREAM = "#fff9ec";
const INK = "#1a1207";

const LOGO_URL =
  "https://www.supremenoodlefest.com/brand/festival-logo.png";

export type BroadcastData = {
  firstName?: string;
  unsubscribeUrl?: string;
};

/** Real Essence Festival 2.0 Thank You broadcast. */
export function renderBroadcastEmail({
  unsubscribeUrl,
}: BroadcastData = {}) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Thank You - Real Essence Festival 2.0</title>
</head>

<body style="margin:0;padding:0;background:${CREAM};font-family:Arial,Helvetica,sans-serif;color:${INK};-webkit-text-size-adjust:100%;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};">
    <tr>
      <td align="center" style="padding:20px 10px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;">

          <!-- Festival Logo -->
          <tr>
            <td align="center" bgcolor="${YELLOW}" style="background:${YELLOW};padding:20px 24px 24px;">
              <img
                src="${LOGO_URL}"
                alt="Real Essence Festival"
                width="160"
                style="display:block;width:160px;max-width:100%;height:auto;margin:0 auto;"
              />
            </td>
          </tr>

          <!-- Yellow Divider -->
          <tr>
            <td style="height:18px;background:${YELLOW};font-size:0;line-height:0;">
              &nbsp;
            </td>
          </tr>

          <!-- Thank You Message -->
          <tr>
            <td style="padding:56px 36px 30px;font-size:19px;line-height:1.65;">

              <p style="margin:0 0 28px;">
                Hey there,
              </p>

              <p style="margin:0 0 28px;font-size:23px;line-height:1.4;font-weight:bold;color:${GREEN};">
                What an unforgettable experience!
              </p>

              <p style="margin:0 0 28px;">
                A big <strong>THANK YOU</strong> for joining us at the
                <strong>Real Essence Festival 2.0!</strong>
              </p>

              <p style="margin:0 0 28px;">
                From the delicious <strong>Sedaap Supreme Noodles</strong>
                to the music, games, exciting giveaways, amazing
                performances and memorable moments, including the
                <strong>₦1 million win</strong> and
                <strong>two lucky attendees taking home 55-inch TVs</strong>,
                you made every moment special.
              </p>

              <p style="margin:0 0 28px;">
                Your energy and excitement brought
                <strong>The Real Experience</strong> to life,
                and we couldn't have done it without you!
              </p>

              <p style="margin:0 0 28px;">
                We hope you had an amazing time, and we can't wait
                to create more unforgettable memories with you.
              </p>

              <p style="margin:0 0 30px;">
                Until next time, keep enjoying the delicious taste of
                <strong>Sedaap Supreme Noodles!</strong>
              </p>

              <p style="margin:0;">
                With love and appreciation,<br />
                <strong>Team Sedaap Supreme Noodles</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:0 28px 30px;color:#6b5c47;font-size:14px;line-height:1.65;">
              ${
                unsubscribeUrl
                  ? `<p style="margin:18px 0 0;font-size:11px;">
                       <a href="${unsubscribeUrl}" style="color:#6b5c47;">Unsubscribe</a>
                     </p>`
                  : ""
              }
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/** Plain-text fallback for email clients. */
export function renderBroadcastText({
  unsubscribeUrl,
}: BroadcastData = {}) {
  return `Hey there,

What an unforgettable experience!

A big THANK YOU for joining us at the Real Essence Festival 2.0!

From the delicious Sedaap Supreme Noodles to the music, games, exciting giveaways, amazing performances and memorable moments, including the ₦1 million win and two lucky attendees taking home 55-inch TVs, you made every moment special.

Your energy and excitement brought The Real Experience to life, and we couldn't have done it without you!

We hope you had an amazing time, and we can't wait to create more unforgettable memories with you.

Until next time, keep enjoying the delicious taste of Sedaap Supreme Noodles!

With love and appreciation,
Team Sedaap Supreme Noodles
${unsubscribeUrl ? `\nUnsubscribe: ${unsubscribeUrl}\n` : ""}`;
}

export const BROADCAST_SUBJECT =
  "THANK YOU FOR MAKING REAL ESSENCE FESTIVAL 2.0 SPECIAL!";
