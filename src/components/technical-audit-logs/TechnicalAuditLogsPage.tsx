"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Info,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  technicalAuditFilters,
  type TechnicalAuditFilter,
  type TechnicalAuditSeverity,
} from "@/data/technicalAuditLogs";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { downloadApiBlob } from "@/lib/export/downloadBlob";
import { listFrom, mapTechnicalAuditEvent } from "@/lib/api/mappers";
import styles from "./TechnicalAuditLogsPage.module.css";

const filterRoutes: Record<TechnicalAuditFilter, string> = {
  All: "/technical-audit-logs",
  Info: "/technical-audit-logs/info",
  Warning: "/technical-audit-logs/warning",
  Critical: "/technical-audit-logs/critical",
};

const severityClass: Record<TechnicalAuditSeverity, string> = {
  Info: styles.severityInfo,
  Warning: styles.severityWarning,
  Critical: styles.severityCritical,
};

const iconWrapClass: Record<TechnicalAuditSeverity, string> = {
  Info: styles.iconInfo,
  Warning: styles.iconWarning,
  Critical: styles.iconCritical,
};

function SeverityIcon({ severity }: { severity: TechnicalAuditSeverity }) {
  if (severity === "Warning") {
    return <AlertTriangle size={16} strokeWidth={2.25} />;
  }
  if (severity === "Critical") {
    return <ShieldAlert size={16} strokeWidth={2.25} />;
  }
  return <Info size={16} strokeWidth={2.25} />;
}

type TechnicalAuditLogsPageProps = {
  initialFilter?: TechnicalAuditFilter;
};

export function TechnicalAuditLogsPage({
  initialFilter = "All",
}: TechnicalAuditLogsPageProps) {
  const router = useRouter();
  const { runAction, exportRows } = usePageActions();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<TechnicalAuditFilter>(initialFilter);

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const severityParam =
    activeFilter === "All" ? undefined : activeFilter.toLowerCase();

  const { data: eventsData, loading, error } = useAsyncData(
    () =>
      superAdminApi.technicalAuditLogs.list(
        severityParam ? { severity: severityParam } : undefined,
      ),
    [severityParam],
  );

  const events = useMemo(() => {
    return listFrom(eventsData ?? undefined).map((record) =>
      mapTechnicalAuditEvent(record),
    );
  }, [eventsData]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        activeFilter === "All" || event.severity === activeFilter;
      const haystack =
        `${event.actor} ${event.area} ${event.title} ${event.summary}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query, events]);

  function handleFilterChange(filter: TechnicalAuditFilter) {
    setActiveFilter(filter);
    router.push(filterRoutes[filter]);
  }

  function exportLogs() {
    void runAction("Export technical audit logs", async () => {
      try {
        await downloadApiBlob(
          superAdminApi.technicalAuditLogs.exportPath(
            severityParam ? { severity: severityParam } : undefined,
          ),
          "technical-audit-logs.csv",
        );
      } catch {
        exportRows(
          filteredEvents.map((event) => ({
            title: event.title,
            area: event.area,
            severity: event.severity,
            actor: event.actor,
            summary: event.summary,
            timestamp:
              "timestamp" in event
                ? event.timestamp
                : (event as { occurredAt?: string }).occurredAt,
          })),
          "technical-audit-logs.csv",
        );
      }
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>System · Audit</p>
          <h1 className={styles.title}>Technical audit logs</h1>
          <p className={styles.subtitle}>
            An immutable record of every platform-level change: configuration,
            access, security and data operations.
          </p>
          {loading ? <p className={styles.subtitle}>Loading audit logs…</p> : null}
          {error ? (
            <p className={styles.subtitle} role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <button type="button" className={styles.exportButton} onClick={exportLogs}>
          <Download size={15} strokeWidth={2} />
          Export logs
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.listSearch}>
          <Search size={16} className={styles.listSearchIcon} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search actor, area or action..."
            className={styles.listSearchInput}
          />
        </label>
        <div className={styles.filters}>
          {technicalAuditFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.list}>
        {filteredEvents.length === 0 ? (
          <p className={styles.empty}>No technical audit events match your filters.</p>
        ) : (
          filteredEvents.map((event) => (
            <article key={event.id} className={styles.row}>
              <span
                className={`${styles.eventIcon} ${iconWrapClass[event.severity]}`}
                aria-hidden
              >
                <SeverityIcon severity={event.severity} />
              </span>

              <div className={styles.eventCopy}>
                <div className={styles.eventTitleRow}>
                  <h2 className={styles.eventTitle}>{event.title}</h2>
                  <span className={styles.eventArea}>{event.area}</span>
                  <span
                    className={`${styles.severity} ${severityClass[event.severity]}`}
                  >
                    <span className={styles.severityDot} aria-hidden />
                    {event.severity}
                  </span>
                </div>

                <p className={styles.eventDetail}>
                  <span>{event.summary}</span>
                  {"change" in event && event.change ? (() => {
                    const change = event.change as {
                      from: string;
                      to: string;
                      note?: string;
                    };
                    return (
                    <>
                      <span className={styles.changeTag}>{change.from}</span>
                      <span className={styles.changeArrow} aria-hidden>
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </span>
                      <span className={styles.changeTag}>{change.to}</span>
                      {change.note ? (
                        <span className={styles.changeNote}>{change.note}</span>
                      ) : null}
                    </>
                    );
                  })() : null}
                </p>

                <p className={styles.eventMeta}>
                  by {event.actor} · {"timestamp" in event ? event.timestamp : (event as { occurredAt?: string }).occurredAt}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
