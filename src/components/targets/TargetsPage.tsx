"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus, Star } from "lucide-react";
import {
  targetTabs,
  type PerformanceReview,
  type ReviewStatus,
  type TargetTab,
} from "@/data/targets";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { listStaffEmployees, managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapEmployee, mapPerformanceReview, str } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./TargetsPage.module.css";

const statusClass: Record<ReviewStatus, string> = {
  Completed: styles.statusCompleted,
  "In review": styles.statusInReview,
  Overdue: styles.statusOverdue,
};

function ymd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTargetDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  throw new Error("Target start date and end date must use YYYY-MM-DD.");
}

function defaultReviewDates() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 90);
  return { startDate: ymd(start), endDate: ymd(end) };
}

function currentCycle(date = new Date()) {
  const quarter = Math.floor(date.getMonth() / 3);
  const end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
  return {
    label: `Q${quarter + 1} ${date.getFullYear()}`,
    closes: end.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
  };
}

function recordKind(record: Record<string, unknown>) {
  const kind = str(record.type ?? record.kind ?? record.category).toLowerCase();
  if (kind.includes("kpi")) return "kpi";
  if (kind.includes("goal")) return "goal";
  return "review";
}

function formatKpi(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value).trim();
  if (raw.endsWith("%")) return raw;
  const n = Number(raw.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return raw;
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

const { startDate: defaultStartDate, endDate: defaultEndDate } =
  defaultReviewDates();

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
  const manager = useManagerPortal();
  const [activeTab, setActiveTab] = useState<TargetTab>("Reviews");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction } = usePageActions();
  const cycle = useMemo(() => currentCycle(), []);

  const { data, loading, error, refetch } = useAsyncData(
    () => (manager ? managerApi.listTargets() : superAdminApi.targets.list()),
    [manager],
  );
  const { data: reportData } = useAsyncData(
    () => superAdminApi.reports.targets().catch(() => null),
    [],
  );
  const { data: employeeData } = useAsyncData(
    () => listStaffEmployees().catch(() => []),
    [],
  );

  const records = useMemo(() => listFrom(data ?? undefined), [data]);
  const employees = useMemo(
    () => (employeeData ?? []).map((record) => mapEmployee(record)),
    [employeeData],
  );

  const performanceReviews = useMemo(() => {
    return records
      .filter((record) => recordKind(record) === "review")
      .map((record) => mapPerformanceReview(record));
  }, [records]);

  const kpis = useMemo(() => {
    return records.filter((record) => recordKind(record) === "kpi");
  }, [records]);

  const goals = useMemo(() => {
    return records.filter((record) => recordKind(record) === "goal");
  }, [records]);

  const createFields = useMemo(
    () => [
      {
        name: "title",
        label: "Review title",
        required: true,
        placeholder: `${cycle.label} performance review`,
        minLength: 3,
        maxLength: 180,
        fullWidth: true,
      },
      {
        name: "employeeId",
        label: "Employee",
        type: "select" as const,
        required: true,
        defaultValue: "",
        options: [
          { label: "Select employee", value: "" },
          ...employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          })),
        ],
      },
      {
        name: "reviewerId",
        label: "Reviewed by",
        type: "select" as const,
        required: true,
        defaultValue: "",
        options: [
          { label: "Select reviewer", value: "" },
          ...employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          })),
        ],
      },
      {
        name: "startDate",
        label: "Start date",
        type: "date" as const,
        required: true,
        defaultValue: defaultStartDate,
        placeholder: "mm/dd/yyyy",
      },
      {
        name: "endDate",
        label: "End date",
        type: "date" as const,
        required: true,
        defaultValue: defaultEndDate,
        placeholder: "mm/dd/yyyy",
      },
      {
        name: "value",
        label: "Target value",
        type: "number" as const,
        required: true,
        defaultValue: "1",
        min: 0.01,
        step: 0.01,
      },
      {
        name: "rating",
        label: "Rating (1–5)",
        type: "number" as const,
        defaultValue: "4",
        min: 1,
        max: 5,
        step: 0.1,
      },
    ],
    [cycle.label, employees],
  );

  const targetStats = useMemo(() => {
    const summary = unwrapRecord(reportData ?? data);
    const ratings = performanceReviews
      .map((review) => review.rating)
      .filter((rating) => rating > 0);
    const avgScore =
      ratings.length > 0
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
        : "—";
    const reviewsDue = performanceReviews.filter(
      (review) => review.status === "In review" || review.status === "Overdue",
    ).length;
    const goalsOverdue = goals.filter((goal) =>
      str(goal.status).toLowerCase().includes("overdue"),
    ).length;
    const kpiLive = formatKpi(
      summary.kpiAttainment ?? summary.kpi ?? summary.attainment,
    );

    return [
      {
        id: "avg-score",
        label: "Avg review score",
        value: ratings.length ? avgScore : str(summary.avgScore ?? summary.averageRating, "—"),
        hint: cycle.label,
        accent: true,
      },
      {
        id: "reviews-due",
        label: "Reviews due",
        value: String(reviewsDue),
        hint: "This cycle",
      },
      {
        id: "kpi-attainment",
        label: "KPI attainment",
        value: kpiLive || "—",
        hint: "Overall",
      },
      {
        id: "goals-overdue",
        label: "Goals overdue",
        value: str(summary.goalsOverdue, String(goalsOverdue)),
        hint: "Action needed",
      },
    ];
  }, [cycle.label, data, goals, performanceReviews, reportData]);

  const filteredReviews = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return performanceReviews.filter((review) => {
      if (!needle) return true;
      const haystack =
        `${review.name} ${review.role} ${review.reviewedBy}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [performanceReviews, query]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Create review", async () => {
      const employee = employees.find((item) => item.id === values.employeeId);
      const reviewer = employees.find((item) => item.id === values.reviewerId);
      const name = employee?.name ?? "";
      const role = employee?.title ?? "";
      const reviewedBy = reviewer?.name ?? "";
      const title = (values.title.trim() || `${name} performance review`).slice(
        0,
        180,
      );
      if (title.length < 3) {
        throw new Error("Review title must be between 3 and 180 characters.");
      }
      const rating = Math.min(5, Math.max(1, Number(values.rating) || 1));
      const value = Number(values.value);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Target value must be greater than zero.");
      }
      const startDate = toTargetDate(values.startDate ?? "");
      const endDate = toTargetDate(values.endDate ?? "");
      if (endDate < startDate) {
        throw new Error("End date must be on or after the start date.");
      }

      const payload = {
        title,
        employeeId: values.employeeId,
        name,
        employeeName: name,
        role,
        jobTitle: role,
        reviewerId: values.reviewerId,
        reviewedBy,
        reviewer: reviewedBy,
        rating,
        score: rating,
        value,
        targetValue: value,
        target: value,
        status: "In review",
        startDate,
        endDate,
        periodStart: startDate,
        periodEnd: endDate,
        type: "review",
      };
      if (manager) {
        await managerApi.createTarget(payload);
      } else {
        await superAdminApi.targets.create(payload);
      }
      refetch();
    });
  }

  async function openReview(review: PerformanceReview) {
    await runAction(`Review — ${review.name}`, async () => {
      await superAdminApi.targets.get(review.id);
    });
  }

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        status={
          loading ? (
            <p className={styles.statusLine}>Loading performance…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Performance</p>
          <h1 className={styles.title}>Where growth becomes visible</h1>
          <p className={styles.subtitle}>
            Track appraisals, monitor KPIs, and build a culture of intentional
            progress.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          New review
        </button>
      </div>

      <div className={styles.stats}>
        {targetStats.map((stat) => (
          <article
            key={stat.id}
            className={`${styles.statCard} ${stat.accent ? styles.statCardAccent : ""}`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <div className={styles.statRow}>
              <p className={styles.statValue}>{stat.value}</p>
              <span className={styles.statHint}>{stat.hint}</span>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.filters}>
        {targetTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`${styles.filterChip} ${
              activeTab === tab ? styles.filterChipActive : ""
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Reviews" ? (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {cycle.label} performance reviews
            </h2>
            <p className={styles.sectionSubtitle}>
              Cycle closes {cycle.closes}. Reviews in progress are shown first.
            </p>
          </div>
          {filteredReviews.length === 0 ? (
            <p className={styles.empty}>No performance reviews match this filter.</p>
          ) : (
            filteredReviews.map((review) => (
              <button
                key={review.id}
                type="button"
                className={styles.reviewRow}
                onClick={() => void openReview(review)}
              >
                <span className={styles.avatar}>{review.initials}</span>
                <span className={styles.reviewInfo}>
                  <span className={styles.reviewName}>{review.name}</span>
                  <span className={styles.reviewMetaLine}>
                    {[
                      review.role,
                      review.reviewedBy ? `Reviewed by ${review.reviewedBy}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className={styles.reviewMeta}>
                  <StarRating rating={review.rating} />
                  <span className={statusClass[review.status]}>{review.status}</span>
                  <ChevronRight size={16} className={styles.chevron} />
                </span>
              </button>
            ))
          )}
        </section>
      ) : activeTab === "KPIs" ? (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>KPIs</h2>
            <p className={styles.sectionSubtitle}>
              Key performance indicators for this cycle.
            </p>
          </div>
          {kpis.length === 0 ? (
            <p className={styles.empty}>No KPIs in this cycle.</p>
          ) : (
            kpis.map((kpi) => (
              <article key={str(kpi.id ?? kpi._id)} className={styles.simpleRow}>
                <p className={styles.simpleTitle}>
                  {str(kpi.name ?? kpi.title ?? kpi.metric)}
                </p>
                <p className={styles.simpleValue}>
                  {formatKpi(kpi.attainment ?? kpi.value ?? kpi.percent) || "—"}
                </p>
              </article>
            ))
          )}
        </section>
      ) : (
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Goals</h2>
            <p className={styles.sectionSubtitle}>
              Individual and team goals for this cycle.
            </p>
          </div>
          {goals.length === 0 ? (
            <p className={styles.empty}>No goals in this cycle.</p>
          ) : (
            goals.map((goal) => (
              <article key={str(goal.id ?? goal._id)} className={styles.simpleRow}>
                <div>
                  <p className={styles.simpleTitle}>
                    {str(goal.name ?? goal.title)}
                  </p>
                  <p className={styles.simpleSub}>{str(goal.dueDate ?? goal.deadline)}</p>
                </div>
                <span
                  className={
                    str(goal.status).toLowerCase().includes("overdue")
                      ? styles.statusOverdue
                      : styles.statusInReview
                  }
                >
                  {str(goal.status, "In review")}
                </span>
              </article>
            ))
          )}
        </section>
      )}

      <SimpleModal
        open={createOpen}
        title="New performance review"
        fields={createFields}
        submitLabel="Create review"
        showClose
        wide
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
