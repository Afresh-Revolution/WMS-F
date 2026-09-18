"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Clock,
  Gavel,
  Megaphone,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAttendanceMonitor } from "@/hooks/useAttendanceMonitor";
import { useAsyncData } from "@/hooks/useAsyncData";
import { managerApi } from "@/lib/api";
import { asAttendanceRecord } from "@/lib/api/attendanceMappers";
import { num, str } from "@/lib/api/mappers";
import styles from "./ManagerHomePage.module.css";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function formatTopDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ManagerHomePage() {
  const { user } = useCurrentUser();
  const monitor = useAttendanceMonitor("manager");
  const today = useMemo(() => new Date(), []);
  const displayName = user?.name || "Manager";

  const { data, loading, error } = useAsyncData(async () => {
    try {
      return await managerApi.getDashboard();
    } catch {
      return null;
    }
  }, []);

  const dashboard = asAttendanceRecord(data);
  const pendingLeave = num(
    dashboard.pendingLeave ?? dashboard.leavePending ?? dashboard.pendingApprovals,
  );
  const openCases = num(
    dashboard.openDiscipline ?? dashboard.disciplineOpen ?? dashboard.openCases,
  );
  const greeting = `Good morning, ${firstName(displayName)}.`;

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading || monitor.loading}
        error={error || monitor.error}
        resource="manager workspace"
      />
      <header className={styles.topBar}>
        <p>{formatTopDate(today)}</p>
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "M"}
          </ProfileLink>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Overview</p>
          <h1>{greeting}</h1>
          <p>
            {str(dashboard.subtitle) ||
              "Review your team, clock in for the day, and follow up on exceptions."}
          </p>
          <Link href="/manager/attendance" className={styles.heroButton}>
            Open my attendance <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="Manager summary">
        {monitor.stats.slice(0, 4).map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <strong>{stat.value}</strong>
            <h2>{stat.label}</h2>
            <p>Team attendance today</p>
          </article>
        ))}
      </section>

      <div className={styles.links}>
        <Link href="/manager/attendance" className={styles.linkCard}>
          <span className={styles.linkIcon}>
            <Clock size={16} />
          </span>
          <div>
            <h2>My attendance</h2>
            <p>Clock in, review recent days, and open company attendance.</p>
          </div>
          <ChevronRight size={16} />
        </Link>
        <Link href="/manager/discipline" className={styles.linkCard}>
          <span className={styles.linkIcon}>
            <Gavel size={16} />
          </span>
          <div>
            <h2>Discipline</h2>
            <p>
              {openCases
                ? `${openCases} open case${openCases === 1 ? "" : "s"} in your team.`
                : "Review active cases for your team."}
            </p>
          </div>
          <ChevronRight size={16} />
        </Link>
        <Link href="/manager/announcements" className={styles.linkCard}>
          <span className={styles.linkIcon}>
            <Megaphone size={16} />
          </span>
          <div>
            <h2>Announcements</h2>
            <p>
              {pendingLeave
                ? `${pendingLeave} pending leave item${pendingLeave === 1 ? "" : "s"} also need a look.`
                : "Share updates with your department."}
            </p>
          </div>
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
