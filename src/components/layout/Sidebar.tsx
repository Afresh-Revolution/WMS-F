"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarOff,
  CalendarDays,
  BadgeDollarSign,
  TrendingUp,
  Users,
  Building2,
  Wallet,
  Target,
  ListTodo,
  Settings,
  LogOut,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const primaryNav = [
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

const footerNav = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Log out", icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandName}>AYUSH</span>
      </div>

      <div className={styles.userCard}>
        <div className={styles.avatar}>DS</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>Deepa Sharma</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/dashboard" && pathname === "/") ||
            pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {footerNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={styles.navLink}>
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
