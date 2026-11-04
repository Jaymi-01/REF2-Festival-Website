const GREEN = "#0a4e24";
const YELLOW = "#ffd701";
const RED = "#b10008";
const CREAM = "#fff9ec";
const INK = "#1a1207";
const SITE_URL = "https://www.supremenoodlefest.com/";
const LOGO_URL = "https://www.supremenoodlefest.com/brand/festival-logo.png";

export type BroadcastData = {
  firstName?: string;
  unsubscribeUrl?: string;
};

/** Standalone 1.0 audience broadcast, based on public/template.jpg. */
export function renderBroadcastEmail({ unsubscribeUrl = "#" }: BroadcastData = {}) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Real Essence Festival 2.0</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Arial,Helvetica,sans-serif;color:${INK};-webkit-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;">
          <tr>
            <td align="center" bgcolor="${YELLOW}" style="background:${YELLOW};padding:20px 24px 24px;">
              <img src="${LOGO_URL}" alt="Real Essence Festival" width="160" style="display:block;width:160px;max-width:100%;height:auto;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="height:18px;background:repeating-linear-gradient(90deg,${YELLOW} 0 34px,#ffffff 34px 52px);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:72px 56px 28px;font-size:21px;line-height:1.42;">
              <p style="margin:0 0 30px;">Hey there,</p>
              <p style="margin:0 0 30px;font-weight:bold;">Real Essence Festival 2.0 is here!</p>
              <p style="margin:0 0 30px;">
                Join us November 7 &amp; 8 at Ikeja City Mall for two days of delicious Sedaap Supreme Noodles, music, games, exciting giveaways and live performances from Rybeena and T.I Blaze.
              </p>
              <p style="margin:0 0 30px;">
                You can also stand a chance to win ₦1 million in our cooking competition!
              </p>
              <p style="margin:0 0 30px;">
                Entry is <strong>FREE</strong> &mdash; but you must register to attend.
              </p>
              <p style="margin:0 0 12px;">Don&apos;t wait. Secure your spot now:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="${GREEN}" style="border-radius:999px;background:${GREEN};">
                    <a href="${SITE_URL}" style="display:inline-block;padding:18px 48px;color:#ffffff;font-size:20px;font-weight:bold;text-decoration:none;border-radius:999px;background:${GREEN};">REGISTER HERE</a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;">Come hungry. Come ready for fun. Come experience The Real Experience.</p>
              <p style="margin:30px 0 0;">Team Sedaap Supreme Noodles</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 28px 30px;color:#6b5c47;font-size:14px;line-height:1.65;">
              <p style="margin:18px 0 0;font-size:11px;"><a href="${unsubscribeUrl}" style="color:#6b5c47;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderBroadcastText(_data: BroadcastData = {}) {
  void _data;
  return `Hey there,

Real Essence Festival 2.0 is here!

Join us November 7 & 8 at Ikeja City Mall for two days of delicious Sedaap Supreme Noodles, music, games, exciting giveaways and live performances from Rybeena and T.I Blaze.

You can also stand a chance to win ₦1 million in our cooking competition!

Entry is FREE — but you must register to attend.

Don't wait. Secure your spot now:
REGISTER HERE → ${SITE_URL}

Come hungry. Come ready for fun. Come experience The Real Experience.

Team Sedaap Supreme Noodles`;
}

export const BROADCAST_SUBJECT = "You’re invited back to Real Essence Festival 2.0";
