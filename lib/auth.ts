export const COOKIE_NAME = "hmtd_auth";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function getCookieSecret(): string {
  const s = process.env.COOKIE_SECRET;
  if (!s) throw new Error("COOKIE_SECRET env var is required");
  return s;
}

export function getSharedSecret(): string {
  const s = process.env.APP_SHARED_SECRET;
  if (!s) throw new Error("APP_SHARED_SECRET env var is required");
  return s;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function signToken(payload: string): Promise<string> {
  const sig = await hmacHex(getCookieSecret(), payload);
  return `${payload}.${sig}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await hmacHex(getCookieSecret(), payload);
  return constantTimeEqual(sig, expected);
}
