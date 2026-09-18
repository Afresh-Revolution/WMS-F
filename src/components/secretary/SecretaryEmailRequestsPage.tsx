"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { secretaryApi } from "@/lib/api";
import {
  avatarColor,
  initials,
  listFrom,
  nestedStr,
  str,
} from "@/lib/api/mappers";
import {
  emailRequestFilters,
  emailRequestStats as fallbackStats,
  emailQueueRequests as fallbackRequests,
  type EmailQueueRequest,
  type EmailRequestFilter,
  type EmailRequestStat,
  type EmailRequestStatus,
} from "@/data/secretary";
import styles from "./SecretaryEmailRequestsPage.module.css";

const statusClass: Record<EmailRequestStatus, string> = {
  Pending: styles.statusPending,
  Failed: styles.statusFailed,
  Created: styles.statusCreated,
  Cancelled: styles.statusCancelled,
};

function mapStatus(value: unknown): EmailRequestStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("fail")) return "Failed";
  if (raw.includes("cancel")) return "Cancelled";
  if (raw.includes("creat") || raw.includes("done") || raw.includes("complete")) {
    return "Created";
  }
  return "Pending";
}

function mapRequest(record: Record<string, unknown>): EmailQueueRequest {
  const employee = record.employee;
  const requester = record.requestedBy ?? record.requester;
  const name = str(
    record.name ?? record.employeeName,
    nestedStr(employee, ["name", "fullName"]),
  );
  const email = str(
    record.email ?? record.requestedEmail ?? record.emailAddress,
    nestedStr(employee, ["companyEmail", "email"]),
  );
  return {
    id: str(record.id),
    requestId: str(record.requestId ?? record.code, str(record.id)),
    name,
    initials: str(record.initials, initials(name)),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    role: str(
      record.role ?? record.jobTitle,
      nestedStr(employee, ["jobTitle", "role"]),
    ),
    department: nestedStr(
      record.department ??
        (employee as Record<string, unknown> | undefined)?.department,
    ),
    email,
    status: mapStatus(record.status),
    requestedBy: str(record.requesterName, nestedStr(requester)),
    requestedByRole: str(record.requestedByRole ?? record.requesterRole, "HR"),
    requestedAt: str(
      record.requestedAt ?? record.requested_at ?? record.createdAt,
    ),
    hrNote: str(record.hrNote ?? record.hr_note ?? record.note ?? record.reason),
  };
}

export function SecretaryEmailRequestsPage({
  initialFilter = "Pending",
}: {
  initialFilter?: EmailRequestFilter;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<EmailRequestFilter>(initialFilter);
  const [query, setQuery] = useState("");

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.listEmailRequests(),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const requests = useMemo((): EmailQueueRequest[] => {
    const records = Array.isArray(data)
      ? data
      : listFrom((data ?? undefined) as never);
    if (data === null) return fallbackRequests;
    return records.map((record) => mapRequest(record));
  }, [data]);

  const stats = useMemo((): EmailRequestStat[] => {
    const counts: Record<EmailRequestFilter, number> = {
      Pending: requests.filter((item) => item.status === "Pending").length,
      Failed: requests.filter((item) => item.status === "Failed").length,
      Created: requests.filter((item) => item.status === "Created").length,
      Cancelled: requests.filter((item) => item.status === "Cancelled").length,
      All: requests.length,
    };
    return fallbackStats.map((stat) => ({
      ...stat,
      value: String(counts[stat.filter]),
    }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesFilter =
        activeFilter === "All" || request.status === activeFilter;
      const haystack =
        `${request.requestId} ${request.name} ${request.role} ${request.department} ${request.email}`.toLowerCase();
      return matchesFilter && haystack.includes(needle);
    });
  }, [activeFilter, query, requests]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        {loading ? <p className={styles.dateLabel}>Loading requests…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Using cached requests — {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className={styles.searchInput}
            />
            <kbd className={styles.shortcut}>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <p className={styles.breadcrumb}>Secretary → Company email requests</p>
      <h1 className={styles.title}>Email request queue</h1>
      <p className={styles.subtitle}>
        Receive company email requests from HR, review the employee details,
        check availability and provision mailboxes.
      </p>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <button
            key={stat.id}
            type="button"
            className={`${styles.statCard} ${
              activeFilter === stat.filter ? styles.statCardActive : ""
            }`}
            onClick={() => setActiveFilter(stat.filter)}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span
              className={
                stat.tone === "action"
                  ? styles.statTagAction
                  : stat.tone === "soft"
                    ? styles.statTagSoft
                    : styles.statTagMuted
              }
            >
              {stat.tag}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.filters} role="tablist" aria-label="Request filters">
        {emailRequestFilters.map((filter) => {
          const active = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveFilter(filter)}
              className={`${styles.filterChip} ${
                active ? styles.filterChipActive : ""
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <section className={styles.listSection}>
        <div className={styles.list}>
          {filteredRequests.map((request) => (
            <Link
              key={request.id}
              href={`/secretary/email-requests/${request.id}`}
              className={styles.listRow}
            >
              <span
                className={styles.avatar}
                style={{ background: request.avatarColor }}
              >
                {request.initials}
              </span>
              <div className={styles.rowBody}>
                <div className={styles.titleRow}>
                  <span className={styles.requestId}>{request.requestId}</span>
                  <h2 className={styles.name}>{request.name}</h2>
                  <span className={statusClass[request.status]}>
                    {request.status}
                  </span>
                </div>
                <p className={styles.meta}>
                  {request.role} • {request.department} • {request.email}
                </p>
              </div>
              <div className={styles.rowActions}>
                {request.status === "Failed" ? (
                  <span className={styles.retryChip}>
                    <span className={styles.retryDot} aria-hidden />
                    Needs retry
                  </span>
                ) : null}
                <ChevronRight size={18} className={styles.chevron} />
              </div>
            </Link>
          ))}

          {filteredRequests.length === 0 ? (
            <div className={styles.empty}>
              No email requests match this filter.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
