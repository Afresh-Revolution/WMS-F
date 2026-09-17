"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Download,
  ScrollText,
  Search,
  X,
} from "lucide-react";
import {
  type AuditFilter,
  type AuditModule,
} from "@/data/audit";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { downloadApiBlob } from "@/lib/export/downloadBlob";
import { listFrom, mapAuditEvent } from "@/lib/api/mappers";
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
  const { runAction, exportRows } = usePageActions();
  const [activeFilter, setActiveFilter] = useState<AuditFilter>(initialFilter);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const { data: auditData, loading, error } = useAsyncData(
    () =>
      superAdminApi.auditLogs.list(
        activeFilter === "Security"
          ? { category: "security" }
          : activeFilter === "Failed"
            ? { outcome: "failed" }
            : undefined,
      ),
    [activeFilter],
  );

  const events = useMemo(() => {
    return listFrom(auditData ?? undefined).map((record) => mapAuditEvent(record));
  }, [auditData]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        activeFilter === "All events" ||
        (activeFilter === "Security" && event.security) ||
        (activeFilter === "Failed" && event.outcome === "Failed");
      const haystack =
        `${event.user} ${event.action} ${event.target} ${event.module}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query, events]);

  function handleFilterChange(filter: AuditFilter) {
    setActiveFilter(filter);
    router.push(filterRoutes[filter]);
  }

  function exportLogs() {
    void runAction("Export audit logs", async () => {
      try {
        await downloadApiBlob(
          superAdminApi.auditLogs.exportPath(
            activeFilter === "Security"
              ? { category: "security" }
              : activeFilter === "Failed"
                ? { outcome: "failed" }
                : undefined,
          ),
          "audit-logs.csv",
        );
      } catch {
        exportRows(
          filtered.map((event) => ({
            time: event.time,
            date: event.date,
            user: event.user,
            action: event.action,
            target: event.target,
            module: event.module,
            ip: event.ip,
            outcome: event.outcome,
          })),
          "audit-logs.csv",
        );
      }
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
          <div className={styles.topActions}>
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>DO</ProfileLink>
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
          <button type="button" className={styles.exportButton} onClick={exportLogs}>
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
                        className={`${styles.module} ${
                          moduleClass[event.module as AuditModule] ?? ""
                        }`}
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
                        {event.outcome === "Failed" ? (
                          <X size={12} strokeWidth={2.5} />
                        ) : (
                          <Check size={12} strokeWidth={2.5} />
                        )}
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
  );
}
