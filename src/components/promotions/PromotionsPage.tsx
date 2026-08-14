"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  promotionFilters,
  promotions,
  promotionStats,
  type PromotionFilter,
  type PromotionStatus,
} from "@/data/promotions";
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

export function PromotionsPage() {
  const [activeFilter, setActiveFilter] = useState<PromotionFilter>("All");

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) => {
      if (activeFilter === "All") return true;
      return promotion.status === activeFilter;
    });
  }, [activeFilter]);

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
          <button type="button" className={styles.newButton}>
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
              <article key={promotion.id} className={styles.listRow}>
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
      </div>
    </AppShell>
  );
}
