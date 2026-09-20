"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Gavel,
  Megaphone,
  Search,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useAttendanceMonitor } from "@/hooks/useAttendanceMonitor";
import { useAsyncData } from "@/hooks/useAsyncData";
import { managerApi } from "@/lib/api";
import { asAttendanceRecord } from "@/lib/api/attendanceMappers";
import { num } from "@/lib/api/mappers";
import styles from "./ManagerHomePage.module.css";

export function ManagerHomePage() {
  const monitor = useAttendanceMonitor("manager");

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
  const awaitingDecisions = useMemo(() => {
    const fromDashboard = num(
      dashboard.pendingApprovals ??
        dashboard.awaitingDecisions ??
        dashboard.pendingDecisions ??
        dashboard.pendingLeave ??
        dashboard.leavePending,
    );
    return fromDashboard || pendingLeave;
  }, [dashboard, pendingLeave]);

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading || monitor.loading}
        error={error || monitor.error}
        resource="manager workspace"
      />

      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
            />
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip} />
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Admin · Operations control</p>
          <h1 className={styles.heroTitle}>Your workforce is in motion.</h1>
          <p className={styles.heroSubtitle}>
            You are the final operational approver. Review decisions, monitor
            finances and keep every department on track.
          </p>
          <Link href="/manager/leave" className={styles.heroButton}>
            Review approvals <ArrowRight size={14} />
          </Link>
        </div>
        <p className={styles.heroAwaiting}>
          <span>Awaiting you</span>
          <strong>
            {awaitingDecisions} decision{awaitingDecisions === 1 ? "" : "s"}
          </strong>
        </p>
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
          <ArrowRight size={16} />
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
          <ArrowRight size={16} />
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
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
