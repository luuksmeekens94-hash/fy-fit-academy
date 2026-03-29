"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";
import type { User } from "@/lib/types";

type UserMenuProps = {
  user: User;
};

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const primaryLinks = [
    { href: "/", label: "Dashboard", visible: true },
    { href: "/academy", label: "Fy-fit Academy", visible: true },
    { href: "/ontwikkeling", label: "Mijn ontwikkeling", visible: true },
    {
      href: "/onboarding",
      label: "Onboarding",
      visible: user.isOnboarding || user.role !== "MEDEWERKER",
    },
    { href: "/bibliotheek", label: "Praktijkbibliotheek", visible: true },
  ].filter((item) => item.visible);

  const secondaryLinks = [
    { href: "/mijn-gegevens", label: "Mijn gegevens", visible: true },
    { href: "/team", label: "Team", visible: user.role !== "MEDEWERKER" },
    { href: "/admin", label: "Beheer", visible: user.role === "BEHEERDER" },
  ].filter((item) => item.visible);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/90 px-2 py-2 pr-4 shadow-sm transition hover:border-[var(--brand)] hover:shadow-md"
        aria-label="User menu"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-soft)] font-semibold text-[var(--brand)]">
          {initials(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-slate-950">{user.name}</span>
          <span className="block text-xs text-[var(--ink-soft)]">{user.title}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-[28px] border border-[var(--border)] bg-white/96 p-3 shadow-xl backdrop-blur">
          <div className="rounded-[22px] bg-[var(--card-strong)]/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)] font-semibold text-white">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="truncate text-xs text-[var(--ink-soft)]">{user.email}</p>
              </div>
            </div>
          </div>

          <nav className="mt-3 space-y-1">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-[var(--brand-soft)] text-slate-950"
                    : "text-[var(--foreground)] hover:bg-[var(--brand-soft)]",
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <div className="space-y-1">
              {secondaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                      ? "bg-slate-100 text-slate-950"
                      : "text-[var(--foreground)] hover:bg-slate-100",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="mt-1 w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] transition hover:bg-slate-100"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
