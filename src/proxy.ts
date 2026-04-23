import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decodeSession, SESSION_COOKIE } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/",
  "/academy",
  "/bibliotheek",
  "/onboarding",
  "/ontwikkeling",
  "/team",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
