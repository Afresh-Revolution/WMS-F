"use client";

import Link from "next/link";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";

export function AccountantProfileChip({ className }: { className: string }) {
  const { user } = useCurrentUser();
  return (
    <Link href="/accountant/profile" className={className} aria-label="Profile">
      {user?.initials || "—"}
    </Link>
  );
}
