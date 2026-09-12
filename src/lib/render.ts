export function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(input: unknown): string {
  return escapeHtml(input);
}

export function money(cents: number, currency: string, locale: "ar" | "en"): string {
  const amount = (cents / 100).toFixed(2);
  if (currency === "SAR") {
    return locale === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
  }
  return `${amount} ${currency}`;
}

export function formatDate(ts: number, locale: "ar" | "en"): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString();
  }
}
