import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionUserById } from "@/lib/data";
import { decodeSession, encodeSession, getSessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import type { Role } from "@/lib/types";

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession({ userId }), getSessionCookieOptions());
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = decodeSession(token);

  if (!payload?.userId) {
    return null;
  }

  return getSessionUserById(payload.userId);
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}
