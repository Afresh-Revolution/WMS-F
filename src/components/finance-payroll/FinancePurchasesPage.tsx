"use client";

import { useMemo, useState } from "react";
import { Bell, Check, Plus, Search, ShoppingCart, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import {
  matchesPurchaseFilter,
  purchaseFilters,
  purchaseStats,
  type PurchaseFilter,
  type PurchaseStatus,
} from "@/data/financePurchases";
import { managerApi } from "@/lib/api/manager";
import { useManagerProcurementRequests } from "@/lib/hooks/useManagerApi";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinancePurchasesPage.module.css";

const statusClass: Record<PurchaseStatus, string> = {
  "Under Procurement Review": styles.statusReview,
  "Awaiting Admin Approval": styles.statusPending,
  Approved: styles.statusApproved,
  Delivered: styles.statusDelivered,
  Rejected: styles.statusRejected,
};

function isPending(status: PurchaseStatus): boolean {
  return (
    status === "Under Procurement Review" || status === "Awaiting Admin Approval"
  );
}

export function FinancePurchasesPage() {
  const [activeFilter, setActiveFilter] = useState<PurchaseFilter>("All");
  const { items: purchaseRequests, setItems, isLive, refresh } =
    useManagerProcurementRequests();

  const filteredRequests = useMemo(() => {
    return purchaseRequests.filter((request) =>
      matchesPurchaseFilter(request.status, activeFilter),
    );
  }, [activeFilter, purchaseRequests]);

  async function decideRequest(id: string, next: "Approved" | "Rejected") {
    if (isLive) {
      if (next === "Approved") await managerApi.approveProcurementRequest(id);
      else await managerApi.rejectProcurementRequest(id);
      await refresh();
      return;
    }

    setItems((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status: next } : request,
      ),
    );
  }

  return (
    <AppShell>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />

        <div className={payrollStyles.topBar}>
          <p className={payrollStyles.dateLabel}>Tuesday, July 28</p>
          <div className={payrollStyles.topActions}>
            <button type="button" aria-label="Search" className={payrollStyles.iconButton}>
              <Search size={16} />
            </button>
            <button type="button" aria-label="Notifications" className={payrollStyles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
          </div>
        </div>

        <div className={payrollStyles.header}>
          <div>
            <h1 className={payrollStyles.title}>Every purchase, accounted for</h1>
            <p className={payrollStyles.subtitle}>
              Submit, review, and track purchase requests from initiation through
              delivery and payment.
            </p>
          </div>
          <button type="button" className={styles.newButton}>
            <Plus size={16} strokeWidth={2.5} />
            New request
          </button>
        </div>

        <div className={styles.stats}>
          {purchaseStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {purchaseFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <section className={styles.tableSection}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Item</th>
                  <th>Requester</th>
                  <th>Amount</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className={styles.refCell}>{request.ref}</td>
                    <td className={styles.itemCell}>
                      <span className={styles.itemTitle}>{request.item}</span>
                      <span className={styles.itemDetail}>{request.detail}</span>
                    </td>
                    <td>
                      <span className={styles.requester}>
                        <span
                          className={styles.avatar}
                          style={{ background: request.requesterColor }}
                        >
                          {request.requesterInitials}
                        </span>
                        {request.requester}
                      </span>
                    </td>
                    <td className={styles.amountCell}>{request.amount}</td>
                    <td>{request.submitted}</td>
                    <td>
                      <span className={statusClass[request.status]}>
                        {request.status}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      {isPending(request.status) && (
                        <span className={styles.actionGroup}>
                          <button
                            type="button"
                            aria-label={`Reject ${request.ref}`}
                            className={styles.rejectButton}
                            onClick={() => void decideRequest(request.id, "Rejected")}
                          >
                            <X size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Approve ${request.ref}`}
                            className={styles.approveButton}
                            onClick={() => void decideRequest(request.id, "Approved")}
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                        </span>
                      )}
                      {request.status === "Approved" && (
                        <button type="button" className={styles.orderButton}>
                          <ShoppingCart size={14} />
                          Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className={styles.empty}>No purchase requests match this filter.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
