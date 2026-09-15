"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  UserRound,
  ListChecks,
  CalendarDays,
  TrendingUp,
  Megaphone,
  Bell,
  SlidersHorizontal,
  CircleHelp,
  Settings,
  LogOut,
} from "lucide-react";
import { AfreshLogo } from "@/components/layout/AfreshLogo";
import { nyscAccounts } from "@/data/nyscOverview";
import { useAsyncData } from "@/hooks/useAsyncData";
import { internApi, internSettled } from "@/lib/api";
import { initials, str } from "@/lib/api/mappers";
import {
  asInternRecord,
  mapInternNotification,
  mapInternProfileType,
  unwrapInternData,
  unwrapInternList,
} from "@/lib/api/internMappers";
import styles from "./NyscSidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  alert?: boolean;
};

const primaryNav: NavItem[] = [
  { href: "/nysc", label: "Home", icon: Home },
  { href: "/nysc/profile", label: "My Profile", icon: UserRound },
  { href: "/nysc/tasks", label: "My Tasks", icon: ListChecks },
  { href: "/nysc/meetings", label: "My Meetings", icon: CalendarDays },
  { href: "/nysc/progress", label: "My Progress", icon: TrendingUp },
  {
    href: "/nysc/announcements",
    label: "Announcements",
    icon: Megaphone,
    badge: "1",
  },
  {
    href: "/nysc/notifications",
    label: "Notifications",
    icon: Bell,
    badge: "2",
    alert: true,
  },
  {
    href: "/nysc/account",
    label: "Account Settings",
    icon: SlidersHorizontal,
  },
];

const footerNav: NavItem[] = [
  { href: "/nysc/help", label: "Help center", icon: CircleHelp },
  { href: "/nysc/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

function isActive(pathname: string, href: string) {
  if (href === "/nysc") {
    return pathname === "/nysc";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NyscSidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const fallback = nyscAccounts.chidi;
  const { data: scopePayload } = useAsyncData(() => internApi.scope(), []);
  const { data: notifPayload } = useAsyncData(
    () => internSettled(internApi.notifications.list()),
    [],
  );

  const scope = asInternRecord(unwrapInternData(scopePayload));
  const profile = asInternRecord(scope.profile ?? scope);
  const type = mapInternProfileType(scope.type ?? profile.type, fallback.type);
  const displayName = str(
    profile.fullName ?? profile.name ?? scope.fullName,
    fallback.name,
  );
  const displayInitials = str(
    profile.initials,
    initials(displayName) || fallback.initials,
  );
  const sidebarRole = type === "NYSC" ? "NYSC Member" : "Intern";
  const notifications = unwrapInternList(notifPayload).map(mapInternNotification);
  const unread =
    notifPayload == null
      ? fallback.unreadNotifications
      : notifications.filter((item) => item.unread ?? item.featured).length;

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link href="/nysc" onClick={onNavigate} className={styles.brand}>
        <AfreshLogo />
      </Link>

      <Link
        href="/nysc/profile"
        onClick={onNavigate}
        className={`${styles.userCard} ${
          isActive(pathname, "/nysc/profile") ? styles.userCardActive : ""
        }`}
      >
        <div className={styles.avatar}>{displayInitials}</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>{displayName}</p>
          <p className={styles.userRole}>{sidebarRole}</p>
        </div>
      </Link>

      <nav className={styles.nav} aria-label="NYSC and Interns">
        {primaryNav.map(({ href, label, icon: Icon, badge, alert }) => {
          const active = isActive(pathname, href);
          const showBadge = label === "Notifications" ? unread > 0 : Boolean(badge);
          const badgeValue =
            label === "Notifications" ? String(unread) : badge;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              <span className={styles.navLabel}>{label}</span>
              {showBadge && badgeValue ? (
                <span className={alert ? styles.badgeAlert : styles.badge}>
                  {badgeValue}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {footerNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
