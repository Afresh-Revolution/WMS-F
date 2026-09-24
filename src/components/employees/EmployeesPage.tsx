"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mail, MapPin, Plus, Search, X } from "lucide-react";
import {
  type DepartmentFilter,
  type EmployeeStatus,
} from "@/data/employees";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { EmployeeProfileDrawer } from "@/components/employees/EmployeeProfileDrawer";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  createStaffEmployee,
  departmentsApi,
  listStaffEmployees,
  managerApi,
  lookupsApi,
  superAdminApi,
} from "@/lib/api";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { showCreatedCredentials } from "@/lib/createdCredentials";
import { listFrom, mapEmployee, readTemporaryPassword, str, type MappedEmployee } from "@/lib/api/mappers";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { canAddUsers } from "@/lib/auth/portals";
import { portalHref } from "@/lib/portalPaths";
import styles from "./EmployeesPage.module.css";

type ViewMode = "grid" | "list";

const statusClass: Record<EmployeeStatus, string> = {
  Active: styles.statusActive,
  "On leave": styles.statusLeave,
};

const employmentTypeOptions = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
];

function sameDepartment(employeeDepartment: string, filter: string) {
  const left = employeeDepartment.trim().toLowerCase();
  const right = filter.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  if (right === "hr" && /(^|\b)(hr|human resources)(\b|$)/.test(left)) return true;
  return false;
}

