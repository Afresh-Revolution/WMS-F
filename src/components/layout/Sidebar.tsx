"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarDays,
  CalendarOff,
  CircleHelp,
  Home,
  LayoutDashboard,
  ListTodo,
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
import styles from "./Sidebar.module.css";

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
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/finance-payroll", label: "Finance - Payroll", icon: Wallet },
  { href: "/target", label: "Target", icon: Target },
];

const managerFooter: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Log out", icon: LogOut },
];

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
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  variant = "manager",
  user,
}: {
  variant?: SidebarVariant;
  user?: SidebarUser;
}) {
  const pathname = usePathname();
  const primaryNav = variant === "intern" ? internNav : managerNav;
  const footerNav = variant === "intern" ? internFooter : managerFooter;
  const displayUser = user ?? defaultUsers[variant];

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.brand}>
        <AfreshLogo />
      </Link>

      <div className={styles.userCard}>
        <div className={styles.avatar}>{displayUser.initials}</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>{displayUser.name}</p>
          {displayUser.role ? (
            <p className={styles.userRole}>{displayUser.role}</p>
          ) : null}
        </div>
      </div>

      <nav className={styles.nav}>
        {primaryNav.map((item) => {
          const { href, label, icon: Icon, badge } = item;
          const active = isActive(pathname, item) && !href.includes("#");
          return (
            <Link
              key={label}
              href={href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              <span className={styles.navLabel}>{label}</span>
              {badge ? <span className={styles.navBadge}>{badge}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {footerNav.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className={styles.navLink}>
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
