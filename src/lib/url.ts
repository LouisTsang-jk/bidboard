import { createHash } from "node:crypto";
import { isIP } from "node:net";

const TRACKING_KEYS = new Set(["fbclid", "gclid", "ref", "source"]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0
  );
}

export function normalizePublicUrl(input: string): string {
  const withProtocol = /^https?:\/\//i.test(input.trim())
    ? input.trim()
    : `https://${input.trim()}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS destinations are supported.");
  }
  if (url.username || url.password) throw new Error("Credentialed URLs are not allowed.");
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".local") ||
    isPrivateIpv4(url.hostname) ||
    (isIP(url.hostname) === 6 && (url.hostname === "::1" || url.hostname.startsWith("fe80:")))
  ) {
    throw new Error("Private-network destinations are not allowed.");
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
    url.port = "";
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_KEYS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

export function slugFromUrl(url: string): string {
  const parsed = new URL(url);
  const base = parsed.hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `${base}-${hashUrl(url).slice(0, 8)}`.slice(0, 120);
}