export function EmployeesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const manager = useManagerPortal();
  const allowAddUsers = canAddUsers(user?.role ?? "");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DepartmentFilter>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState<MappedEmployee | null>(
    null,
  );
  const [createdRecords, setCreatedRecords] = useState<
    Record<string, unknown>[]
  >([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const { showToast } = usePageActions();
  useEffect(() => {
    const department = searchParams.get("department");
    if (department) setActiveFilter(department);
  }, [searchParams]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const { data, loading, error, refetch } = useAsyncData(
    () => listStaffEmployees(),
    [],
  );
  const { data: departmentData } = useAsyncData(async () => {
    const settled = await Promise.allSettled([
      manager ? managerApi.listDepartments() : Promise.reject(),
      superAdminApi.departments.list(),
      lookupsApi.departments(),
      departmentsApi.list(),
    ]);
    const rows: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const result of settled) {
      if (result.status !== "fulfilled" || !result.value) continue;
      for (const record of listFrom(result.value)) {
        const key = str(record.id ?? record._id ?? record.name).toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push(record);
      }
    }
    return rows.length ? rows : null;
  }, [manager]);

  const employees = useMemo(() => {
    const rows: MappedEmployee[] = [];
    const seen = new Set<string>();
    for (const record of [...createdRecords, ...(data ?? [])]) {
      const mapped = mapEmployee(record);
      const key = `${mapped.email || mapped.id}`.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push(mapped);
    }
    return rows;
  }, [createdRecords, data]);

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
      {
        name: "fullName",
        label: "Full name",
        placeholder: "e.g. Ada Obi",
        required: true,
      },
      {
        name: "jobTitle",
        label: "Job title",
        placeholder: "e.g. Product Designer",
        required: true,
      },
      {
        name: "departmentId",
        label: "Department",
        type: "select" as const,
        defaultValue: departmentOptions[0]?.id ?? "",
        options:
          departmentOptions.length > 0
            ? departmentOptions.map((department) => ({
                label: department.name,
                value: department.id,
              }))
            : [{ label: "Loading departments…", value: "" }],
      },
      {
        name: "employmentType",
        label: "Employment type",
        type: "select" as const,
        defaultValue: "Full-time",
        options: employmentTypeOptions,
      },
      {
        name: "email",
        label: "Company email (optional)",
        type: "email" as const,
        placeholder: "name@afresh.co",
      },
    ],
    [departmentOptions],
  );

  const departmentFilters = useMemo((): DepartmentFilter[] => {
    const names: string[] = [];
    const seen = new Set<string>();
    const add = (name: string) => {
      const trimmed = name.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || trimmed === "All" || seen.has(key)) return;
      seen.add(key);
      names.push(trimmed);
    };
    for (const department of departmentOptions) add(department.name);
    for (const employee of employees) add(employee.department);
    return ["All", ...names] as DepartmentFilter[];
  }, [departmentOptions, employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesFilter =
        activeFilter === "All" ||
        sameDepartment(employee.department, activeFilter);
      const haystack =
        `${employee.name} ${employee.title} ${employee.location} ${employee.department} ${employee.email}`.toLowerCase();
      return (
        matchesFilter && haystack.includes(query.trim().toLowerCase())
      );
    });
  }, [activeFilter, query, employees]);

  function viewProfile(employee: MappedEmployee) {
    setProfileEmployee(employee);
  }

  function closeAddModal() {
    if (saving) return;
    setAddOpen(false);
  }

  useEffect(() => {
    if (!addOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAddModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addOpen, saving]);

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
    values.role = "employee";
    values.employmentType = String(
      form.get("employmentType") ?? values.employmentType ?? "Full-time",
    );
    setSaving(true);
    try {
      const created = await createStaffEmployee(values);
      setCreatedRecords((current) => [created, ...current]);
      setActiveFilter("All");
      refetch();
      setAddOpen(false);
      if (values.email.trim()) {
        const temporaryPassword =
          readTemporaryPassword(created) || "No temporary password was returned.";
        showCreatedCredentials({
          name: values.fullName.trim(),
          email: values.email.trim(),
          password: temporaryPassword,
        });
        router.push(portalHref(pathname, "/employees/created"));
      } else {
        showToast("Employee record created.", "success");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      showToast(`Create record failed — ${message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className={styles.page}>
        <PageTopBar
          status={
            loading ? (
              <p className={styles.statusLine}>Loading employees…</p>
            ) : error ? (
              <p className={styles.statusLine} role="alert">
                {error}
              </p>
            ) : null
          }
        />

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Staff Directory</p>
            <h1 className={styles.title}>Everyone, in one considered place</h1>
            <p className={styles.subtitle}>
              Find colleagues, view profiles, and keep the organisation connected.
            </p>
          </div>
          {allowAddUsers ? (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              Add person
            </button>
          ) : null}
        </div>

        <div className={styles.toolbar}>
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
          <div className={styles.viewToggle} role="group" aria-label="Directory view">
            <button
              type="button"
              className={`${styles.viewButton} ${
                viewMode === "grid" ? styles.viewButtonActive : ""
              }`}
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              type="button"
              className={`${styles.viewButton} ${
                viewMode === "list" ? styles.viewButtonActive : ""
              }`}
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
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
            {filteredEmployees.map((employee) => {
              const locationLine = [employee.location, employee.department]
                .filter((part) => part.trim())
                .join(" · ");
              return (
                <article key={employee.id} className={styles.card}>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <span className={styles.avatar}>{employee.initials}</span>
                      <span className={statusClass[employee.status]}>
                        {employee.status}
                      </span>
                    </div>
                    <h2 className={styles.name}>{employee.name}</h2>
                    <p className={styles.jobTitle}>{employee.title}</p>
                    <div className={styles.meta}>
                      {locationLine ? (
                        <p className={styles.metaItem}>
                          <MapPin size={14} className={styles.metaIcon} />
                          {locationLine}
                        </p>
                      ) : null}
                      {employee.email ? (
                        <p className={styles.metaItem}>
                          <Mail size={14} className={styles.metaIcon} />
                          {employee.email}
                        </p>
                      ) : null}
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
              );
            })}

            {filteredEmployees.length === 0 && !loading && (
              <div className={styles.empty}>No staff match this view.</div>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {filteredEmployees.map((employee) => {
              const locationLine = [employee.location, employee.department]
                .filter((part) => part.trim())
                .join(" · ");
              return (
                <article key={employee.id} className={styles.listRow}>
                  <div className={styles.listIdentity}>
                    <span className={styles.avatar}>{employee.initials}</span>
                    <div className={styles.listMeta}>
                      <p className={styles.listName}>{employee.name}</p>
                      <p className={styles.listTitle}>{employee.title}</p>
                    </div>
                  </div>
                  <p className={styles.listCell}>{locationLine || "—"}</p>
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
              );
            })}

            {filteredEmployees.length === 0 && !loading && (
              <div className={styles.empty}>No staff match this view.</div>
            )}
          </div>
        )}

        {addOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                className={styles.addBackdrop}
                role="presentation"
                onClick={closeAddModal}
              >
                <div
                  className={styles.addModal}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="add-person-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.addModalHead}>
                    <h2 id="add-person-title" className={styles.addModalTitle}>
                      Add employee record
                    </h2>
                    <button
                      type="button"
                      className={styles.addModalClose}
                      onClick={closeAddModal}
                      aria-label="Close"
                      disabled={saving}
                    >
                      <X size={18} strokeWidth={2} />
                    </button>
                  </div>
                  <p className={styles.addModalCopy}>
                    Create a new record. The employee enters the onboarding queue
                    automatically.
                  </p>
                  <form
                    className={styles.addForm}
                    onSubmit={(event) => void handleAddEmployee(event)}
                  >
                    <div className={styles.addFormFields}>
                      {addEmployeeFields.map((field) => (
                        <label key={field.name} className={styles.addField}>
                          <span>
                            {field.label}
                            {field.required ? (
                              <span className={styles.addRequired}> *</span>
                            ) : null}
                          </span>
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
                    <div className={styles.addModalActions}>
                      <button
                        type="button"
                        className={styles.addCancel}
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
                        <Plus size={16} strokeWidth={2.5} />
                        {saving ? "Creating…" : "Create record"}
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
