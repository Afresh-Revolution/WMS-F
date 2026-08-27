"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  incrementFilters,
  incrementStats,
  type IncrementFilter,
  type IncrementStatus,
} from "@/data/salaryIncrements";
import { useManagerSalaryRecommendations } from "@/lib/hooks/useManagerApi";
import styles from "./SalaryIncrementsPage.module.css";

const statusClass: Record<IncrementStatus, string> = {
  "Under admin review": styles.statusReview,
  Draft: styles.statusDraft,
  Approved: styles.statusApproved,
};

const statusLabels: Record<IncrementStatus, string> = {
  "Under admin review": "Under admin review",
  Draft: "Draft",
  Approved: "Approved",
};

export function SalaryIncrementsPage() {
  const [activeFilter, setActiveFilter] = useState<IncrementFilter>("All");
  const { items: salaryIncrements } = useManagerSalaryRecommendations();

  const filteredIncrements = useMemo(() => {
    return salaryIncrements.filter((increment) => {
      if (activeFilter === "All") return true;
      return increment.status === activeFilter;
    });
  }, [activeFilter, salaryIncrements]);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <button type="button" aria-label="Search" className={styles.iconButton}>
              <Search size={16} />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className={`${styles.iconButton} ${styles.iconButtonBadge}`}
            >
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
            <button type="button" aria-label="Team" className={styles.iconButton}>
              <UserRound size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Salary increments</p>
            <h1 className={styles.title}>Reward performance, fairly</h1>
            <p className={styles.subtitle}>
              Create salary increment recommendations, track approval stages, and
              apply approved changes on time.
            </p>
          </div>
          <button type="button" className={styles.newButton}>
            <Plus size={16} strokeWidth={2.5} />
            New recommendation
          </button>
        </div>

        <div className={styles.stats}>
          {incrementStats.map((stat) => (
            <article
              key={stat.id}
              className={`${styles.statCard} ${
                stat.highlight ? styles.statCardHighlight : ""
              }`}
            >
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {incrementFilters.map((filter) => {
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
                {filter === "All" && active && (
                  <span className={styles.filterCount}>03</span>
                )}
              </button>
            );
          })}
        </div>

        <h2 className={styles.sectionTitle}>Increment recommendations</h2>

        <section className={styles.listSection}>
          <div className={styles.list}>
            {filteredIncrements.map((increment) => (
              <article key={increment.id} className={styles.listRow}>
                <div className={styles.rowIdentity}>
                  <span
                    className={styles.avatar}
                    style={{ background: increment.avatarColor }}
                  >
                    {increment.initials}
                  </span>
                  <div className={styles.rowBody}>
                    <p className={styles.name}>
                      {increment.name}, {increment.department}
                    </p>
                    <p className={styles.salaryPath}>
                      {increment.currentSalary} → {increment.proposedSalary} (
                      {increment.incrementPercent}, Eff. {increment.effectiveDate})
                    </p>
                    <p className={styles.dates}>
                      Submitted: {increment.submittedDate}
                    </p>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  {increment.incrementAmount && (
                    <p className={styles.incrementAmount}>
                      {increment.incrementAmount}
                    </p>
                  )}
                  <span className={statusClass[increment.status]}>
                    {statusLabels[increment.status]}
                  </span>
                  <ChevronRight size={18} className={styles.chevron} />
                </div>
              </article>
            ))}

            {filteredIncrements.length === 0 && (
              <div className={styles.empty}>
                No increment recommendations match this filter.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
