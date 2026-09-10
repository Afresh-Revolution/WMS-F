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
  BookUser,
  Bell,
} from "lucide-react";
import { AfreshLogo } from "./AfreshLogo";
import { GlobalSearch } from "./GlobalSearch";
import { useCurrentUser } from "./CurrentUserProvider";
import styles from "./Sidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const adminPrimaryNav: NavItem[] = [
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

const secretaryPrimaryNav: NavItem[] = [
  { href: "/secretary", label: "Overview", icon: LayoutDashboard },
  {
    href: "/secretary/email-requests",
    label: "Company Email Requests",
    icon: Mail,
    badge: "3",
  },
  {
    href: "/secretary/email-directory",
    label: "Company Email Directory",
    icon: BookUser,
  },
  { href: "/secretary/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/secretary/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/secretary/tasks", label: "Management Tasks", icon: ListTodo },
  { href: "/secretary/reminders", label: "Reminders", icon: Bell },
];

const employeePrimaryNav: NavItem[] = [
  { href: "/employee", label: "Home", icon: LayoutDashboard },
  { href: "/employee/profile", label: "My Profile", icon: UserRound },
  { href: "/employee/leave", label: "My Leave", icon: CalendarOff },
  { href: "/employee/tasks", label: "My Tasks", icon: ListTodo },
  { href: "/employee/meetings", label: "My Meetings", icon: CalendarDays },
  { href: "/employee/expenses", label: "My Expenses", icon: Wallet },
  {
    href: "/employee/reimbursements",
    label: "My Reimbursements",
    icon: BadgeDollarSign,
  },
  { href: "/employee/records", label: "My Records", icon: FileText },
  {
    href: "/employee/announcements",
    label: "Announcements",
    icon: Megaphone,
    badge: "2",
  },
  {
    href: "/employee/notifications",
    label: "Notifications",
    icon: Bell,
    badge: "3",
  },
  {
    href: "/employee/settings",
    label: "Account Settings",
    icon: Settings,
  },
];

const footerNav: NavItem[] = [
  { href: "/help", label: "Help center", icon: CircleHelp },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

function isSecretaryPath(pathname: string) {
  return pathname === "/secretary" || pathname.startsWith("/secretary/");
}

function isEmployeePath(pathname: string) {
  return pathname === "/employee" || pathname.startsWith("/employee/");
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  if (href === "/secretary") {
    return pathname === "/secretary";
  }
  if (href === "/employee") {
    return pathname === "/employee";
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
  const secretary = isSecretaryPath(pathname);
  const employee = isEmployeePath(pathname);
  const primaryNav = secretary
    ? secretaryPrimaryNav
    : employee
      ? employeePrimaryNav
      : adminPrimaryNav;
  const homeHref = secretary ? "/secretary" : employee ? "/employee" : "/dashboard";
  const { user: currentUser } = useCurrentUser();
  const fallbackRole = secretary
    ? "Secretary"
    : employee
      ? "Employee"
      : "Super Admin";
  const user = {
    initials: currentUser?.initials ?? "",
    name: currentUser?.name ?? "",
    role: currentUser?.role || fallbackRole,
  };
  const profileHref = secretary
    ? "/secretary/profile"
    : employee
      ? "/employee/profile"
      : "/profile";

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link href={homeHref} onClick={onNavigate} className={styles.brand}>
        <AfreshLogo />
      </Link>

      {secretary || employee ? null : <GlobalSearch />}

      <Link href={profileHref} onClick={onNavigate} className={`${styles.userCard} ${
          isActive(pathname, profileHref) ? styles.userCardActive : ""
        }`}
        aria-label={user.name ? `${user.name}, ${user.role}` : user.role}
      >
        <div className={styles.avatar} aria-hidden={!user.initials}>
          {user.initials}
        </div>
        <div className={styles.userMeta}>
          {user.name ? <p className={styles.userName}>{user.name}</p> : null}
          <p className={styles.userRole}>{user.role}</p>
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
