"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

type LinkButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

const linkStyle = { textDecoration: "none" as const };

export function NotificationsLink({ className, children }: LinkButtonProps) {
  const pathname = usePathname();
  const href = pathname.startsWith("/secretary")
    ? "/secretary/notifications"
    : pathname.startsWith("/employee")
      ? "/employee/notifications"
      : "/notifications";
  return (
    <Link
      href={href}
      className={className}
      aria-label="Notifications"
      style={linkStyle}
    >
      {children ?? <Bell size={16} />}
    </Link>
  );
}

export function ProfileLink({
  className,
  children,
}: LinkButtonProps & { children: React.ReactNode }) {
  const pathname = usePathname();
  const href = pathname.startsWith("/secretary")
    ? "/secretary/profile"
    : pathname.startsWith("/employee")
      ? "/employee/profile"
      : "/profile";
  return (
    <Link href={href} className={className} aria-label="Profile" style={linkStyle}>
      {children}
    </Link>
  );
}
