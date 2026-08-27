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
import { AppShell } from "@/components/layout/AppShell";
import {
  departmentFilters,
  departmentStats,
  type DepartmentFilter,
} from "@/data/departments";
import { useManagerDepartments } from "@/lib/hooks/useManagerApi";
import styles from "./DepartmentsPage.module.css";

const deptIcons = {
  software: Monitor,
  fashion: Shirt,
  media: Camera,
  hardware: Cpu,
  hr: Briefcase,
  model: Layers,
} as const;

export function DepartmentsPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<DepartmentFilter>("All departments");
  const { items: departments, refresh } = useManagerDepartments();

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
  }, [activeFilter, departments, query]);

  return (
    <AppShell>
      <div className={styles.page}>
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
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} />
            </button>
            <button type="button" aria-label="Add department" className={styles.iconButton}>
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
                  <button type="button" className={styles.viewLink}>
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
      </div>
    </AppShell>
  );
}
