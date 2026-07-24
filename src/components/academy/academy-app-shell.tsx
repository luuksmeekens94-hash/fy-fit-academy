"use client";

import {
  BadgeCheck,
  Bell,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Target,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { logoutAction } from "@/app/actions";
import { getNavigationItems, getRoleLabel } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { initials } from "@/lib/utils";

import styles from "./academy-shell.module.css";

type AcademyAppShellProps = {
  user: {
    name: string;
    role: Role;
    isOnboarding: boolean;
  };
  unreadCount: number;
  hasCriticalNotification: boolean;
  children: React.ReactNode;
};

const ICONS: Array<{ test: (href: string) => boolean; icon: LucideIcon }> = [
  { test: (href) => href === "/", icon: LayoutDashboard },
  { test: (href) => href === "/academy", icon: GraduationCap },
  { test: (href) => href.includes("certificates"), icon: BadgeCheck },
  { test: (href) => href === "/ontwikkeling", icon: Target },
  { test: (href) => href === "/onboarding", icon: ClipboardCheck },
  { test: (href) => href === "/bibliotheek", icon: Library },
  { test: (href) => href === "/team", icon: Users },
];

function iconFor(href: string) {
  return ICONS.find((entry) => entry.test(href))?.icon ?? BookOpen;
}

function matchesPath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AcademyAppShell({
  user,
  unreadCount,
  hasCriticalNotification,
  children,
}: AcademyAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigationItems = useMemo(
    () => getNavigationItems(user.role, user.isOnboarding),
    [user.role, user.isOnboarding],
  );
  const activeHref = navigationItems
    .filter((item) => matchesPath(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;
  const certificateItem = navigationItems.find((item) => item.href === "/academy/certificates");
  const secondaryBottomItem = navigationItems.find((item) => item.href === "/ontwikkeling")
    ?? navigationItems.find((item) => item.href === "/bibliotheek")
    ?? navigationItems.find((item) => item.href === "/");
  const bottomItems = [
    { href: "/academy", label: "Overzicht", icon: GraduationCap },
    certificateItem ? { ...certificateItem, label: "Bewijzen", icon: BadgeCheck } : null,
    secondaryBottomItem
      ? { ...secondaryBottomItem, label: secondaryBottomItem.href === "/ontwikkeling" ? "Ontwikkeling" : "Bibliotheek", icon: iconFor(secondaryBottomItem.href) }
      : null,
  ].filter((item): item is { href: string; label: string; icon: LucideIcon } => item !== null);

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <main className={`${styles.page} ${styles.productionPage}`}>
      <div className={`${styles.shell} ${styles.productionShell}`}>
        <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`} aria-label="Academynavigatie">
          <button type="button" className={styles.sidebarCloseButton} onClick={closeMenu} aria-label="Menu sluiten">
            <X size={18} aria-hidden="true" />
          </button>

          <div className={styles.brand}>
            <Link href="/academy" className={styles.logoPanel} onClick={closeMenu}>
              <Image src="/fyfit-logo-transparent.png" alt="Fy-fit" width={744} height={196} quality={100} priority />
            </Link>
            <span className={styles.productName}>Academy</span>
          </div>

          <div className={styles.sidebarRule} />

          <nav className={styles.primaryNav} aria-label="Hoofdnavigatie">
            {navigationItems.map((item) => {
              const Icon = iconFor(item.href);
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMenu}
                >
                  <span className={styles.navIcon}><Icon size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <Link href="/mijn-gegevens" className={styles.profileButton} onClick={closeMenu}>
              <span className={styles.avatar}>{initials(user.name)}</span>
              <span className={styles.profileMeta}>
                <strong>{user.name}</strong>
                <small>{getRoleLabel(user.role)}</small>
              </span>
              <UserRound size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={styles.logoutButton}>
                <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
                Uitloggen
              </button>
            </form>
          </div>
        </aside>

        {mobileMenuOpen ? <button type="button" className={styles.backdrop} onClick={closeMenu} aria-label="Menu sluiten" /> : null}

        <section className={styles.workspace}>
          <header className={styles.topbar}>
            <button type="button" className={styles.mobileMenuButton} onClick={() => setMobileMenuOpen(true)} aria-label="Menu openen">
              <Menu size={19} aria-hidden="true" />
            </button>

            <Link href="/academy" className={styles.mobileBrand}>
              <Image src="/fyfit-logo-transparent.png" alt="Fy-fit" width={744} height={196} quality={100} priority />
              <span>Academy</span>
            </Link>

            <div className={styles.shellTopbarTitle}>
              <GraduationCap size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>Fy-fit Academy</span>
            </div>

            <div className={styles.topbarActions}>
              <button
                type="button"
                className={hasCriticalNotification || unreadCount > 0 ? styles.hasNotifications : undefined}
                onClick={() => router.push("/#nieuws-signalen")}
                aria-label={unreadCount > 0 ? `${unreadCount} ongelezen meldingen` : "Geen ongelezen meldingen"}
              >
                <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button type="button" className={styles.topbarAvatar} onClick={() => router.push("/mijn-gegevens")} aria-label="Mijn profiel openen">
                {initials(user.name)}
              </button>
            </div>
          </header>

          <div className={styles.content}>{children}</div>
        </section>
      </div>

      <nav className={styles.mobileBottomNav} aria-label="Mobiele hoofdnavigatie">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? styles.mobileBottomNavActive : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Meer navigatie openen">
          <Menu size={19} strokeWidth={1.9} aria-hidden="true" />
          <span>Meer</span>
        </button>
      </nav>
    </main>
  );
}
