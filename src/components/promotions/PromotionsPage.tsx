"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";
import {
  promotionFilters,
  promotions as fallbackPromotions,
  promotionStats as fallbackStats,
  type PromotionFilter,
  type PromotionStatus,
} from "@/data/promotions";
import { NotificationsLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { hrApi, promotionsApi } from "@/lib/api";
import { listFrom, mapPromotion } from "@/lib/api/mappers";
import styles from "./PromotionsPage.module.css";

const statusClass: Record<PromotionStatus, string> = {
  "Under admin review": styles.statusReview,
  Draft: styles.statusDraft,
  Approved: styles.statusApproved,
  Rejected: styles.statusRejected,
};

const statusLabels: Record<PromotionStatus, string> = {
  "Under admin review": "Under admin review",
  Draft: "Draft",
  Approved: "Approved",
  Rejected: "Rejected",
};

const newPromotionFields = [
  { name: "name", label: "Employee name", required: true },
  { name: "currentRole", label: "Current role", required: true },
  { name: "proposedRole", label: "Proposed role", required: true },
  { name: "department", label: "Department" },
  { name: "effectiveDate", label: "Effective date", type: "date" as const },
];

export function PromotionsPage() {
  const [activeFilter, setActiveFilter] = useState<PromotionFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);

  const { runAction, showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => promotionsApi.list(),
    [],
  );

  const promotions = useMemo(() => {
    const records = listFrom(data ?? undefined);
    return records.length > 0
      ? records.map((record) => mapPromotion(record))
      : fallbackPromotions;
  }, [data]);

  const promotionStats = useMemo(() => {
    if (!data && promotions === fallbackPromotions) return fallbackStats;
    const review = promotions.filter((p) => p.status === "Under admin review").length;
    const approved = promotions.filter((p) => p.status === "Approved").length;
    const draft = promotions.filter((p) => p.status === "Draft").length;
    return [
      { id: "total", label: "Total", value: String(promotions.length) },
      { id: "review", label: "Under review", value: String(review) },
      { id: "approved", label: "Approved", value: String(approved) },
      { id: "draft", label: "Draft", value: String(draft) },
    ];
  }, [data, promotions]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      if (activeFilter === "All") return true;
      return promotion.status === activeFilter;
    });
  }, [activeFilter, promotions]);

  function viewPromotion(promotion: (typeof promotions)[number]) {
    showToast(
      `${promotion.name}: ${promotion.currentRole} → ${promotion.proposedRole} (${promotion.status})`,
      "info",
    );
  }

  async function handleCreatePromotion(values: Record<string, string>) {
    await runAction("New recommendation", async () => {
      await hrApi.promotions.create(values);
      refetch();
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          {loading ? <p className={styles.dateLabel}>Loading promotions…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              Using cached promotions — {error}
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
              onClick={() => showToast("List view active", "info")}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Promotion management</p>
            <h1 className={styles.title}>Recognise and advance your people</h1>
            <p className={styles.subtitle}>
              Create promotion recommendations, track approval progress, and record
              career milestones.
            </p>
          </div>
          <button
            type="button"
            className={styles.newButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            New recommendation
          </button>
        </div>

        <div className={styles.stats}>
          {promotionStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {promotionFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : styles.filterChipInactive
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>Promotion recommendations</h2>
          </div>

          <div className={styles.list}>
            {filteredPromotions.map((promotion) => (
              <article
                key={promotion.id}
                className={styles.listRow}
                role="button"
                tabIndex={0}
                onClick={() => viewPromotion(promotion)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    viewPromotion(promotion);
                  }
                }}
              >
                <div className={styles.rowIdentity}>
                  <span
                    className={styles.avatar}
                    style={{ background: promotion.avatarColor }}
                  >
                    {promotion.initials}
                  </span>
                  <div className={styles.rowBody}>
                    <p className={styles.name}>{promotion.name}</p>
                    <p className={styles.rolePath}>
                      {promotion.currentRole} → {promotion.proposedRole}
                      {promotion.department ? ` - ${promotion.department}` : ""}
                    </p>
                    <p className={styles.dates}>
                      Submitted: {promotion.submittedDate} - Eff:{" "}
                      {promotion.effectiveDate}
                    </p>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <span className={statusClass[promotion.status]}>
                    {statusLabels[promotion.status]}
                  </span>
                  <ChevronRight size={18} className={styles.chevron} />
                </div>
              </article>
            ))}

            {filteredPromotions.length === 0 && (
              <div className={styles.empty}>No promotions match this filter.</div>
            )}
          </div>
        </section>

        <SimpleModal
          open={createOpen}
          title="New recommendation"
          description="Submit a promotion recommendation for review."
          fields={newPromotionFields}
          submitLabel="Submit recommendation"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreatePromotion}
        />
      </div>
  );
}
