"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import {
  incrementFilters,
  type IncrementFilter,
  type IncrementStatus,
} from "@/data/salaryIncrements";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { listFrom, mapSalaryIncrement } from "@/lib/api/mappers";
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

const newIncrementFields = [
  { name: "name", label: "Employee name", required: true },
  { name: "department", label: "Department", required: true },
  { name: "currentSalary", label: "Current salary", required: true },
  { name: "proposedSalary", label: "Proposed salary", required: true },
  { name: "effectiveDate", label: "Effective date", type: "date" as const },
];

export function SalaryIncrementsPage() {
  const [activeFilter, setActiveFilter] = useState<IncrementFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);

  const { runAction, showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () =>
      superAdminApi.salaryIncrements
        .list()
        .catch(() => superAdminApi.hr.salaryAdjustments.list()),
    [],
  );

  const salaryIncrements = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapSalaryIncrement(record));
  }, [data]);

  const incrementStats = useMemo(() => {
    const review = salaryIncrements.filter(
      (item) => item.status === "Under admin review",
    ).length;
    const approved = salaryIncrements.filter((item) => item.status === "Approved").length;
    const percents = salaryIncrements
      .map((item) => parseFloat(item.incrementPercent.replace(/[^\d.-]/g, "")))
      .filter((value) => !Number.isNaN(value));
    const avgIncrement =
      percents.length > 0
        ? `${(percents.reduce((sum, value) => sum + value, 0) / percents.length).toFixed(1)}%`
        : "—";
    return [
      { id: "total", label: "Total", value: String(salaryIncrements.length), highlight: false },
      { id: "review", label: "Under review", value: String(review), highlight: true },
      { id: "approved", label: "Approved", value: String(approved), highlight: false },
      { id: "avg", label: "Avg. increment", value: avgIncrement, highlight: false },
    ];
  }, [salaryIncrements]);

  const filteredIncrements = useMemo(() => {
    return salaryIncrements.filter((increment) => {
      if (activeFilter === "All") return true;
      return increment.status === activeFilter;
    });
  }, [activeFilter, salaryIncrements]);

  function viewIncrement(increment: (typeof salaryIncrements)[number]) {
    showToast(
      `${increment.name}: ${increment.currentSalary} → ${increment.proposedSalary} (${increment.status})`,
      "info",
    );
  }

  async function handleCreateIncrement(values: Record<string, string>) {
    await runAction("New recommendation", async () => {
      await superAdminApi.hr.salaryAdjustments
        .create(values)
        .catch(() => superAdminApi.salaryIncrements.create(values));
      refetch();
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
          {loading ? <p className={styles.dateLabel}>Loading increments…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
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
            <NotificationsLink
              className={`${styles.iconButton} ${styles.iconButtonBadge}`}
            />
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
            <button
              type="button"
              aria-label="Team"
              className={styles.iconButton}
              onClick={() => {
                window.location.href = "/employees";
              }}
            >
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
              <article
                key={increment.id}
                className={styles.listRow}
                role="button"
                tabIndex={0}
                onClick={() => viewIncrement(increment)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    viewIncrement(increment);
                  }
                }}
              >
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

        <SimpleModal
          open={createOpen}
          title="New recommendation"
          description="Submit a salary increment recommendation."
          fields={newIncrementFields}
          submitLabel="Submit recommendation"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateIncrement}
        />
      </div>
  );
}
