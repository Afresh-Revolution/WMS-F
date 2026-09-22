"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import {
  promotionFilters,
  type PromotionFilter,
  type PromotionStatus,
} from "@/data/promotions";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { listStaffEmployees, superAdminApi } from "@/lib/api";
import { listFrom, mapEmployee, mapPromotion } from "@/lib/api/mappers";
import styles from "./PromotionsPage.module.css";

const statusClass: Record<PromotionStatus, string> = {
  "Under admin review": styles.statusReview,
  Draft: styles.statusDraft,
  Approved: styles.statusApproved,
  Rejected: styles.statusRejected,
};

const statusLabels: Record<PromotionStatus, string> = {
  "Under admin review": "Under Admin Review",
  Draft: "Draft",
  Approved: "Approved",
  Rejected: "Rejected",
};

const filterLabels: Record<PromotionFilter, string> = {
  All: "All",
  "Under admin review": "Under Admin Review",
  Approved: "Approved",
  Draft: "Draft",
  Rejected: "Rejected",
};

function formatPromoDate(value: string, withYear = false) {
  const text = value.trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function PromotionsPage() {
  const [activeFilter, setActiveFilter] = useState<PromotionFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () =>
      superAdminApi.hr.promotions.list().catch(() => superAdminApi.promotions.list()),
    [],
  );
  const { data: employeeData } = useAsyncData(
    () => listStaffEmployees().catch(() => []),
    [],
  );

  const promotions = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapPromotion(record));
  }, [data]);

  const employees = useMemo(
    () => (employeeData ?? []).map((record) => mapEmployee(record)),
    [employeeData],
  );

  const promotionStats = useMemo(() => {
    const review = promotions.filter((p) => p.status === "Under admin review").length;
    const approved = promotions.filter((p) => p.status === "Approved").length;
    const draft = promotions.filter((p) => p.status === "Draft").length;
    return [
      { id: "total", label: "Total", value: String(promotions.length) },
      {
        id: "review",
        label: "Under review",
        value: String(review),
        accent: true,
      },
      { id: "approved", label: "Approved", value: String(approved) },
      { id: "draft", label: "Drafts", value: String(draft) },
    ];
  }, [promotions]);

  const filteredPromotions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return promotions.filter((promotion) => {
      const matchesFilter =
        activeFilter === "All" || promotion.status === activeFilter;
      const haystack =
        `${promotion.name} ${promotion.currentRole} ${promotion.proposedRole} ${promotion.department ?? ""}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [activeFilter, promotions, query]);

  const newPromotionFields = useMemo(
    () => [
      {
        name: "employeeId",
        label: "Employee",
        type: "select" as const,
        required: true,
        defaultValue: "",
        fullWidth: true,
        options: [
          { label: "Select employee", value: "" },
          ...employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          })),
        ],
      },
      {
        name: "currentRole",
        label: "Current position",
        placeholder: "Current title",
        required: true,
      },
      {
        name: "proposedRole",
        label: "Proposed position",
        placeholder: "New title",
        required: true,
      },
      {
        name: "reason",
        label: "Reason for recommendation",
        type: "textarea" as const,
        placeholder: "Performance summary and justification",
        fullWidth: true,
        rows: 4,
      },
      {
        name: "effectiveDate",
        label: "Recommended effective date",
        type: "date" as const,
        placeholder: "mm/dd/yyyy",
        fullWidth: true,
      },
    ],
    [employees],
  );

  async function savePromotion(
    values: Record<string, string>,
    status: "draft" | "under_review",
    label: string,
  ) {
    await runAction(label, async () => {
      const employee = employees.find((item) => item.id === values.employeeId);
      const currentRole =
        values.currentRole.trim() || employee?.title || "";
      const proposedRole = values.proposedRole.trim();
      const reason = values.reason.trim();
      const effectiveDate = values.effectiveDate.trim();
      const body: Record<string, unknown> = {
        employeeId: values.employeeId,
        name: employee?.name ?? values.employeeId,
        currentRole,
        fromRole: currentRole,
        currentTitle: currentRole,
        proposedRole,
        toRole: proposedRole,
        proposedTitle: proposedRole,
        status,
      };
      if (employee?.department) body.department = employee.department;
      if (reason) {
        body.reason = reason;
        body.justification = reason;
        body.note = reason;
      }
      if (effectiveDate) {
        body.effectiveDate = effectiveDate;
        body.effectiveFrom = effectiveDate;
      }
      await superAdminApi.hr.promotions
        .create(body)
        .catch(() => superAdminApi.promotions.create(body));
      refetch();
    });
  }

  async function handleSubmitPromotion(values: Record<string, string>) {
    await savePromotion(values, "under_review", "Submit to Admin");
  }

  async function handleDraftPromotion(values: Record<string, string>) {
    await savePromotion(values, "draft", "Save as draft");
  }

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        status={
          loading ? (
            <p className={styles.statusLine}>Loading promotions…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

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
          <article
            key={stat.id}
            className={`${styles.statCard} ${stat.accent ? styles.statCardAccent : ""}`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </article>
        ))}
      </div>

      <div className={styles.filters}>
        {promotionFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`${styles.filterChip} ${
              activeFilter === filter ? styles.filterChipActive : ""
            }`}
          >
            {filterLabels[filter]}
          </button>
        ))}
      </div>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Promotion recommendations</h2>
        </div>

        {filteredPromotions.length === 0 ? (
          <p className={styles.empty}>No promotions match this filter.</p>
        ) : (
          filteredPromotions.map((promotion) => (
            <article key={promotion.id} className={styles.listRow}>
              <div className={styles.rowIdentity}>
                <span className={styles.avatar}>{promotion.initials}</span>
                <div className={styles.rowBody}>
                  <p className={styles.name}>{promotion.name}</p>
                  <p className={styles.rolePath}>
                    {promotion.currentRole}
                    {promotion.currentRole && promotion.proposedRole ? " → " : ""}
                    {promotion.proposedRole ? (
                      <span className={styles.proposedRole}>
                        {promotion.proposedRole}
                      </span>
                    ) : null}
                    {promotion.department ? ` · ${promotion.department}` : ""}
                  </p>
                  <p className={styles.dates}>
                    {[
                      promotion.submittedDate
                        ? `Submitted ${formatPromoDate(promotion.submittedDate)}`
                        : "",
                      promotion.effectiveDate
                        ? `Eff. ${formatPromoDate(promotion.effectiveDate, true)}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
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
          ))
        )}
      </section>

      <SimpleModal
        open={createOpen}
        title="New promotion recommendation"
        fields={newPromotionFields}
        submitLabel="Submit to Admin"
        secondaryLabel="Save as draft"
        hideCancel
        showClose
        wide
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmitPromotion}
        onSecondary={handleDraftPromotion}
      />
    </div>
  );
}
