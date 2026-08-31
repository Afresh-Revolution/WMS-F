"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Camera,
  Cpu,
  Layers,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  Users,
} from "lucide-react";
import {
  departmentFilters,
  departments as fallbackDepartments,
  departmentStats as fallbackStats,
  type DepartmentFilter,
} from "@/data/departments";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { departmentsApi } from "@/lib/api";
import { listFrom, mapDepartmentRecord } from "@/lib/api/mappers";
import styles from "./DepartmentsPage.module.css";

const deptIcons = {
  software: Monitor,
  fashion: Shirt,
  media: Camera,
  hardware: Cpu,
  hr: Briefcase,
  model: Layers,
} as const;

const addDepartmentFields = [
  { name: "name", label: "Department name", required: true },
  { name: "managerName", label: "Head of department", required: true },
  { name: "description", label: "Description", type: "textarea" as const },
];

export function DepartmentsPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<DepartmentFilter>("All departments");
  const [addOpen, setAddOpen] = useState(false);

  const { runAction, showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => departmentsApi.list(),
    [],
  );

  const departments = useMemo(() => {
    const records = listFrom(data ?? undefined);
    return records.length > 0
      ? records.map((record, index) => mapDepartmentRecord(record, index))
      : fallbackDepartments;
  }, [data]);

  const departmentStats = useMemo(() => {
    const totalHeadcount = departments.reduce(
      (sum, dept) => sum + dept.activeCount,
      0,
    );
    return [
      {
        id: "departments",
        label: "Departments",
        value: String(departments.length || fallbackStats[0].value),
      },
      {
        id: "headcount",
        label: "Total Headcount",
        value: totalHeadcount
          ? totalHeadcount.toLocaleString()
          : fallbackStats[1].value,
      },
      {
        id: "regions",
        label: "For All Regions",
        value: fallbackStats[2].value,
      },
    ];
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const matchesFilter =
        activeFilter === "All departments" ||
        (activeFilter === "Active" && department.status === "Active") ||
        (activeFilter === "No HOD" && !department.hasHod);
      const haystack =
        `${department.name} ${department.managerName}`.toLowerCase();
      return (
        matchesFilter && haystack.includes(query.trim().toLowerCase())
      );
    });
  }, [activeFilter, query, departments]);

  function viewDepartment(department: (typeof departments)[number]) {
    void (async () => {
      try {
        await departmentsApi.get(department.id);
      } catch {
        /* fallback to local info if API unavailable */
      }
      showToast(
        `${department.name} — ${department.activeCount} active, HOD: ${department.managerName}`,
        "info",
      );
    })();
  }

  async function handleAddDepartment(values: Record<string, string>) {
    await runAction("Add department", async () => {
      await departmentsApi.create(values);
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      {loading ? <p>Loading departments…</p> : null}
      {error ? <p role="alert">Using cached departments — {error}</p> : null}
        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>Departments &amp; how they work</p>
            <h1 className={styles.title}>AfrESH is organised</h1>
            <p className={styles.dateLabel}>Monday, August 12</p>
          </div>
          <div className={styles.headerActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
              <span className={styles.shortcut}>Ctrl K</span>
            </label>
            <button
              type="button"
              aria-label="Refresh"
              className={styles.iconButton}
              onClick={() => refetch()}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              aria-label="Add department"
              className={styles.iconButton}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          {departmentStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {departmentFilters.map((filter) => {
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

        <div className={styles.grid}>
          {filteredDepartments.map((department) => {
            const Icon = deptIcons[department.icon];
            return (
              <article key={department.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span className={styles.deptIcon}>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className={styles.statusActive}>Active</span>
                  </div>
                  <h2 className={styles.deptName}>{department.name}</h2>
                  <div className={styles.managerRow}>
                    <span
                      className={styles.managerAvatar}
                      style={{ background: department.managerAvatarColor }}
                    >
                      {department.managerInitials}
                    </span>
                    <p className={styles.managerName}>{department.managerName}</p>
                  </div>
                  <div className={styles.metricsRow}>
                    <p className={styles.activeCount}>
                      <Users size={14} className={styles.activeIcon} />
                      {department.activeCount} active
                    </p>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${department.targetPercent}%` }}
                      />
                    </div>
                    <p className={styles.targetPercent}>
                      {department.targetPercent}% targets
                    </p>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={styles.viewLink}
                    onClick={() => viewDepartment(department)}
                  >
                    View department &gt;
                  </button>
                </div>
              </article>
            );
          })}

          {filteredDepartments.length === 0 && (
            <div className={styles.empty}>No departments match this view.</div>
          )}
        </div>

        <SimpleModal
          open={addOpen}
          title="Add department"
          description="Create a new department."
          fields={addDepartmentFields}
          submitLabel="Add department"
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddDepartment}
        />
      </div>
  );
}
