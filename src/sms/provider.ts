export interface SmsProvider {
  /** Sends an OTP code to `phone` (E.164 format). Must throw on failure. */
  sendOtp(phone: string, code: string): Promise<void>;
}
