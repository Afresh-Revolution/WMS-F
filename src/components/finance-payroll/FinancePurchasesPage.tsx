"use client";

import { useMemo, useState } from "react";
import { Check, Plus, RefreshCw, Search, ShoppingCart, X } from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  matchesPurchaseFilter,
  purchaseFilters,
  type PurchaseFilter,
  type PurchaseRequest,
  type PurchaseStatus,
} from "@/data/financePurchases";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { listFrom, mapPurchaseRequest } from "@/lib/api/mappers";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinancePurchasesPage.module.css";

const statusClass: Record<PurchaseStatus, string> = {
  "Under Procurement Review": styles.statusReview,
  "Awaiting Admin Approval": styles.statusPending,
  Approved: styles.statusApproved,
  Delivered: styles.statusDelivered,
  Rejected: styles.statusRejected,
};

const createFields = [
  { name: "item", label: "Item", required: true },
  { name: "detail", label: "Details", required: true },
  { name: "amount", label: "Amount", required: true, placeholder: "₦ 0" },
];

function isPending(status: PurchaseStatus): boolean {
  return (
    status === "Under Procurement Review" || status === "Awaiting Admin Approval"
  );
}

export function FinancePurchasesPage() {
  const [activeFilter, setActiveFilter] = useState<PurchaseFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.purchaseRequests.list(),
    [],
  );

  const purchaseRequests = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapPurchaseRequest(record));
  }, [data]);

  const purchaseStats = useMemo(() => {
    const pending = purchaseRequests.filter((request) =>
      request.status === "Under Procurement Review" ||
      request.status === "Awaiting Admin Approval",
    ).length;
    const approved = purchaseRequests.filter((request) => request.status === "Approved").length;
    const delivered = purchaseRequests.filter((request) => request.status === "Delivered").length;
    return [
      { id: "total", label: "Total requests", value: String(purchaseRequests.length) },
      { id: "pending", label: "Pending review", value: String(pending) },
      { id: "approved", label: "Approved", value: String(approved) },
      { id: "delivered", label: "Delivered", value: String(delivered) },
    ];
  }, [purchaseRequests]);

  const filteredRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    return purchaseRequests.filter((request) => {
      const matchesFilter = matchesPurchaseFilter(request.status, activeFilter);
      const haystack =
        `${request.ref} ${request.item} ${request.detail} ${request.requester}`.toLowerCase();
      return matchesFilter && (!term || haystack.includes(term));
    });
  }, [activeFilter, purchaseRequests, query]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Create request", async () => {
      await superAdminApi.purchaseRequests.create(values);
      refetch();
    });
  }

  async function approveRequest(request: PurchaseRequest) {
    await runAction(`Approve ${request.ref}`, async () => {
      await superAdminApi.purchaseRequests.action(request.id, "approve");
      refetch();
    });
  }

  async function rejectRequest(request: PurchaseRequest) {
    await runAction(`Reject ${request.ref}`, async () => {
      await superAdminApi.purchaseRequests.action(request.id, "reject");
      refetch();
    });
  }

  async function orderRequest(request: PurchaseRequest) {
    await runAction(`Order ${request.ref}`, async () => {
      await superAdminApi.purchaseRequests.action(request.id, "order");
      refetch();
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredRequests.map((request) => ({
        ref: request.ref,
        item: request.item,
        detail: request.detail,
        requester: request.requester,
        amount: request.amount,
        submitted: request.submitted,
        status: request.status,
      })),
      "purchase-requests.csv",
    );
  }

  return (
    <>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading purchases…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

        <div className={payrollStyles.topBar}>
          <p className={payrollStyles.dateLabel}>Tuesday, July 28</p>
          <div className={payrollStyles.topActions}>
            <NotificationsLink className={payrollStyles.iconButton} />
            <button
              type="button"
              aria-label="Refresh"
              className={payrollStyles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
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
          <div className={payrollStyles.headerActions}>
            <button type="button" className={payrollStyles.exportButton} onClick={handleExport}>
              Export
            </button>
            <button type="button" className={styles.newButton} onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={2.5} />
              New request
            </button>
          </div>
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

        <label className={styles.searchField}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="search"
            data-purchases-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search requests..."
            className={styles.searchInput}
          />
        </label>

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
                            onClick={() => void rejectRequest(request)}
                          >
                            <X size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Approve ${request.ref}`}
                            className={styles.approveButton}
                            onClick={() => void approveRequest(request)}
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                        </span>
                      )}
                      {request.status === "Approved" && (
                        <button
                          type="button"
                          className={styles.orderButton}
                          onClick={() => void orderRequest(request)}
                        >
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

      <SimpleModal
        open={createOpen}
        title="New purchase request"
        description="Submit a request for procurement review."
        fields={createFields}
        submitLabel="Submit request"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
