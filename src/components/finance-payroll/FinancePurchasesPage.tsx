"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Check, Plus, RefreshCw, ShoppingCart, X } from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { HideOnManager } from "@/components/layout/HideOnManager";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  matchesPurchaseFilter,
  purchaseFilters,
  purchaseRequests as samplePurchaseRequests,
  type PurchaseFilter,
  type PurchaseRequest,
  type PurchaseStatus,
} from "@/data/financePurchases";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { managerApi, superAdminApi } from "@/lib/api";
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

function displayStatus(status: PurchaseStatus) {
  return status === "Under Procurement Review"
    ? "Under accountant review"
    : status;
}

function amountNumber(value: string) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function formatCompactNaira(total: number) {
  if (total >= 1_000_000) {
    const millions = total / 1_000_000;
    return `₦ ${millions.toFixed(millions >= 10 ? 0 : 2).replace(/\.00$/, "")}M`;
  }
  if (total >= 1_000) {
    return `₦ ${Math.round(total / 1_000)}K`;
  }
  return `₦ ${Math.round(total).toLocaleString("en-NG")}`;
}

function formatSubmitted(value: string) {
  if (/^[A-Za-z]{3}\s+\d{1,2}$/.test(value.trim())) return value;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatAmount(value: string) {
  if (value.includes("₦") && value.includes(",")) return value;
  const amount = amountNumber(value);
  if (!amount) return value;
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

function purchaseWriteBody(
  values: Record<string, string>,
  requester: string,
) {
  const item = values.item.trim();
  const detail = values.detail.trim();
  const amount = Number(String(values.amount ?? "").replace(/[^\d.-]/g, ""));
  const unitPrice = Number.isFinite(amount) && amount > 0 ? amount : 0;
  return {
    title: item,
    item,
    description: detail,
    detail,
    reason: detail || item,
    amount: unitPrice,
    estimatedAmount: unitPrice,
    estimatedUnitPrice: unitPrice,
    quantity: 1,
    itemDescription: item,
    requester,
    requesterName: requester,
    status: "Under Procurement Review",
    items: [
      {
        description: item || detail,
        quantity: 1,
        estimatedUnitPrice: unitPrice,
      },
    ],
  };
}

export function FinancePurchasesPage() {
  const manager = useManagerPortal();
  const { user } = useCurrentUser();
  const [activeFilter, setActiveFilter] = useState<PurchaseFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdRecords, setCreatedRecords] = useState<
    Record<string, unknown>[]
  >([]);
  const { runAction } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      manager
        ? managerApi.listProcurementRequests()
        : superAdminApi.purchaseRequests.list(),
    [manager],
  );

  const purchaseRequests = useMemo(() => {
    const remote = listFrom(data ?? undefined);
    const seen = new Set<string>();
    const mapped = [...createdRecords, ...remote]
      .filter((record) => {
        const key = String(record.id ?? record.ref ?? record.reference ?? "");
        if (key && seen.has(key)) return false;
        if (key) seen.add(key);
        return true;
      })
      .map((record) => mapPurchaseRequest(record));
    return mapped.length > 0 || loading ? mapped : samplePurchaseRequests;
  }, [createdRecords, data, loading]);

  const purchaseStats = useMemo(() => {
    const pending = purchaseRequests.filter((request) => isPending(request.status)).length;
    const approved = purchaseRequests.filter((request) => request.status === "Approved").length;
    const totalValue = purchaseRequests.reduce(
      (sum, request) => sum + amountNumber(request.amount),
      0,
    );
    return [
      { id: "total", label: "Total this month", value: String(purchaseRequests.length) },
      { id: "pending", label: "Pending review", value: String(pending) },
      { id: "value", label: "Total value", value: formatCompactNaira(totalValue) },
      { id: "approved", label: "Approved", value: String(approved) },
    ];
  }, [purchaseRequests]);

  const filteredRequests = useMemo(() => {
    return purchaseRequests.filter((request) =>
      matchesPurchaseFilter(request.status, activeFilter),
    );
  }, [activeFilter, purchaseRequests]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Create request", async () => {
      const body = purchaseWriteBody(values, user?.name || "Manager");
      if (body.title.length < 3) {
        throw new Error("Enter an item name.");
      }
      if (!Number.isFinite(body.amount) || body.amount <= 0) {
        throw new Error("Enter a valid amount.");
      }
      const created = await (manager
        ? managerApi.createProcurementRequest(body)
        : superAdminApi.purchaseRequests.create(body));
      if (created && typeof created === "object") {
        setCreatedRecords((current) => [
          created as Record<string, unknown>,
          ...current,
        ]);
      }
      refetch();
    });
  }

  async function approveRequest(request: PurchaseRequest) {
    await runAction(`Approve ${request.ref}`, async () => {
      await (manager
        ? managerApi.approveProcurementRequest(request.id)
        : superAdminApi.purchaseRequests.action(request.id, "approve"));
      refetch();
    });
  }

  async function rejectRequest(request: PurchaseRequest) {
    await runAction(`Reject ${request.ref}`, async () => {
      await (manager
        ? managerApi.rejectProcurementRequest(request.id)
        : superAdminApi.purchaseRequests.action(request.id, "reject"));
      refetch();
    });
  }

  async function orderRequest(request: PurchaseRequest) {
    await runAction(`Order ${request.ref}`, async () => {
      await (manager
        ? managerApi.orderProcurementRequest(request.id)
        : superAdminApi.purchaseRequests.action(request.id, "order"));
      refetch();
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  return (
    <>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading purchases…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

        <HideOnManager>
        <div className={payrollStyles.topBar}>
          <PageDateLabel className={payrollStyles.dateLabel} />
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
        </HideOnManager>

        <div className={payrollStyles.header}>
          <div>
            <p className={payrollStyles.eyebrow}>Purchase requests</p>
            <h1 className={payrollStyles.title}>Every purchase, accounted for</h1>
            <p className={payrollStyles.subtitle}>
              Submit, review, and track purchase requests from initiation through
              delivery and payment.
            </p>
          </div>
          <button type="button" className={styles.newButton} onClick={() => setCreateOpen(true)}>
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
                    <td className={styles.amountCell}>{formatAmount(request.amount)}</td>
                    <td className={styles.submittedCell}>
                      {formatSubmitted(request.submitted)}
                    </td>
                    <td>
                      <span className={statusClass[request.status]}>
                        {displayStatus(request.status)}
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
