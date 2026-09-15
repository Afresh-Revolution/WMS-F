"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarOff,
  TrendingUp,
  BadgeDollarSign,
  CalendarDays,
  ListTodo,
  Target,
  Wallet,
  CalendarRange,
  Clock,
  Gavel,
  GraduationCap,
  Megaphone,
  FileBarChart,
  ScrollText,
  KeyRound,
  ShieldCheck,
  Shield,
  Mail,
  BellRing,
  FileText,
  HardDrive,
  Activity,
  FileSearch,
  UserRound,
  CircleHelp,
  Settings,
  LogOut,
} from "lucide-react";
import { AfreshLogo } from "./AfreshLogo";
import { GlobalSearch } from "./GlobalSearch";
import styles from "./Sidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/leave", label: "Leave", icon: CalendarOff },
  { href: "/promotions", label: "Promotions", icon: TrendingUp },
  { href: "/salary-increments", label: "Salary Increments", icon: BadgeDollarSign },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/target", label: "Targets", icon: Target },
  { href: "/finance-payroll", label: "Finance", icon: Wallet },
  { href: "/events", label: "Events", icon: CalendarRange },
  { href: "/discipline", label: "Discipline", icon: Gavel },
  { href: "/nysc-interns", label: "NYSC & Interns", icon: GraduationCap },
  { href: "/announcements", label: "Announcements", icon: Megaphone, badge: "2" },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/audit", label: "Operational Audit Logs", icon: ScrollText },
  { href: "/user-access", label: "User Access", icon: KeyRound },
  { href: "/roles-permissions", label: "Roles & Permissions", icon: ShieldCheck },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/email-configuration", label: "Email Configuration", icon: Mail },
  { href: "/notification-configuration", label: "Notification Configuration", icon: BellRing },
  { href: "/document-templates", label: "Document Templates", icon: FileText },
  { href: "/backups", label: "Backups", icon: HardDrive },
  { href: "/system-health", label: "System Health", icon: Activity },
  { href: "/technical-audit-logs", label: "Technical Audit Logs", icon: FileSearch },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const footerNav: NavItem[] = [
  { href: "/help", label: "Help center", icon: CircleHelp },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar brand uses AfreshLogo — shared by every AppShell page. */
export function Sidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link href="/dashboard" onClick={onNavigate} className={styles.brand}>
        <AfreshLogo />
      </Link>

      <GlobalSearch />

      <Link href="/profile" onClick={onNavigate} className={`${styles.userCard} ${
          isActive(pathname, "/profile") ? styles.userCardActive : ""
        }`}
      >
        <div className={styles.avatar}>CI</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>Christy Ishaku</p>
          <p className={styles.userRole}>Super Admin</p>
        </div>
      </Link>

      <nav className={styles.nav}>
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
