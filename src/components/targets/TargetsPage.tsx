"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus, RefreshCw, Search, Star } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  performanceReviews as fallbackReviews,
  targetStats as fallbackStats,
  targetTabs,
  type PerformanceReview,
  type ReviewStatus,
  type TargetTab,
} from "@/data/targets";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { targetsApi } from "@/lib/api";
import { listFrom, mapPerformanceReview, str } from "@/lib/api/mappers";
import styles from "./TargetsPage.module.css";

const statusClass: Record<ReviewStatus, string> = {
  Completed: styles.statusCompleted,
  "In review": styles.statusInReview,
  Overdue: styles.statusOverdue,
};

const createFields = [
  { name: "name", label: "Employee name", required: true },
  { name: "role", label: "Role", required: true },
  { name: "reviewedBy", label: "Reviewed by", required: true },
  { name: "rating", label: "Rating (1–5)", type: "number" as const, defaultValue: "4" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles.rating}>
      <div className={styles.stars} aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const filled = rating >= starValue;
          const partial = !filled && rating > index;

          return (
            <Star
              key={starValue}
              size={14}
              strokeWidth={1.75}
              className={`${styles.star} ${filled || partial ? styles.starFilled : ""}`}
              fill={filled ? "currentColor" : partial ? "currentColor" : "none"}
              style={partial ? { opacity: rating - index } : undefined}
            />
          );
        })}
      </div>
      <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
    </div>
  );
}

export function TargetsPage() {
  const [activeTab, setActiveTab] = useState<TargetTab>("Reviews");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(() => targetsApi.list(), []);

  const performanceReviews = useMemo(() => {
    const records = listFrom(data ?? undefined);
    return records.length > 0
      ? records.map((record) => mapPerformanceReview(record))
      : fallbackReviews;
  }, [data]);

  const targetStats = useMemo(() => {
    if (!data) return fallbackStats;
    const summary = data as Record<string, unknown>;
    return [
      {
        id: "avg-score",
        label: "Avg. review score",
        value: str(summary.avgScore ?? summary.averageRating, fallbackStats[0].value),
        badge: str(summary.cycle ?? fallbackStats[0].badge),
      },
      {
        id: "reviews-due",
        label: "Reviews due",
        value: str(summary.reviewsDue ?? summary.pending, fallbackStats[1].value),
        badge: fallbackStats[1].badge,
      },
      {
        id: "kpi-attainment",
        label: "KPI attainment",
        value: str(summary.kpiAttainment ?? summary.kpi, fallbackStats[2].value),
        badge: fallbackStats[2].badge,
      },
      {
        id: "total-reviews",
        label: "Total reviews",
        value: str(summary.totalReviews ?? performanceReviews.length, fallbackStats[3].value),
        badge: fallbackStats[3].badge,
      },
    ];
  }, [data, performanceReviews.length]);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return performanceReviews.filter((review) => {
      if (!normalizedQuery) return true;
      const haystack =
        `${review.name} ${review.role} ${review.reviewedBy}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [performanceReviews, query]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Create review", async () => {
      await targetsApi.create({
        ...values,
        rating: Number(values.rating) || 0,
        status: "In review",
      });
      refetch();
    });
  }

  async function openReview(review: PerformanceReview) {
    await runAction(`Review — ${review.name}`, async () => {
      await targetsApi.get(review.id);
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredReviews.map((review) => ({
        name: review.name,
        role: review.role,
        reviewedBy: review.reviewedBy,
        rating: review.rating,
        status: review.status,
      })),
      "performance-reviews.csv",
    );
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 1</p>
          {loading ? <p className={styles.dateLabel}>Loading targets…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              Using cached targets — {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <NotificationsLink className={styles.iconButton} />
            <button
              type="button"
              aria-label="Refresh"
              className={styles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Performance</p>
            <h1 className={styles.title}>Where growth becomes visible</h1>
            <p className={styles.subtitle}>
              Track appraisals, monitor KPIs, and build a culture of intentional
              progress.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.exportButton} onClick={handleExport}>
              Export
            </button>
            <button
              type="button"
              className={styles.createButton}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              New review
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          {targetStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span className={styles.statBadge}>{stat.badge}</span>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.tabs}>
          {targetTabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "Reviews" ? (
          <section className={styles.reviewsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Q2 2026 performance reviews</h2>
              <p className={styles.sectionSubtitle}>
                Cycle closes July 31. Reviews in progress are shown first.
              </p>
            </div>

            <div className={styles.reviewList}>
              {filteredReviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  className={styles.reviewRow}
                  onClick={() => void openReview(review)}
                >
                  <span
                    className={styles.avatar}
                    style={{ background: review.avatarColor }}
                  >
                    {review.initials}
                  </span>

                  <span className={styles.reviewInfo}>
                    <span className={styles.reviewName}>{review.name}</span>
                    <span className={styles.reviewRole}>{review.role}</span>
                    <span className={styles.reviewedBy}>
                      Reviewed by {review.reviewedBy}
                    </span>
                  </span>

                  <span className={styles.reviewMeta}>
                    <StarRating rating={review.rating} />
                    <span className={statusClass[review.status]}>{review.status}</span>
                    <ChevronRight size={16} className={styles.chevron} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className={styles.placeholder}>
            <h2 className={styles.sectionTitle}>{activeTab}</h2>
            <p className={styles.sectionSubtitle}>
              {activeTab === "KPIs"
                ? "Track key performance indicators across teams and departments."
                : "Set and monitor individual and team goals for the current cycle."}
            </p>
          </section>
        )}
      </div>

      <SimpleModal
        open={createOpen}
        title="New performance review"
        description="Start a review cycle for an employee."
        fields={createFields}
        submitLabel="Create review"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
