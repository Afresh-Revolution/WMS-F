"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  Heart,
  Plane,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  leaveTabs,
  type LeaveRequestStatus,
  type LeaveTab,
} from "@/data/leave";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  applyForLeave,
  approveLeaveRequest,
  listLeaveBalances,
  listLeaveTypes,
  listMyLeave,
  listOrganisationLeave,
  rejectLeaveRequest,
} from "@/lib/api";
import { listFrom, mapLeaveBalance, mapLeaveRequest } from "@/lib/api/mappers";
import styles from "./LeavePage.module.css";

const balanceIcons = {
  annual: Plane,
  sick: Heart,
  parental: Users,
  personal: Briefcase,
} as const;

const statusClass: Record<LeaveRequestStatus, string> = {
  Pending: styles.statusPending,
  Approved: styles.statusApproved,
  Declined: styles.statusDeclined,
};

const requestLeaveFields = [
  {
    name: "leaveTypeId",
    label: "Leave type",
    type: "select" as const,
    required: true,
    fullWidth: true,
    options: [] as { label: string; value: string }[],
  },
  {
    name: "startDate",
    label: "From",
    type: "date" as const,
    required: true,
    placeholder: "mm/dd/yyyy",
  },
  {
    name: "endDate",
    label: "To",
    type: "date" as const,
    required: true,
    placeholder: "mm/dd/yyyy",
  },
  {
    name: "reason",
    label: "Note",
    type: "textarea" as const,
    placeholder: "Optional context for your manager",
    fullWidth: true,
    rows: 3,
  },
];

