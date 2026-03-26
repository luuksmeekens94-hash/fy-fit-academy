import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getStore, getUserById } from "@/lib/demo-data";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "fyfit-demo-session";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  return getUserById(userId) ?? null;
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

export function validateDemoCredentials(email: string, password: string) {
  const store = getStore();
  const user = store.users.find((entry) => entry.email === email);

  if (!user) {
    return null;
  }

  const account = store.demoAccounts.find(
    (entry) => entry.userId === user.id && entry.password === password,
  );

  return account ? user : null;
}
