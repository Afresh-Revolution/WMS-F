"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  MessageSquarePlus,
  Search,
  Undo2,
  Wallet,
} from "lucide-react";
import { AccountantProfileChip } from "@/components/accountant/AccountantProfileChip";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { AddPurchaseRecommendationModal } from "@/components/accountant/AddPurchaseRecommendationModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled } from "@/lib/api";
import {
  mapAccountantPurchase,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  accountantPurchaseFilters,
  type AccountantPurchase,
  type AccountantPurchaseFilter,
  type AccountantPurchaseStatus,
} from "@/data/accountantPurchases";
import styles from "./AccountantPurchasesPage.module.css";

const statusClass: Record<AccountantPurchaseStatus, string> = {
  "Under Review": styles.statusReview,
  Recommended: styles.statusRecommended,
  "Awaiting Payment": styles.statusAwaiting,
  Paid: styles.statusPaid,
};

export function AccountantPurchasesPage() {
  const [filter, setFilter] = useState<AccountantPurchaseFilter>("Under Review");
  const [activePurchase, setActivePurchase] = useState<AccountantPurchase | null>(
    null,
  );
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [requests, orders] = await Promise.all([
      accountantApi.purchaseRequests.list(),
      accountantSettled(accountantApi.purchaseOrders.list()),
    ]);
    return { requests, orders };
  }, []);

  const purchases = useMemo(() => {
    const mapped = [
      ...unwrapAccountantList(data?.requests),
      ...unwrapAccountantList(data?.orders),
    ].map(mapAccountantPurchase);
    const seen = new Set<string>();
    return mapped.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === "All") return purchases;
    return purchases.filter((item) => item.status === filter);
  }, [filter, purchases]);

  async function handleRecommend(recommendation: string) {
    if (!activePurchase) return;
    const target = activePurchase;
    await runAction(
      "Recommend to Admin",
      async () => {
        refetch();
      },
      `${target.ref} recommended to Admin`,
    );
  }

  async function handleReturn(purchase: AccountantPurchase) {
    await runAction(
      "Return purchase",
      async () => {
        refetch();
      },
      `${purchase.ref} returned to requester`,
    );
  }

  async function handleRecordPayment(purchase: AccountantPurchase) {
    await runAction(
      "Record payment",
      async () => {
        await accountantApi.purchaseOrders.recordPayment(purchase.id, {
          amount: purchase.amount,
          reference: purchase.ref,
        });
        refetch();
      },
      `${purchase.ref} marked as paid`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="purchases" />
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </label>
          <Link
            href="/accountant/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <AccountantProfileChip className={styles.avatarChip} />
        </div>
      </div>

      <div className={styles.header}>
        <p className={styles.eyebrow}>Accountant · Purchases</p>
        <h1 className={styles.title}>Purchase review queue</h1>
        <p className={styles.subtitle}>
          Add a financial recommendation for Admin to approve, then record
          payment once approved. The Accountant recommends — Admin approves.
        </p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Purchase status">
        {accountantPurchaseFilters.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={`${styles.tab} ${filter === item ? styles.tabActive : ""}`}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No purchases in this queue.</p>
        ) : (
          filtered.map((purchase) => (
            <article key={purchase.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardLead}>
                  <div className={styles.titleRow}>
                    <h2 className={styles.cardTitle}>{purchase.title}</h2>
                    <span
                      className={`${styles.status} ${statusClass[purchase.status]}`}
                    >
                      {purchase.status}
                    </span>
                    <span className={styles.ref}>{purchase.ref}</span>
                  </div>
                  <p className={styles.meta}>
                    {purchase.department} · Requested by {purchase.requester} ·{" "}
                    {purchase.date}
                  </p>
                  {purchase.recommendation ? (
                    <p className={styles.recommendation}>
                      “{purchase.recommendation}”
                    </p>
                  ) : null}
                </div>
                <p className={styles.amount}>{purchase.amount}</p>
              </div>

              {purchase.status === "Under Review" ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => setActivePurchase(purchase)}
                  >
                    <MessageSquarePlus size={15} />
                    Add recommendation
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryAction}
                    onClick={() => void handleReturn(purchase)}
                  >
                    <Undo2 size={15} />
                    Return
                  </button>
                </div>
              ) : null}

              {purchase.status === "Awaiting Payment" ? (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryAction}
                    onClick={() => void handleRecordPayment(purchase)}
                  >
                    <Wallet size={15} />
                    Record payment
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>

      <AddPurchaseRecommendationModal
        open={Boolean(activePurchase)}
        purchase={activePurchase}
        onClose={() => setActivePurchase(null)}
        onSubmit={handleRecommend}
      />
    </div>
  );
}
