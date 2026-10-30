type RegistrationRow = {
  fullName: string;
  phone: string;
  email: string;
  registeredAt: string;
};

/**
 * Sends a saved registration to a Google Apps Script web app. The script owns
 * Google authentication and appends the payload to the configured Sheet.
 */
export async function sendRegistrationToGoogleSheets(data: RegistrationRow) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.warn("[google-sheets] GOOGLE_SHEETS_WEBHOOK_URL is not configured.");
    return false;
  }

  const target = new URL(webhookUrl);
  if (webhookSecret) target.searchParams.set("secret", webhookSecret);

  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    console.error("[google-sheets] webhook rejected the registration:", {
      status: response.status,
      detail: (await response.text().catch(() => "")).slice(0, 500),
    });
    return false;
  }

  return true;
}
