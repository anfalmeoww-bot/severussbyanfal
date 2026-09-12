import type { SmsProvider } from "./provider";

/**
 * Development-only provider: prints the code to the server log instead of
 * sending a real SMS. Never use this in production — set SMS_PROVIDER to a
 * real provider (see unifonic.ts) before going live.
 */
export const consoleSmsProvider: SmsProvider = {
  async sendOtp(phone: string, code: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`\n[SMS][DEV MODE] Verification code for ${phone}: ${code}\n`);
  },
};
