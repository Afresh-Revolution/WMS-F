"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Heart,
  Home,
  LayoutGrid,
  Plus,
  Search,
  X,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  leaveBalances,
  leaveTabs,
  type LeaveRequestStatus,
  type LeaveTab,
} from "@/data/leave";
import { managerApi } from "@/lib/api/manager";
import { useManagerLeave } from "@/lib/hooks/useManagerApi";
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

export function LeavePage() {
  const [activeTab, setActiveTab] = useState<LeaveTab>("Requests");
  const { items: leaveRequests, setItems, isLive, refresh } = useManagerLeave();

  async function updateLeaveStatus(id: string, status: LeaveRequestStatus) {
    if (isLive) {
      if (status === "Approved") await managerApi.approveLeave(id);
      else await managerApi.rejectLeave(id);
      await refresh();
      return;
    }

    setItems((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    );
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <button type="button" aria-label="Search" className={styles.iconButton}>
              <Search size={16} />
            </button>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="View options" className={styles.iconButton}>
              <LayoutGrid size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
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
          <button type="button" className={styles.requestButton}>
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
                          onClick={() => void updateLeaveStatus(request.id, "Declined")}
                        >
                          <X size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.approveButton}
                          onClick={() => void updateLeaveStatus(request.id, "Approved")}
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
      </div>
    </AppShell>
  );
}
