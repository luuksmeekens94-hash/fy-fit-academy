"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--brand)] text-white shadow-sm"
          : "bg-white/75 text-[var(--ink-soft)] hover:border-[var(--brand)] hover:text-[var(--foreground)]",
      )}
      style={{ border: active ? "1px solid var(--brand)" : "1px solid var(--border)" }}
    >
      {label}
    </Link>
  );
}
