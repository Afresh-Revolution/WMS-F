"use client";

import { useState } from "react";
import { Bell, ChevronRight, LayoutGrid, Plus, Search, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  targetStats,
  targetTabs,
  type ReviewStatus,
  type TargetTab,
} from "@/data/targets";
import { useManagerTargets } from "@/lib/hooks/useManagerApi";
import styles from "./TargetsPage.module.css";

const statusClass: Record<ReviewStatus, string> = {
  Completed: styles.statusCompleted,
  "In review": styles.statusInReview,
  Overdue: styles.statusOverdue,
};

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
  const { items: performanceReviews } = useManagerTargets();

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 1</p>
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
            <p className={styles.eyebrow}>Performance</p>
            <h1 className={styles.title}>Where growth becomes visible</h1>
            <p className={styles.subtitle}>
              Track appraisals, monitor KPIs, and build a culture of intentional
              progress.
            </p>
          </div>
          <button type="button" className={styles.createButton}>
            <Plus size={16} strokeWidth={2.5} />
            New review
          </button>
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
              {performanceReviews.map((review) => (
                <button key={review.id} type="button" className={styles.reviewRow}>
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
    </AppShell>
  );
}
