"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
<<<<<<< HEAD
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarDays,
  CalendarOff,
  CircleHelp,
  Home,
  LayoutDashboard,
  ListTodo,
=======
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
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
  LogOut,
  Megaphone,
  Settings,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { AfreshLogo } from "./AfreshLogo";
import { GlobalSearch } from "./GlobalSearch";
import styles from "./Sidebar.module.css";

<<<<<<< HEAD
export type SidebarVariant = "manager" | "intern";

export type SidebarUser = {
  name: string;
  initials: string;
  role?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: number;
  exact?: boolean;
};

const managerNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leave", label: "Leave", icon: CalendarOff },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/salary-increments", label: "Salary Increments", icon: BadgeDollarSign },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/promotions", label: "Promotions", icon: TrendingUp },
=======
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
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

<<<<<<< HEAD
const managerFooter: NavItem[] = [
=======
const footerNav: NavItem[] = [
  { href: "/help", label: "Help center", icon: CircleHelp },
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

<<<<<<< HEAD
const internNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/tasks", label: "My Tasks", icon: ListTodo },
  { href: "/meetings", label: "My Meetings", icon: CalendarDays },
  { href: "/dashboard#progress", label: "My Progress", icon: TrendingUp, exact: true },
  { href: "/announcements", label: "Announcements", icon: Megaphone, badge: 1 },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
  { href: "/settings", label: "Account Settings", icon: Settings },
];

const internFooter: NavItem[] = [
  { href: "/help", label: "Help center", icon: CircleHelp },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

const defaultUsers: Record<SidebarVariant, SidebarUser> = {
  manager: { name: "Deepa Sharma", initials: "DS" },
  intern: { name: "Chidi Eze", initials: "CE", role: "NYSC / Intern" },
};

function isActive(pathname: string, item: NavItem) {
  const href = item.href.split("#")[0];
  if (item.exact || href === "/dashboard") {
    return pathname === href || (href === "/dashboard" && pathname === "/");
=======
function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

<<<<<<< HEAD
export function Sidebar({
  variant = "manager",
  user,
}: {
  variant?: SidebarVariant;
  user?: SidebarUser;
=======
/** Sidebar brand uses AfreshLogo — shared by every AppShell page. */
export function Sidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
}) {
  const pathname = usePathname();
  const primaryNav = variant === "intern" ? internNav : managerNav;
  const footerNav = variant === "intern" ? internFooter : managerFooter;
  const displayUser = user ?? defaultUsers[variant];

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link href="/dashboard" onClick={onNavigate} className={styles.brand}>
        <AfreshLogo />
      </Link>

<<<<<<< HEAD
      <div className={styles.userCard}>
        <div className={styles.avatar}>{displayUser.initials}</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>{displayUser.name}</p>
          {displayUser.role ? (
            <p className={styles.userRole}>{displayUser.role}</p>
          ) : null}
=======
      <GlobalSearch />

      <Link href="/profile" onClick={onNavigate} className={`${styles.userCard} ${
          isActive(pathname, "/profile") ? styles.userCardActive : ""
        }`}
      >
        <div className={styles.avatar}>CI</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>Christy Ishaku</p>
          <p className={styles.userRole}>Super Admin</p>
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
        </div>
      </Link>

      <nav className={styles.nav}>
<<<<<<< HEAD
        {primaryNav.map((item) => {
          const { href, label, icon: Icon, badge } = item;
          const active = isActive(pathname, item) && !href.includes("#");
=======
        {primaryNav.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(pathname, href);
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              <span className={styles.navLabel}>{label}</span>
<<<<<<< HEAD
              {badge ? <span className={styles.navBadge}>{badge}</span> : null}
=======
              {badge ? <span className={styles.badge}>{badge}</span> : null}
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
<<<<<<< HEAD
        {footerNav.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className={styles.navLink}>
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
=======
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
>>>>>>> 37eb1224d5b2fc1ab1c618b51d1c98ba658180c9
      </div>
    </aside>
  );
}
