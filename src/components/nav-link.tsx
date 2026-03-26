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
          ? "bg-white text-[var(--brand-deep)] shadow-sm"
          : "text-white/82 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}
