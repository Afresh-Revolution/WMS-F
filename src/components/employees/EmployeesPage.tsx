"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import {
  type DepartmentFilter,
  type EmployeeStatus,
} from "@/data/employees";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { showCreatedCredentials } from "@/lib/createdCredentials";
import { listFrom, mapEmployee, readTemporaryPassword } from "@/lib/api/mappers";
import styles from "./EmployeesPage.module.css";

type ViewMode = "grid" | "list";

const statusClass: Record<EmployeeStatus, string> = {
  Active: styles.statusActive,
  "On leave": styles.statusLeave,
};

const addEmployeeFields = [
  { name: "fullName", label: "Full name", required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "phone", label: "Phone", placeholder: "08030000000" },
  { name: "jobTitle", label: "Job title", required: true },
  { name: "department", label: "Department", required: true },
  { name: "location", label: "Location", placeholder: "Remote" },
  {
    name: "role",
    label: "Role",
    type: "select" as const,
    required: true,
    defaultValue: "employee",
    options: [
      { label: "Employee", value: "employee" },
      { label: "NYSC", value: "nysc" },
      { label: "Intern", value: "intern" },
      { label: "Secretary", value: "secretary" },
      { label: "Manager", value: "manager" },
      { label: "Head of department", value: "hod" },
      { label: "HR", value: "hr" },
      { label: "Accountant", value: "accountant" },
    ],
  },
];

function buildEmployeeCreateBody(values: Record<string, string>) {
  const body: Record<string, unknown> = {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    jobTitle: values.jobTitle.trim(),
    department: values.department.trim(),
    role: values.role.trim() || "employee",
  };
  const phone = values.phone.trim();
  const location = values.location.trim();
  if (phone) body.phone = phone;
  if (location) body.location = location;
  return body;
}

export function EmployeesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DepartmentFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.employees.list(),
    [],
  );

  const employees = useMemo(
    () => listFrom(data ?? undefined).map((record) => mapEmployee(record)),
    [data],
  );

  const departmentFilters = useMemo((): DepartmentFilter[] => {
    const departments = new Set(employees.map((e) => e.department).filter(Boolean));
    return ["All", ...Array.from(departments)] as DepartmentFilter[];
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
  }, [activeFilter, query, employees]);

  function focusSearch() {
    searchRef.current?.focus();
    showToast("Use the search field below", "info");
  }

  function viewProfile(employee: (typeof employees)[number]) {
    showToast(
      `${employee.name} — ${employee.title}, ${employee.department}`,
      "info",
    );
    window.location.href = `mailto:${employee.email}`;
  }

  function closeAddModal() {
    if (saving) return;
    setAddOpen(false);
  }

  async function handleAddEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    for (const field of addEmployeeFields) {
      values[field.name] = String(form.get(field.name) ?? "");
    }
    setSaving(true);
    try {
      const created = await superAdminApi.employees.create(
        buildEmployeeCreateBody(values),
      );
      const temporaryPassword =
        readTemporaryPassword(created) || "No temporary password was returned.";
      showCreatedCredentials({
        name: values.fullName.trim(),
        email: values.email.trim(),
        password: temporaryPassword,
      });
      refetch();
      setAddOpen(false);
      router.push("/employees/created");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      showToast(`Add person failed — ${message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          {loading ? <span>Loading employees…</span> : null}
          {error ? <span role="alert">{error}</span> : null}
          <button
            type="button"
            className={styles.globalSearch}
            onClick={focusSearch}
          >
            <Search size={15} className={styles.globalSearchIcon} />
            <span className={styles.globalSearchText}>Search</span>
            <span className={styles.shortcut}>⌘ K</span>
          </button>
          <div className={styles.topActions}>
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
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
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setAddOpen(true)}
            >
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
            ref={searchRef}
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
                  <button
                    type="button"
                    className={styles.profileLink}
                    onClick={() => viewProfile(employee)}
                  >
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
                <button
                  type="button"
                  className={styles.profileLink}
                  onClick={() => viewProfile(employee)}
                >
                  View profile
                </button>
              </article>
            ))}

            {filteredEmployees.length === 0 && (
              <div className={styles.empty}>No staff match this view.</div>
            )}
          </div>
        )}

        {addOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                className={styles.passwordBackdrop}
                role="presentation"
                onClick={closeAddModal}
              >
                <div
                  className={styles.passwordModal}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="add-person-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h2 id="add-person-title" className={styles.passwordTitle}>
                    Add person
                  </h2>
                  <p className={styles.passwordCopy}>
                    Create a new staff directory entry.
                  </p>
                  <form
                    className={styles.addForm}
                    onSubmit={(event) => void handleAddEmployee(event)}
                  >
                    {addEmployeeFields.map((field) => (
                      <label key={field.name} className={styles.addField}>
                        <span>{field.label}</span>
                        {field.type === "select" ? (
                          <select
                            name={field.name}
                            defaultValue={field.defaultValue}
                            required={field.required}
                          >
                            {(field.options ?? []).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            name={field.name}
                            type={field.type ?? "text"}
                            placeholder={field.placeholder}
                            required={field.required}
                          />
                        )}
                      </label>
                    ))}
                    <div className={styles.passwordActions}>
                      <button
                        type="button"
                        className={styles.passwordCancel}
                        onClick={closeAddModal}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.addSubmit}
                        disabled={saving}
                      >
                        {saving ? "Adding…" : "Add person"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
  );
}
