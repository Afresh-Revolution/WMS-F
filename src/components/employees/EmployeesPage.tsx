"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  departmentFilters as defaultDepartmentFilters,
  type DepartmentFilter,
  type EmployeeStatus,
} from "@/data/employees";
import { useManagerEmployees } from "@/lib/hooks/useManagerApi";
import styles from "./EmployeesPage.module.css";

type ViewMode = "grid" | "list";

const statusClass: Record<EmployeeStatus, string> = {
  Active: styles.statusActive,
  "On leave": styles.statusLeave,
};

export function EmployeesPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DepartmentFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { items: employees } = useManagerEmployees();

  const departmentFilters = useMemo(() => {
    const unique = Array.from(
      new Set(employees.map((employee) => employee.department).filter(Boolean)),
    );
    return unique.length ? ["All", ...unique] : defaultDepartmentFilters;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesFilter =
        activeFilter === "All" || employee.department === activeFilter;
      const haystack =
        `${employee.name} ${employee.title} ${employee.location} ${employee.department} ${employee.email}`.toLowerCase();
      return (
        matchesFilter && haystack.includes(query.trim().toLowerCase())
      );
    });
  }, [activeFilter, employees, query]);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <div className={styles.globalSearch}>
            <Search size={15} className={styles.globalSearchIcon} />
            <span className={styles.globalSearchText}>Search</span>
            <span className={styles.shortcut}>⌘ K</span>
          </div>
          <div className={styles.topActions}>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Staff Directory</p>
            <h1 className={styles.title}>Everyone, in one considered place</h1>
            <p className={styles.subtitle}>
              Find colleagues, view profiles, and keep the organization connected.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.addButton}>
              <Plus size={16} strokeWidth={2.5} />
              Add person
            </button>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewButton} ${
                  viewMode === "grid" ? styles.viewButtonActive : ""
                }`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={14} />
                Grid
              </button>
              <button
                type="button"
                className={`${styles.viewButton} ${
                  viewMode === "list" ? styles.viewButtonActive : ""
                }`}
                onClick={() => setViewMode("list")}
              >
                <List size={14} />
                List
              </button>
            </div>
          </div>
        </div>

        <label className={styles.staffSearch}>
          <Search size={16} className={styles.staffSearchIcon} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff..."
            className={styles.staffSearchInput}
          />
        </label>

        <div className={styles.filters}>
          {departmentFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {viewMode === "grid" ? (
          <div className={styles.grid}>
            {filteredEmployees.map((employee) => (
              <article key={employee.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <span
                      className={styles.avatar}
                      style={{ background: employee.avatarColor }}
                    >
                      {employee.initials}
                    </span>
                    <span className={statusClass[employee.status]}>
                      {employee.status}
                    </span>
                  </div>
                  <h2 className={styles.name}>{employee.name}</h2>
                  <p className={styles.jobTitle}>{employee.title}</p>
                  <div className={styles.meta}>
                    <p className={styles.metaItem}>
                      <MapPin size={14} className={styles.metaIcon} />
                      {employee.location} • {employee.department}
                    </p>
                    <p className={styles.metaItem}>
                      <Mail size={14} className={styles.metaIcon} />
                      {employee.email}
                    </p>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button type="button" className={styles.profileLink}>
                    View profile
                  </button>
                </div>
              </article>
            ))}

            {filteredEmployees.length === 0 && (
              <div className={styles.empty}>No staff match this view.</div>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {filteredEmployees.map((employee) => (
              <article key={employee.id} className={styles.listRow}>
                <div className={styles.listIdentity}>
                  <span
                    className={styles.avatar}
                    style={{ background: employee.avatarColor }}
                  >
                    {employee.initials}
                  </span>
                  <div className={styles.listMeta}>
                    <p className={styles.listName}>{employee.name}</p>
                    <p className={styles.listTitle}>{employee.title}</p>
                  </div>
                </div>
                <p className={styles.listCell}>
                  {employee.location} • {employee.department}
                </p>
                <p className={styles.listCell}>{employee.email}</p>
                <span className={statusClass[employee.status]}>
                  {employee.status}
                </span>
                <button type="button" className={styles.profileLink}>
                  View profile
                </button>
              </article>
            ))}

            {filteredEmployees.length === 0 && (
              <div className={styles.empty}>No staff match this view.</div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
