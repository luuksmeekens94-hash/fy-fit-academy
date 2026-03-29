import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fyfit-session";

export type SessionPayload = {
  userId: string;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "development-session-secret-change-me";
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function encodeSession(payload: SessionPayload) {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function decodeSession(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);
  const isValid =
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValid) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(body)) as SessionPayload;
    return payload.userId ? payload : null;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}
