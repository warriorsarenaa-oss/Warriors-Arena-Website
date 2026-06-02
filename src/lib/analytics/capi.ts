import crypto from "crypto";

type MetaEventData = {
  event_name: string;
  event_id: string;
  value?: number;
  currency?: string;
  user_data?: {
    em?: string; // Email
    ph?: string; // Phone
  };
  custom_data?: any;
};

function hashString(str: string): string {
  if (!str) return "";
  const cleanedStr = str.trim().toLowerCase();
  return crypto.createHash("sha256").update(cleanedStr).digest("hex");
}

export async function sendToMeta(event: MetaEventData, retries = 2): Promise<void> {
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const CAPI_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
  const TEST_CODE = process.env.NEXT_PUBLIC_META_CAPI_TEST_EVENT_CODE;

  // Gracefully skip if credentials are not configured
  if (!PIXEL_ID || !CAPI_TOKEN) {
    console.log("[CAPI] Meta Pixel ID or CAPI Token missing. Skipping event:", event.event_name);
    return;
  }

  const endpoint = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events`;

  const payload: any = {
    data: [
      {
        event_name: event.event_name,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: event.event_id,
        user_data: {
          client_ip_address: "127.0.0.1", // Requires passing from request if accurate IP is needed
          client_user_agent: "Unknown", // Requires passing from request
          em: event.user_data?.em ? [hashString(event.user_data.em)] : undefined,
          ph: event.user_data?.ph ? [hashString(event.user_data.ph)] : undefined,
        },
        custom_data: {
          ...event.custom_data,
          value: event.value,
          currency: event.currency,
        },
      },
    ],
  };

  if (TEST_CODE) {
    payload.test_event_code = TEST_CODE;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CAPI_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta CAPI responded with ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`[CAPI] Error sending event (Retries left: ${retries}):`, error);
    
    if (retries > 0) {
      // Exponential backoff
      const delay = Math.pow(2, 3 - retries) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendToMeta(event, retries - 1);
    } else {
      // If we had Sentry properly configured, we'd log it here: Sentry.captureException(error)
      console.error("[CAPI] Failed to send event after all retries.");
    }
  }
}
