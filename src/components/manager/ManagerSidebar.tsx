"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Users,
  Building2,
  CalendarOff,
  TrendingUp,
  Clock,
  BadgeDollarSign,
  CalendarDays,
  ListTodo,
  Target,
  Wallet,
  CalendarRange,
  Gavel,
  GraduationCap,
  Megaphone,
  FileBarChart,
  ScrollText,
  Bell,
  UserRound,
  CircleHelp,
  Settings,
  LogOut,
} from "lucide-react";
import { AfreshLogo } from "@/components/layout/AfreshLogo";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { initials } from "@/lib/api/mappers";
import styles from "./ManagerSidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { href: "/manager", label: "Overview", icon: Home },
  { href: "/manager/employees", label: "Employees", icon: Users },
  { href: "/manager/departments", label: "Departments", icon: Building2 },
  { href: "/manager/leave", label: "Leave", icon: CalendarOff },
  { href: "/manager/promotions", label: "Promotions", icon: TrendingUp },
  { href: "/manager/attendance", label: "Attendance", icon: Clock },
  {
    href: "/manager/salary-increments",
    label: "Salary Increments",
    icon: BadgeDollarSign,
  },
  { href: "/manager/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/manager/tasks", label: "Tasks", icon: ListTodo },
  { href: "/manager/target", label: "Targets", icon: Target },
  { href: "/manager/finance-payroll", label: "Finance", icon: Wallet },
  { href: "/manager/events", label: "Events", icon: CalendarRange },
  { href: "/manager/discipline", label: "Discipline", icon: Gavel },
  { href: "/manager/nysc-interns", label: "NYSC & Interns", icon: GraduationCap },
  { href: "/manager/announcements", label: "Announcements", icon: Megaphone },
  { href: "/manager/reports", label: "Reports", icon: FileBarChart },
  { href: "/manager/audit", label: "Audit Logs", icon: ScrollText },
  {
    href: "/manager/notifications",
    label: "Notifications",
    icon: Bell,
    badge: "3",
  },
  { href: "/manager/profile", label: "Profile", icon: UserRound },
];

const footerNav: NavItem[] = [
  { href: "/manager/help", label: "Help center", icon: CircleHelp },
  { href: "/manager/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

function isActive(pathname: string, href: string) {
  if (href === "/manager") return pathname === "/manager";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagerSidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const displayName = user?.name || "Manager";
  const displayInitials = user?.initials || initials(displayName) || "M";
  const role = user?.role || "Manager";

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link href="/manager" onClick={onNavigate} className={styles.brand}>
        <AfreshLogo />
      </Link>

      <Link
        href="/manager/profile"
        onClick={onNavigate}
        className={`${styles.userCard} ${
          isActive(pathname, "/manager/profile") ? styles.userCardActive : ""
        }`}
      >
        <div className={styles.avatar}>{displayInitials}</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>{displayName}</p>
          <p className={styles.userRole}>{role}</p>
        </div>
      </Link>

      <nav className={styles.nav} aria-label="Manager">
        {primaryNav.map(({ href, label, icon: Icon, badge }) => {
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
              {badge ? <span className={styles.badge}>{badge}</span> : null}
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
