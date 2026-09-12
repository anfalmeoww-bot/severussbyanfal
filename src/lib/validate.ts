/**
 * Small, dependency-free validation helpers. Every field coming from a
 * client request should be run through one of these before it touches the
 * database or business logic.
 */
import { HttpError } from "./http";

/**
 * Extends HttpError (not just Error) so the router's error handler turns
 * this into a proper 400 response with the real message, instead of a
 * generic 500 — the router only special-cases HttpError.
 */
export class ValidationError extends HttpError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

/**
 * Accepts phone numbers in loose international formats and normalizes them
 * to E.164-ish form: leading "+" followed by 8-15 digits.
 */
export function normalizePhone(input: unknown): string {
  if (typeof input !== "string") throw new ValidationError("Phone number is required.");
  let phone = input.trim().replace(/[\s\-()]/g, "");
  if (phone.startsWith("00")) phone = "+" + phone.slice(2);
  if (!phone.startsWith("+")) {
    // Assume Saudi local format starting with 0 (e.g. 05XXXXXXXX) if no country code given.
    if (/^0\d{9}$/.test(phone)) {
      phone = "+966" + phone.slice(1);
    } else {
      phone = "+" + phone;
    }
  }
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new ValidationError("Please enter a valid phone number, including country code.");
  }
  return phone;
}

export function normalizeOtpCode(input: unknown): string {
  if (typeof input !== "string") throw new ValidationError("Verification code is required.");
  const code = input.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new ValidationError("The verification code must be 6 digits.");
  }
  return code;
}

export function requireString(input: unknown, field: string, opts?: { min?: number; max?: number }): string {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new ValidationError(`${field} is required.`);
  }
  const value = input.trim();
  if (opts?.min && value.length < opts.min) {
    throw new ValidationError(`${field} must be at least ${opts.min} characters.`);
  }
  if (opts?.max && value.length > opts.max) {
    throw new ValidationError(`${field} must be at most ${opts.max} characters.`);
  }
  return value;
}

export function optionalString(input: unknown, opts?: { max?: number }): string {
  if (input === undefined || input === null) return "";
  if (typeof input !== "string") throw new ValidationError("Invalid value.");
  const value = input.trim();
  if (opts?.max && value.length > opts.max) {
    throw new ValidationError(`Value must be at most ${opts.max} characters.`);
  }
  return value;
}

export function requirePositiveInt(input: unknown, field: string): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new ValidationError(`${field} must be a positive whole number.`);
  }
  return n;
}

export function requirePriceCents(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n) || n < 0) {
    throw new ValidationError("Price must be a positive number.");
  }
  return Math.round(n);
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}
