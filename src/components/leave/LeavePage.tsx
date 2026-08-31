"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Heart,
  Home,
  LayoutGrid,
  Plus,
  Search,
  X,
  FileText,
} from "lucide-react";
import {
  leaveBalances as fallbackBalances,
  leaveRequests as fallbackRequests,
  leaveTabs,
  type LeaveRequestStatus,
  type LeaveTab,
} from "@/data/leave";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { hrApi, leaveApi } from "@/lib/api";
import { listFrom, mapLeaveBalance, mapLeaveRequest } from "@/lib/api/mappers";
import styles from "./LeavePage.module.css";

const balanceIcons = {
  annual: CalendarDays,
  sick: Heart,
  parental: FileText,
  personal: Home,
} as const;

const statusClass: Record<LeaveRequestStatus, string> = {
  Pending: styles.statusPending,
  Approved: styles.statusApproved,
  Declined: styles.statusDeclined,
};

const requestLeaveFields = [
  {
    name: "type",
    label: "Leave type",
    type: "select" as const,
    required: true,
    defaultValue: "annual",
    options: [
      { label: "Annual", value: "annual" },
      { label: "Sick", value: "sick" },
      { label: "Parental", value: "parental" },
      { label: "Personal", value: "personal" },
    ],
  },
  { name: "startDate", label: "Start date", type: "date" as const, required: true },
  { name: "endDate", label: "End date", type: "date" as const, required: true },
  { name: "reason", label: "Reason", type: "textarea" as const },
];

export function LeavePage() {
  const [activeTab, setActiveTab] = useState<LeaveTab>("Requests");
  const [requestOpen, setRequestOpen] = useState(false);

  const { runAction, showToast } = usePageActions();

  const { data: leaveData, loading, error, refetch } = useAsyncData(
    () => leaveApi.list(),
    [],
  );

  const { data: hrLeaveData } = useAsyncData(() => hrApi.leave.list(), []);

  const leaveRequests = useMemo(() => {
    const records = listFrom(leaveData ?? hrLeaveData ?? undefined);
    return records.length > 0
      ? records.map((record) => mapLeaveRequest(record))
      : fallbackRequests;
  }, [leaveData, hrLeaveData]);

  const leaveBalances = useMemo(() => {
    const overview = (leaveData ?? hrLeaveData ?? {}) as Record<string, unknown>;
    const balances = listFrom(
      (overview.balances ?? overview.leaveBalances) as never,
    );
    return balances.length > 0
      ? balances.map((record, index) => mapLeaveBalance(record, index))
      : fallbackBalances;
  }, [leaveData, hrLeaveData]);

  function approveLeave(id: string, name: string) {
    void runAction(`Approve ${name}'s leave`, async () => {
      await hrApi.leave.approve(id);
      refetch();
    });
  }

  function rejectLeave(id: string, name: string) {
    void runAction(`Decline ${name}'s leave`, async () => {
      await hrApi.leave.reject(id);
      refetch();
    });
  }

  async function handleRequestLeave(values: Record<string, string>) {
    await runAction("Request leave", async () => {
      await hrApi.leave.create(values);
      refetch();
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          {loading ? <p className={styles.dateLabel}>Loading leave…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              Using cached leave — {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <button
              type="button"
              aria-label="Search"
              className={styles.iconButton}
              onClick={() => showToast("Use the search field below", "info")}
            >
              <Search size={16} />
            </button>
            <NotificationsLink className={styles.iconButton} />
            <button
              type="button"
              aria-label="View options"
              className={styles.iconButton}
              onClick={() => showToast("Grid view coming soon", "info")}
            >
              <LayoutGrid size={16} />
            </button>
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Leave &amp; wellbeing</p>
            <h1 className={styles.title}>Time away, thoughtfully managed</h1>
            <p className={styles.subtitle}>
              Request time off, track balances, and keep your team covered — all
              in one calm place.
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

        <div className={styles.balances}>
          {leaveBalances.map((balance) => {
            const Icon = balanceIcons[balance.icon];
            const percentUsed = (balance.used / balance.total) * 100;

            return (
              <article key={balance.id} className={styles.balanceCard}>
                <div className={styles.balanceTop}>
                  <span className={styles.balanceIcon}>
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <p className={styles.balanceRemaining}>
                    <strong>{balance.remaining}</strong> left
                  </p>
                </div>
                <p className={styles.balanceLabel}>{balance.label}</p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <p className={styles.balanceMeta}>
                  {balance.used} of {balance.total} days used
                </p>
              </article>
            );
          })}
        </div>

        <div className={styles.tabs}>
          {leaveTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`${styles.tab} ${
                activeTab === tab ? styles.tabActive : ""
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Requests" && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Leave requests</h2>
              <p className={styles.sectionSubtitle}>
                Review and respond to your team&apos;s requests.
              </p>
            </div>

            <div className={styles.requestList}>
              {leaveRequests.map((request) => (
                <article key={request.id} className={styles.requestRow}>
                  <div className={styles.requestIdentity}>
                    <span
                      className={styles.requestAvatar}
                      style={{ background: request.avatarColor }}
                    >
                      {request.initials}
                    </span>
                    <div className={styles.requestDetails}>
                      <p className={styles.requestName}>{request.name}</p>
                      <p className={styles.requestMeta}>
                        {request.type} · {request.dateRange} · {request.days}{" "}
                        days
                      </p>
                    </div>
                  </div>

                  <div className={styles.requestActions}>
                    <span className={statusClass[request.status]}>
                      {request.status}
                    </span>
                    {request.status === "Pending" && (
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
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <SimpleModal
          open={requestOpen}
          title="Request leave"
          description="Submit a new leave request for approval."
          fields={requestLeaveFields}
          submitLabel="Submit request"
          onClose={() => setRequestOpen(false)}
          onSubmit={handleRequestLeave}
        />
      </div>
  );
}
