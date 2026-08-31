import Link from "next/link";
import { Bell } from "lucide-react";

type LinkButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

const linkStyle = { textDecoration: "none" as const };

export function NotificationsLink({ className, children }: LinkButtonProps) {
  return (
    <Link
      href="/announcements"
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
  return (
    <Link href="/profile" className={className} aria-label="Profile" style={linkStyle}>
      {children}
    </Link>
  );
}
