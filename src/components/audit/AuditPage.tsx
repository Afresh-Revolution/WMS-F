"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Download,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  auditEvents,
  type AuditCategory,
  type AuditFilter,
} from "@/data/audit";
import styles from "./AuditPage.module.css";

const filters: AuditFilter[] = ["All events", "Security", "Failed"];

const filterRoutes: Record<AuditFilter, string> = {
  "All events": "/audit",
  Security: "/audit/security",
  Failed: "/audit/failed",
};

const categoryClass: Record<AuditCategory, string> = {
  Leave: styles.catLeave,
  Discipline: styles.catDiscipline,
  Promotions: styles.catPromotions,
  Payroll: styles.catPayroll,
  System: styles.catSystem,
  Auth: styles.catAuth,
  Email: styles.catEmail,
  Purchase: styles.catPurchase,
};

type AuditPageProps = {
  initialFilter?: AuditFilter;
};

export function AuditPage({ initialFilter = "All events" }: AuditPageProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<AuditFilter>(initialFilter);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const filtered = useMemo(() => {
    return auditEvents.filter((event) => {
      const matchesFilter =
        activeFilter === "All events" ||
        (activeFilter === "Security" && event.security) ||
        (activeFilter === "Failed" && event.status === "Failed");
      const haystack =
        `${event.user} ${event.action} ${event.target} ${event.category}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query]);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>
            <span>Audits</span>
            <span className={styles.crumbSep}>›</span>
            <span>August 1</span>
          </p>
          <div className={styles.topActions}>
            <button type="button" aria-label="Search" className={styles.iconButton}>
              <Search size={16} />
            </button>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.iconButton}>
              <UserRound size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Every action, on record</h1>
            <p className={styles.subtitle}>
              A complete, tamper-evident log of all significant admin and
              operations activity.
            </p>
          </div>
          <button type="button" className={styles.exportButton}>
            <Download size={15} />
            Export logs
          </button>
        </div>

        <div className={styles.filters}>
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                router.push(filterRoutes[filter]);
              }}
              className={`${styles.filterChip} ${
                activeFilter === filter ? styles.filterChipActive : ""
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <label className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, action, or insight..."
            className={styles.searchInput}
          />
        </label>

        <p className={styles.count}>{filtered.length} events</p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Target</th>
                <th>Category</th>
                <th>IP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr
                  key={event.id}
                  className={event.status === "Failed" ? styles.failedRow : ""}
                >
                  <td>
                    <span className={styles.time}>{event.time}</span>
                    <span className={styles.date}>{event.date}</span>
                  </td>
                  <td>
                    <span className={styles.userCell}>
                      {event.showAvatar && (
                        <span className={styles.userAvatar}>
                          <UserRound size={12} />
                        </span>
                      )}
                      {event.user}
                    </span>
                  </td>
                  <td className={styles.action}>{event.action}</td>
                  <td>
                    <span className={styles.target}>
                      {event.target}
                      {event.editable && (
                        <button type="button" className={styles.editLink}>
                          (Edit)
                        </button>
                      )}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.category} ${categoryClass[event.category]}`}
                    >
                      {event.category}
                    </span>
                  </td>
                  <td className={styles.ip}>{event.ip}</td>
                  <td>
                    <span
                      className={`${styles.status} ${
                        event.status === "Failed"
                          ? styles.statusFailed
                          : styles.statusSuccess
                      }`}
                    >
                      {event.status === "Failed" ? (
                        <X size={12} strokeWidth={2.5} />
                      ) : (
                        <Check size={12} strokeWidth={2.5} />
                      )}
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    No events in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
