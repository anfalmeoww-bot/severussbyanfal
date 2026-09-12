import type { SmsProvider } from "./provider";
import { config } from "../config";

/**
 * Unifonic REST SMS provider.
 *
 * Before enabling this in production:
 *  1. Create a Unifonic account and an "AppSid" for your app.
 *  2. Set UNIFONIC_APP_SID and UNIFONIC_SENDER_ID in your .env.
 *  3. Set SMS_PROVIDER=unifonic in your .env.
 *  4. Double-check the endpoint/field names against Unifonic's current REST
 *     API docs (https://developers.unifonic.com) before going live — SMS
 *     provider APIs occasionally change field names or add required ones.
 */
export const unifonicSmsProvider: SmsProvider = {
  async sendOtp(phone: string, code: string): Promise<void> {
    if (!config.unifonic.appSid) {
      throw new Error("UNIFONIC_APP_SID is not configured.");
    }

    const body = new URLSearchParams({
      AppSid: config.unifonic.appSid,
      SenderID: config.unifonic.senderId,
      Body: `${code} is your ${config.storeName} verification code. It expires in 5 minutes.`,
      Recipient: phone.replace(/^\+/, ""),
      responseType: "JSON",
    });

    const response = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Unifonic SMS send failed (${response.status}): ${text}`);
    }

    const data = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
    if (data && data.success === false) {
      throw new Error(`Unifonic SMS send failed: ${data.message ?? "unknown error"}`);
    }
  },
};