function formatShortDate(value: string) {
  const text = value.trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function prettyRange(range: string) {
  const parts = range.split(/\s*[–-]\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${formatShortDate(parts[0])} – ${formatShortDate(parts[1])}`;
  }
  return formatShortDate(range) || range;
}

export function LeavePage() {
  const [activeTab, setActiveTab] = useState<LeaveTab>("Requests");
  const [requestOpen, setRequestOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { runAction } = usePageActions();

  const { data: leaveData, loading, error, refetch } = useAsyncData(
    () => listOrganisationLeave(),
    [],
  );

  const { data: myLeaveData, refetch: refetchMine } = useAsyncData(
    () => listMyLeave().catch(() => []),
    [],
  );

  const { data: typeData } = useAsyncData(
    () => listLeaveTypes().catch(() => []),
    [],
  );

  const { data: balanceData, refetch: refetchBalances } = useAsyncData(
    () => listLeaveBalances().catch(() => null),
    [],
  );

  const leaveRequests = useMemo(
    () =>
      listFrom(leaveData ?? undefined).map((record) => mapLeaveRequest(record)),
    [leaveData],
  );

  const myLeave = useMemo(
    () =>
      listFrom(myLeaveData ?? undefined).map((record) => mapLeaveRequest(record)),
    [myLeaveData],
  );

  const leaveBalances = useMemo(() => {
    return listFrom(balanceData ?? undefined).map((record, index) =>
      mapLeaveBalance(record, index),
    );
  }, [balanceData]);

  const createFields = useMemo(() => {
    const types = Array.isArray(typeData) ? typeData : [];
    return requestLeaveFields.map((field) => {
      if (field.name !== "leaveTypeId") return field;
      return {
        ...field,
        defaultValue: types[0]?.id,
        options: types.map((item) => ({ label: item.name, value: item.id })),
      };
    });
  }, [typeData]);

  const visibleRequests = useMemo(() => {
    const source = activeTab === "My leave" ? myLeave : leaveRequests;
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((request) =>
      `${request.name} ${request.type} ${request.dateRange}`.toLowerCase().includes(needle),
    );
  }, [activeTab, leaveRequests, myLeave, query]);

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, typeof leaveRequests>();
    for (const request of visibleRequests) {
      const key = prettyRange(request.dateRange) || "Upcoming";
      const list = groups.get(key) ?? [];
      list.push(request);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [visibleRequests]);

  function refreshAll() {
    return Promise.all([refetch(), refetchMine(), refetchBalances()]);
  }

  function approveLeave(id: string, name: string) {
    void runAction(`Approve ${name}'s leave`, async () => {
      await approveLeaveRequest(id);
      await refreshAll();
    }).catch(() => undefined);
  }

  function rejectLeave(id: string, name: string) {
    void runAction(`Decline ${name}'s leave`, async () => {
      await rejectLeaveRequest(id, "Declined from the leave queue.");
      await refreshAll();
    }).catch(() => undefined);
  }

  async function handleRequestLeave(values: Record<string, string>) {
    await runAction("Request leave", async () => {
      await applyForLeave({
        leaveTypeId: values.leaveTypeId,
        startDate: values.startDate,
        endDate: values.endDate,
        durationType: "FULL_DAY",
        note: values.reason,
      });
      await refreshAll();
    });
  }

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        status={
          loading ? (
            <p className={styles.statusLine}>Loading leave…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Leave &amp; wellbeing</p>
          <h1 className={styles.title}>Time away, thoughtfully managed</h1>
          <p className={styles.subtitle}>
            Request time off, track balances, and keep your team covered — all in
            one calm place.
          </p>
        </div>
        <button
          type="button"
          className={styles.requestButton}
          onClick={() => setRequestOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          Request leave
        </button>
      </div>

      {leaveBalances.length > 0 ? (
        <div className={styles.balances}>
          {leaveBalances.map((balance) => {
            const Icon = balanceIcons[balance.icon];
            const percentUsed =
              balance.total > 0 ? (balance.used / balance.total) * 100 : 0;

            return (
              <article key={balance.id} className={styles.balanceCard}>
                <div className={styles.balanceTop}>
                  <span className={styles.balanceIcon}>
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <p className={styles.balanceRemaining}>
                    {balance.remaining} left
                  </p>
                </div>
                <p className={styles.balanceLabel}>{balance.label}</p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                </div>
                <p className={styles.balanceMeta}>
                  {balance.used} of {balance.total} days used
                </p>
              </article>
            );
          })}
        </div>
      ) : null}

      <div className={styles.filters}>
        {leaveTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`${styles.filterChip} ${
              activeTab === tab ? styles.filterChipActive : ""
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className={styles.panel}>
        {activeTab === "Team calendar" ? (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Team calendar</h2>
              <p className={styles.sectionSubtitle}>
                Upcoming time off across the organisation.
              </p>
            </div>
            {calendarGroups.length === 0 ? (
              <p className={styles.empty}>No leave on the calendar yet.</p>
            ) : (
              calendarGroups.map(([label, items]) => (
                <div key={label} className={styles.calendarGroup}>
                  <p className={styles.calendarLabel}>{label}</p>
                  {items.map((request) => (
                    <article key={request.id} className={styles.requestRow}>
                      <div className={styles.requestIdentity}>
                        <span className={styles.requestAvatar}>
                          {request.initials}
                        </span>
                        <div className={styles.requestDetails}>
                          <p className={styles.requestName}>{request.name}</p>
                          <p className={styles.requestMeta}>
                            {request.type}
                            {request.days
                              ? ` · ${request.days} ${request.days === 1 ? "day" : "days"}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <span className={statusClass[request.status]}>
                        {request.status}
                      </span>
                    </article>
                  ))}
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {activeTab === "My leave" ? "My leave" : "Leave requests"}
              </h2>
              <p className={styles.sectionSubtitle}>
                {activeTab === "My leave"
                  ? "Your submitted time off."
                  : "Review and respond to your team's requests."}
              </p>
            </div>
            {visibleRequests.length === 0 ? (
              <p className={styles.empty}>
                {activeTab === "My leave"
                  ? "You have no leave requests yet."
                  : "No leave requests yet."}
              </p>
            ) : (
              visibleRequests.map((request) => (
                <article key={request.id} className={styles.requestRow}>
                  <div className={styles.requestIdentity}>
                    <span className={styles.requestAvatar}>
                      {request.initials}
                    </span>
                    <div className={styles.requestDetails}>
                      <p className={styles.requestName}>{request.name}</p>
                      <p className={styles.requestMeta}>
                        {request.type} · {prettyRange(request.dateRange)}
                        {request.days
                          ? ` · ${request.days} ${request.days === 1 ? "day" : "days"}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className={styles.requestActions}>
                    <span className={statusClass[request.status]}>
                      {request.status}
                    </span>
                    {activeTab === "Requests" && request.status === "Pending" ? (
                      <>
                        <button
                          type="button"
                          aria-label={`Decline ${request.name}'s request`}
                          className={styles.declineButton}
                          onClick={() => rejectLeave(request.id, request.name)}
                        >
                          <X size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.approveButton}
                          onClick={() => approveLeave(request.id, request.name)}
                        >
                          <Check size={15} strokeWidth={2.5} />
                          Approve
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </>
        )}
      </section>

      <SimpleModal
        open={requestOpen}
        title="Request leave"
        fields={createFields}
        submitLabel="Submit request"
        showClose
        wide
        appearance="soft"
        onClose={() => setRequestOpen(false)}
        onSubmit={handleRequestLeave}
      />
    </div>
  );
}
