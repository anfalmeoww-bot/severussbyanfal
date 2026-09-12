import { randomUUID, randomBytes } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
