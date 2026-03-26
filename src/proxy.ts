import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";
import { getUserById } from "@/lib/demo-data";

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
  const sessionUserId = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionUser = sessionUserId ? getUserById(sessionUserId) : null;

  if (pathname === "/login" && sessionUser) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!sessionUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/team") && sessionUser.role === "MEDEWERKER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && sessionUser.role !== "BEHEERDER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
