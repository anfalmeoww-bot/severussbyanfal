import { createHash, randomInt } from "node:crypto";
import { get, run, now, all } from "../db";
import { newId } from "./ids";
import { config } from "../config";
import { HttpError } from "./http";
import { allowRequest, msUntilNextAllowed } from "./rateLimit";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "login" | "change_phone";

function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(phone).update(":").update(code).update(config.appSecret).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Requests a new OTP for `phone`. Applies two rate limits: a short cooldown
 * between consecutive sends, and a cap on how many codes can be requested
 * per hour — both keyed by phone number so an attacker can't just rotate IPs.
 */
export function requestOtp(
  phone: string,
  purpose: OtpPurpose,
  opts: { newPhone?: string; userId?: string } = {}
): { code: string } {
  const cooldownKey = `otp-cooldown:${phone}`;
  if (!allowRequest(cooldownKey, 1, 45 * 1000)) {
    const waitMs = msUntilNextAllowed(cooldownKey, 1, 45 * 1000);
    throw new HttpError(429, `Please wait ${Math.ceil(waitMs / 1000)}s before requesting another code.`);
  }
  const hourlyKey = `otp-hourly:${phone}`;
  if (!allowRequest(hourlyKey, 6, 60 * 60 * 1000)) {
    throw new HttpError(429, "Too many verification codes requested. Please try again later.");
  }

  const code = generateCode();
  run(
    `INSERT INTO otp_codes (id, phone, purpose, code_hash, new_phone, user_id, attempts, expires_at, created_at)
     VALUES (@id, @phone, @purpose, @codeHash, @newPhone, @userId, 0, @expiresAt, @createdAt)`,
    {
      id: newId(),
      phone,
      purpose,
      codeHash: hashCode(phone, code),
      newPhone: opts.newPhone ?? null,
      userId: opts.userId ?? null,
      expiresAt: now() + OTP_TTL_MS,
      createdAt: now(),
    }
  );
  return { code };
}

interface OtpRow {
  id: string;
  phone: string;
  purpose: OtpPurpose;
  code_hash: string;
  new_phone: string | null;
  user_id: string | null;
  attempts: number;
  expires_at: number;
  consumed_at: number | null;
  created_at: number;
}

/**
 * Verifies a submitted code. Throws HttpError on failure. On success, marks
 * the code consumed (single use) and returns the stored row (useful for
 * change_phone, which carries the pending new phone number).
 */
export function verifyOtp(phone: string, purpose: OtpPurpose, submittedCode: string): OtpRow {
  const verifyKey = `otp-verify:${phone}`;
  if (!allowRequest(verifyKey, 10, 10 * 60 * 1000)) {
    throw new HttpError(429, "Too many attempts. Please request a new code.");
  }

  const row = get<OtpRow>(
    `SELECT * FROM otp_codes WHERE phone = @phone AND purpose = @purpose AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    { phone, purpose }
  );
  if (!row) {
    throw new HttpError(400, "No pending verification code for this number. Please request a new one.");
  }
  if (row.expires_at < now()) {
    throw new HttpError(400, "This code has expired. Please request a new one.");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, "Too many incorrect attempts. Please request a new code.");
  }

  const expectedHash = hashCode(phone, submittedCode);
  if (expectedHash !== row.code_hash) {
    run(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = @id`, { id: row.id });
    const remaining = MAX_ATTEMPTS - (row.attempts + 1);
    throw new HttpError(400, `Incorrect code.${remaining > 0 ? ` ${remaining} attempt(s) left.` : ""}`);
  }

  run(`UPDATE otp_codes SET consumed_at = @now WHERE id = @id`, { id: row.id, now: now() });
  return row;
}

/** Removes expired/consumed OTP rows older than a day — call occasionally. */
export function pruneOtpCodes() {
  run(`DELETE FROM otp_codes WHERE expires_at < @cutoff`, { cutoff: now() - 24 * 60 * 60 * 1000 });
}
