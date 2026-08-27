"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Download,
  ScrollText,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  auditEvents,
  type AuditFilter,
  type AuditModule,
} from "@/data/audit";
import styles from "./AuditPage.module.css";

const filters: AuditFilter[] = ["All events", "Security", "Failed"];

const filterRoutes: Record<AuditFilter, string> = {
  "All events": "/audit",
  Security: "/audit/security",
  Failed: "/audit/failed",
};

const moduleClass: Record<AuditModule, string> = {
  Leave: styles.modLeave,
  Discipline: styles.modDiscipline,
  Promotions: styles.modPromotions,
  Payroll: styles.modPayroll,
  System: styles.modSystem,
  Auth: styles.modAuth,
  Email: styles.modEmail,
  Purchases: styles.modPurchases,
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
        (activeFilter === "Failed" && event.outcome === "Failed");
      const haystack =
        `${event.user} ${event.action} ${event.target} ${event.module}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query]);

  function handleFilterChange(filter: AuditFilter) {
    setActiveFilter(filter);
    router.push(filterRoutes[filter]);
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <label className={styles.topSearch}>
              <Search size={15} className={styles.topSearchIcon} />
              <input
                placeholder="Search"
                className={styles.topSearchInput}
                readOnly
                aria-label="Search"
              />
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </label>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              DO
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Audit logs</p>
            <h1 className={styles.title}>Every action, on record</h1>
            <p className={styles.subtitle}>
              A complete, tamper-evident log of all significant system and
              operational activity.
            </p>
          </div>
          <button type="button" className={styles.exportButton}>
            <Download size={15} strokeWidth={2} />
            Export logs
          </button>
        </div>

        <div className={styles.filters}>
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilterChange(filter)}
              className={`${styles.filterChip} ${
                activeFilter === filter ? styles.filterChipActive : ""
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <label className={styles.tableSearch}>
          <Search size={16} className={styles.tableSearchIcon} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, action, or target..."
            className={styles.tableSearchInput}
          />
        </label>

        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <ScrollText size={15} strokeWidth={2} />
            <span>{filtered.length} events</span>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Module</th>
                  <th>IP</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    className={event.outcome === "Failed" ? styles.failedRow : ""}
                  >
                    <td>
                      <span className={styles.time}>{event.time}</span>
                      <span className={styles.date}>{event.date}</span>
                    </td>
                    <td className={styles.user}>{event.user}</td>
                    <td className={styles.action}>{event.action}</td>
                    <td className={styles.target}>{event.target}</td>
                    <td>
                      <span
                        className={`${styles.module} ${moduleClass[event.module]}`}
                      >
                        {event.module}
                      </span>
                    </td>
                    <td className={styles.ip}>{event.ip}</td>
                    <td>
                      <span
                        className={`${styles.outcome} ${
                          event.outcome === "Failed"
                            ? styles.outcomeFailed
                            : styles.outcomeSuccess
                        }`}
                      >
                        {event.outcome}
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
      </div>
    </AppShell>
  );
}
