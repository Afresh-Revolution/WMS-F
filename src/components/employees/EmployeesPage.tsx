"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { EmployeeProfileDrawer } from "@/components/employees/EmployeeProfileDrawer";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  createStaffEmployee,
  departmentsApi,
  listStaffEmployees,
  lookupsApi,
} from "@/lib/api";
import { showCreatedCredentials } from "@/lib/createdCredentials";
import { listFrom, mapEmployee, readTemporaryPassword, str, type MappedEmployee } from "@/lib/api/mappers";
import { portalHref } from "@/lib/portalPaths";
import styles from "./EmployeesPage.module.css";

type ViewMode = "grid" | "list";

const statusClass: Record<EmployeeStatus, string> = {
  Active: styles.statusActive,
  "On leave": styles.statusLeave,
};

const roleOptions = [
  { label: "Employee", value: "employee" },
  { label: "NYSC", value: "nysc" },
  { label: "Intern", value: "intern" },
  { label: "Secretary", value: "secretary" },
  { label: "Manager", value: "manager" },
  { label: "Head of department", value: "hod" },
  { label: "HR", value: "hr" },
  { label: "Accountant", value: "accountant" },
];

export function EmployeesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DepartmentFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState<MappedEmployee | null>(
    null,
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const { showToast } = usePageActions();
  useEffect(() => {
    const department = searchParams.get("department");
    if (department) setActiveFilter(department);
  }, [searchParams]);
  const { data, loading, error, refetch } = useAsyncData(
    () => listStaffEmployees(),
    [],
  );
  const { data: departmentData } = useAsyncData(async () => {
    const settled = await Promise.allSettled([
      lookupsApi.departments(),
      departmentsApi.list(),
    ]);
    for (const result of settled) {
      if (result.status === "fulfilled") return result.value;
    }
    return null;
  }, []);

  const employees = useMemo(
    () => (data ?? []).map((record) => mapEmployee(record)),
    [data],
  );

  const departmentOptions = useMemo(
    () =>
      listFrom(departmentData ?? undefined)
        .map((record) => ({
          id: str(record.id ?? record._id),
          name: str(record.name ?? record.title ?? record.label),
        }))
        .filter((item) => item.id && item.name),
    [departmentData],
  );

  const addEmployeeFields = useMemo(
    () => [
      { name: "fullName", label: "Full name", required: true },
      { name: "email", label: "Email", type: "email" as const, required: true },
      { name: "phone", label: "Phone", placeholder: "08030000000" },
      { name: "jobTitle", label: "Job title", required: true },
      {
        name: "departmentId",
        label: "Department",
        type: "select" as const,
        required: true,
        defaultValue: departmentOptions[0]?.id ?? "",
        options:
          departmentOptions.length > 0
            ? departmentOptions.map((department) => ({
                label: department.name,
                value: department.id,
              }))
            : [{ label: "Loading departments…", value: "" }],
      },
      { name: "location", label: "Location", placeholder: "Remote" },
      {
        name: "role",
        label: "Role",
        type: "select" as const,
        required: true,
        defaultValue: "employee",
        options: roleOptions,
      },
    ],
    [departmentOptions],
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

  function viewProfile(employee: MappedEmployee) {
    setProfileEmployee(employee);
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
    values.departmentId = String(
      form.get("departmentId") ?? values.departmentId ?? "",
    );
    values.department = String(form.get("department") ?? values.department ?? "");
    const selectedDepartment = departmentOptions.find(
      (department) =>
        department.id === values.departmentId ||
        department.name === values.department,
    );
    if (selectedDepartment) {
      values.departmentId = selectedDepartment.id;
      values.department = selectedDepartment.name;
    }
    setSaving(true);
    try {
      const created = await createStaffEmployee(values);
      const temporaryPassword =
        readTemporaryPassword(created) || "No temporary password was returned.";
      showCreatedCredentials({
        name: values.fullName.trim(),
        email: values.email.trim(),
        password: temporaryPassword,
      });
      refetch();
      setAddOpen(false);
      router.push(portalHref(pathname, "/employees/created"));
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
                <button
                  type="button"
                  className={styles.cardFooter}
                  onClick={() => viewProfile(employee)}
                >
                  View profile
                </button>
              </article>
            ))}

            {filteredEmployees.length === 0 && !loading && (
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

            {filteredEmployees.length === 0 && !loading && (
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
                    <div className={styles.addFormFields}>
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
                    </div>
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
                        disabled={saving || departmentOptions.length === 0}
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

        {profileEmployee ? (
          <EmployeeProfileDrawer
            employee={profileEmployee}
            onClose={() => setProfileEmployee(null)}
          />
        ) : null}
      </div>
  );
}
