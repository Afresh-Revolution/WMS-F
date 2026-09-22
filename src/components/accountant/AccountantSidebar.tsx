"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  Gift,
  MinusCircle,
  BadgeDollarSign,
  ShoppingCart,
  FileText,
  Receipt,
  HandCoins,
  Building2,
  CreditCard,
  FileBarChart,
  Bell,
  UserRound,
  CircleHelp,
  Settings,
  LogOut,
} from "lucide-react";
import { AfreshLogo } from "@/components/layout/AfreshLogo";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { accountantApi } from "@/lib/api";
import { asRecord, unwrapAccountantData } from "@/lib/api/accountantMappers";
import { initials, str } from "@/lib/api/mappers";
import styles from "./AccountantSidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { href: "/accountant", label: "Overview", icon: LayoutDashboard },
  { href: "/accountant/payroll", label: "Payroll", icon: Wallet },
  { href: "/accountant/bonuses", label: "Bonuses", icon: Gift },
  { href: "/accountant/deductions", label: "Deductions", icon: MinusCircle },
  {
    href: "/accountant/salary-increments",
    label: "Salary Increments",
    icon: BadgeDollarSign,
  },
  { href: "/accountant/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/accountant/bills", label: "Bills & Invoices", icon: FileText },
  { href: "/accountant/expenses", label: "Expenses", icon: Receipt },
  {
    href: "/accountant/reimbursements",
    label: "Reimbursements",
    icon: HandCoins,
  },
  { href: "/accountant/vendors", label: "Vendors", icon: Building2 },
  { href: "/accountant/payments", label: "Payments", icon: CreditCard },
  {
    href: "/accountant/reports",
    label: "Financial Reports",
    icon: FileBarChart,
  },
  {
    href: "/accountant/notifications",
    label: "Notifications",
    icon: Bell,
  },
  { href: "/accountant/profile", label: "Profile", icon: UserRound },
];

const footerNav: NavItem[] = [
  { href: "/accountant/help", label: "Help center", icon: CircleHelp },
  { href: "/accountant/settings", label: "Settings", icon: Settings },
  { href: "/sign-out", label: "Sign out", icon: LogOut },
];

function isActive(pathname: string, href: string) {
  if (href === "/accountant") {
    return pathname === "/accountant";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountantSidebar({
  open = false,
  onNavigate,
}: {
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user: currentUser } = useCurrentUser();
  const { data: scopePayload } = useAsyncData(() => accountantApi.scope(), []);
  const scope = asRecord(unwrapAccountantData(scopePayload));
  const user = asRecord(scope.user ?? scope.profile ?? scope);
  const displayName = str(
    user.name ?? user.fullName ?? currentUser?.name,
    currentUser?.name || "Accountant",
  );
  const displayInitials = str(
    user.initials ?? currentUser?.initials,
    initials(displayName) || "—",
  );
  const unread = str(
    asRecord(scope.notifications).unread ?? user.unreadNotifications,
  );

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <Link href="/accountant" onClick={onNavigate} className={styles.brand}>
        <AfreshLogo />
      </Link>

      <Link
        href="/accountant/profile"
        onClick={onNavigate}
        className={`${styles.userCard} ${
          isActive(pathname, "/accountant/profile") ? styles.userCardActive : ""
        }`}
      >
        <div className={styles.avatar}>{displayInitials}</div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>{displayName}</p>
          <p className={styles.userRole}>Accountant</p>
        </div>
      </Link>

      <nav className={styles.nav} aria-label="Accountant">
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
              {label === "Notifications" && unread ? (
                <span className={styles.badgeAlert}>{unread}</span>
              ) : badge ? (
                <span className={styles.badge}>{badge}</span>
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
