"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import {
  incrementFilters,
  type IncrementFilter,
  type IncrementStatus,
  type SalaryIncrement,
} from "@/data/salaryIncrements";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SalaryIncrementDrawer } from "@/components/salary-increments/SalaryIncrementDrawer";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { listStaffEmployees, managerApi, superAdminApi } from "@/lib/api";
import { listFrom, mapEmployee, mapSalaryIncrement } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./SalaryIncrementsPage.module.css";

const statusClass: Record<IncrementStatus, string> = {
  "Under admin review": styles.statusReview,
  Draft: styles.statusDraft,
  Approved: styles.statusApproved,
};

const statusLabels: Record<IncrementStatus, string> = {
  "Under admin review": "Under Admin Review",
  Draft: "Draft",
  Approved: "Approved",
};

const filterLabels: Record<IncrementFilter, string> = {
  All: "All",
  "Under admin review": "Under Admin Review",
  Approved: "Approved",
  Draft: "Draft",
};

function parseAmount(value: string) {
  const amount = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatNaira(value: string) {
  if (!value.trim()) return "";
  if (/[₦N]/.test(value) && /[,\d]/.test(value)) {
    return value.replace(/^N\s?/, "₦ ");
  }
  const amount = parseAmount(value);
  if (!amount && value !== "0") return value;
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

function formatPercent(value: string) {
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || n === 0) return "";
  const sign = n > 0 && !String(value).trim().startsWith("-") ? "+" : "";
  const text = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${sign}${text}%`;
}

function formatEffectiveDate(value: string) {
  const text = value.trim();
  if (!text) return "";
  const isoDay = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoDay
    ? new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]))
    : new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SalaryIncrementsPage() {
  const manager = useManagerPortal();
  const [activeFilter, setActiveFilter] = useState<IncrementFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIncrement, setSelectedIncrement] =
    useState<SalaryIncrement | null>(null);
  const [query, setQuery] = useState("");

  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () =>
      manager
        ? managerApi.listSalaryRecommendations()
        : superAdminApi.salaryIncrements
            .list()
            .catch(() => superAdminApi.hr.salaryAdjustments.list()),
    [manager],
  );
  const { data: employeeData } = useAsyncData(
    () => listStaffEmployees().catch(() => []),
    [],
  );

  const salaryIncrements = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapSalaryIncrement(record));
  }, [data]);

  const employees = useMemo(
    () => (employeeData ?? []).map((record) => mapEmployee(record)),
    [employeeData],
  );

  const incrementFields = useMemo(
    () => [
      {
        name: "employeeId",
        label: "Employee",
        type: "select" as const,
        required: true,
        fullWidth: true,
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
        name: "currentSalary",
        label: "Current salary (₦)",
        type: "number" as const,
        placeholder: "0",
        min: 0,
      },
      {
        name: "proposedSalary",
        label: "Proposed salary (₦)",
        type: "number" as const,
        placeholder: "0",
        min: 0,
      },
      {
        name: "reason",
        label: "Reason",
        type: "textarea" as const,
        fullWidth: true,
        rows: 3,
        placeholder: "Performance evidence and justification",
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

  const incrementStats = useMemo(() => {
    const review = salaryIncrements.filter(
      (item) => item.status === "Under admin review",
    ).length;
    const approved = salaryIncrements.filter((item) => item.status === "Approved").length;
    const percents = salaryIncrements
      .map((item) => parseFloat(item.incrementPercent.replace(/[^\d.-]/g, "")))
      .filter((value) => Number.isFinite(value));
    const avgIncrement =
      percents.length > 0
        ? `${(percents.reduce((sum, value) => sum + value, 0) / percents.length).toFixed(1)}%`
        : "—";
    return [
      { id: "total", label: "Total", value: String(salaryIncrements.length) },
      {
        id: "review",
        label: "Under review",
        value: String(review),
        accent: true,
      },
      { id: "approved", label: "Approved", value: String(approved) },
      { id: "avg", label: "Avg increment", value: avgIncrement },
    ];
  }, [salaryIncrements]);

  const filteredIncrements = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return salaryIncrements.filter((increment) => {
      const matchesFilter =
        activeFilter === "All" || increment.status === activeFilter;
      const haystack =
        `${increment.name} ${increment.department} ${increment.currentSalary} ${increment.proposedSalary}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [activeFilter, query, salaryIncrements]);

  async function saveIncrement(
    values: Record<string, string>,
    status: "draft" | "under_review",
    actionLabel: string,
  ) {
    const employee = employees.find((item) => item.id === values.employeeId);
    const currentSalary = Number(values.currentSalary) || 0;
    const proposedSalary = Number(values.proposedSalary) || 0;
    const body: Record<string, unknown> = {
      employeeId: values.employeeId,
      employeeName: employee?.name,
      name: employee?.name,
      department: employee?.department,
      currentSalary,
      proposedSalary,
      currentAmount: currentSalary,
      proposedAmount: proposedSalary,
      reason: values.reason.trim(),
      justification: values.reason.trim(),
      effectiveDate: values.effectiveDate,
      effectiveFrom: values.effectiveDate,
      status,
    };
    await runAction(actionLabel, async () => {
      if (manager) {
        await managerApi.createSalaryRecommendation(body);
      } else {
        await superAdminApi.hr.salaryAdjustments
          .create(body)
          .catch(() => superAdminApi.salaryIncrements.create(body));
      }
      refetch();
    });
  }

  async function handleSubmitIncrement(values: Record<string, string>) {
    await saveIncrement(values, "under_review", "Submit to Admin");
  }

  async function handleDraftIncrement(values: Record<string, string>) {
    await saveIncrement(values, "draft", "Save as draft");
  }

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        status={
          loading ? (
            <p className={styles.statusLine}>Loading increments…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

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
            className={`${styles.statCard} ${stat.accent ? styles.statCardAccent : ""}`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </article>
        ))}
      </div>

      <div className={styles.filters}>
        {incrementFilters.map((filter) => (
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
          <h2 className={styles.sectionTitle}>Increment recommendations</h2>
        </div>

        {filteredIncrements.length === 0 ? (
          <p className={styles.empty}>No increment recommendations match this filter.</p>
        ) : (
          filteredIncrements.map((increment) => {
            const percent = formatPercent(increment.incrementPercent);
            const effective = formatEffectiveDate(increment.effectiveDate);
            return (
              <article
                key={increment.id}
                className={styles.listRow}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedIncrement(increment)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedIncrement(increment);
                  }
                }}
              >
                <div className={styles.rowIdentity}>
                  <span className={styles.avatar}>{increment.initials}</span>
                  <div className={styles.rowBody}>
                    <p className={styles.name}>{increment.name}</p>
                    <p className={styles.salaryPath}>
                      {[increment.department, formatNaira(increment.currentSalary)]
                        .filter(Boolean)
                        .join(" · ")}
                      {increment.proposedSalary
                        ? " → "
                        : ""}
                      {increment.proposedSalary ? (
                        <span className={styles.proposedSalary}>
                          {formatNaira(increment.proposedSalary)}
                        </span>
                      ) : null}
                    </p>
                    <p className={styles.dates}>
                      {[
                        percent,
                        effective ? `Eff. ${effective}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  {percent ? (
                    <span className={styles.percentChip}>{percent}</span>
                  ) : null}
                  <span className={statusClass[increment.status]}>
                    {statusLabels[increment.status]}
                  </span>
                  <ChevronRight size={18} className={styles.chevron} />
                </div>
              </article>
            );
          })
        )}
      </section>

      <SimpleModal
        open={createOpen}
        title="New salary increment recommendation"
        fields={incrementFields}
        submitLabel="Submit to Admin"
        secondaryLabel="Save as draft"
        hideCancel
        showClose
        wide
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmitIncrement}
        onSecondary={handleDraftIncrement}
      />

      {selectedIncrement ? (
        <SalaryIncrementDrawer
          increment={selectedIncrement}
          onClose={() => setSelectedIncrement(null)}
          onUpdated={refetch}
        />
      ) : null}
    </div>
  );
}
