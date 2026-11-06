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

/** Standalone 2.0 countdown broadcast. */
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
              <p style="margin:0 0 30px;font-weight:bold;">Just 1 DAY TO GO!</p>
              <p style="margin:0 0 30px;">The countdown is almost over! Real Essence Festival 2.0 kicks off tomorrow, and you don't want to miss the excitement!</p>
              <p style="margin:0 0 30px;">Join us November 7 &amp; 8 at Ikeja City Mall for two unforgettable days of delicious Sedaap Supreme Noodles, great music, exciting games, amazing giveaways and live performances from <strong>Rybeena and T.I Blaze!</strong></p>
              <p style="margin:0 0 30px;">And guess what? You could also stand a chance to win <strong>₦1 MILLION in our cooking competition!</strong></p>
              <p style="margin:0 0 30px;">Date: November 7 &amp; 8, 2026<br />Venue: Ikeja City Mall, Lagos<br />Entry: FREE! Registration is compulsory.<br />Haven't registered yet? There's still time! Secure your spot now.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="${GREEN}" style="border-radius:999px;background:${GREEN};">
                    <a href="${SITE_URL}" style="display:inline-block;padding:18px 48px;color:#ffffff;font-size:20px;font-weight:bold;text-decoration:none;border-radius:999px;background:${GREEN};">REGISTER NOW</a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;">Already registered? You're all set! No need to register again. Just get ready for two days of food, music and unforgettable fun!</p>
              <p style="margin:30px 0 0;">The countdown is on. The Real Experience awaits!<br />See you there!</p>
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

Just 1 DAY TO GO!

The countdown is almost over! Real Essence Festival 2.0 kicks off tomorrow, and you don't want to miss the excitement!

Join us November 7 & 8 at Ikeja City Mall for two unforgettable days of delicious Sedaap Supreme Noodles, great music, exciting games, amazing giveaways and live performances from Rybeena and T.I Blaze!

And guess what? You could also stand a chance to win ₦1 MILLION in our cooking competition!

Date: November 7 & 8, 2026
Venue: Ikeja City Mall, Lagos
Entry: FREE! Registration is compulsory.
Haven't registered yet? There's still time! Secure your spot now.

REGISTER NOW: ${SITE_URL}

Already registered? You're all set! No need to register again. Just get ready for two days of food, music and unforgettable fun!

The countdown is on. The Real Experience awaits!
See you there!

Team Sedaap Supreme Noodles
`;
}

export const BROADCAST_SUBJECT = "1 DAY TO GO! Real Essence Festival 2.0 Is Almost Here!";
