"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Camera,
  ChevronRight,
  Cpu,
  Layers,
  Monitor,
  Plus,
  Shirt,
  Users,
} from "lucide-react";
import {
  departmentFilters,
  type Department,
  type DepartmentFilter,
} from "@/data/departments";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { DepartmentDetailDrawer } from "@/components/departments/DepartmentDetailDrawer";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapDepartmentRecord, num, str } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./DepartmentsPage.module.css";

const deptIcons = {
  software: Monitor,
  fashion: Shirt,
  media: Camera,
  hardware: Cpu,
  hr: Briefcase,
  model: Layers,
} as const;

type HodOption = {
  id: string;
  label: string;
};

function hodRecordsFrom(payload: unknown): Record<string, unknown>[] {
  const records = listFrom(payload ?? undefined);
  if (records.length > 0) return records;
  const meta = unwrapRecord(payload).hods;
  return Array.isArray(meta) ? (meta as Record<string, unknown>[]) : [];
}

function mapHodOption(record: Record<string, unknown>): HodOption | null {
  const id = str(
    record.hodId ?? record.userId ?? record.employeeId ?? record.id,
  );
  if (!id) return null;
  const name = str(record.fullName ?? record.name, "Unnamed");
  const email = str(record.email);
  return {
    id,
    label: email ? `${name} (${email})` : name,
  };
}

async function loadHodOptions(): Promise<HodOption[]> {
  const loaders = [
    () => superAdminApi.lookups.hods(),
    () => superAdminApi.departments.hodOptions(),
    () => superAdminApi.lookups.employees(),
    () => superAdminApi.departments.list(),
  ];
  for (const load of loaders) {
    try {
      const options = hodRecordsFrom(await load())
        .map(mapHodOption)
        .filter((option): option is HodOption => Boolean(option));
      if (options.length > 0) return options;
    } catch {
      /* try the next live source */
    }
  }
  return [];
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}

export function DepartmentsPage() {
  const manager = useManagerPortal();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<DepartmentFilter>("All departments");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    if (manager) {
      return {
        departments: await managerApi.listDepartments({ limit: 200 }),
        headcount: null,
        overview: null,
      };
    }
    const departments = await superAdminApi.departments.list();
    const extras = await Promise.allSettled([
      superAdminApi.reports.headcount(),
      superAdminApi.reports.overview(),
    ]);
    return {
      departments,
      headcount:
        extras[0].status === "fulfilled" ? extras[0].value : null,
      overview:
        extras[1].status === "fulfilled" ? extras[1].value : null,
    };
  }, [manager]);
  const { data: hodOptions } = useAsyncData(loadHodOptions, []);

  const departments = useMemo(
    () =>
      listFrom(data?.departments ?? undefined).map((record, index) =>
        mapDepartmentRecord(record, index),
      ),
    [data],
  );

  const departmentStats = useMemo(() => {
    const summed = departments.reduce((sum, dept) => sum + dept.activeCount, 0);
    const report = unwrapRecord(data?.headcount ?? data?.overview);
    const reported = num(
      firstValue(report, [
        "headcount",
        "totalHeadcount",
        "totalEmployees",
        "employees",
        "count",
      ]),
      Number.NaN,
    );
    const totalHeadcount = Number.isFinite(reported) && reported > 0 ? reported : summed;
    const unassigned = departments.filter((dept) => !dept.hasHod).length;
    return [
      {
        id: "departments",
        label: "Departments",
        value: String(departments.length),
      },
      {
        id: "headcount",
        label: "Total Headcount",
        value: totalHeadcount.toLocaleString("en-NG"),
        accent: true,
      },
      {
        id: "unassignedHod",
        label: "HOD Not assigned",
        value: String(unassigned),
      },
    ];
  }, [data, departments]);

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

  const addDepartmentFields = useMemo(
    () => [
      {
        name: "name",
        label: "Department name",
        placeholder: "e.g. Product Management",
        required: true,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea" as const,
        placeholder: "What this department does",
        rows: 3,
      },
      {
        name: "hodId",
        label: "Assign HOD",
        type: "select" as const,
        defaultValue: "",
        options: [
          { label: "Select an employee", value: "" },
          ...(hodOptions ?? []).map((option) => ({
            label: option.label,
            value: option.id,
          })),
        ],
      },
    ],
    [hodOptions],
  );

  function viewDepartment(department: Department) {
    setSelectedDepartment(department);
  }

  async function handleAddDepartment(values: Record<string, string>) {
    await runAction("Add department", async () => {
      const body: Record<string, unknown> = {
        name: values.name.trim(),
      };
      const description = values.description.trim();
      const hodId = values.hodId.trim();
      if (description) body.description = description;
      if (hodId) {
        body.hodId = hodId;
        const hodLabel = (hodOptions ?? []).find((option) => option.id === hodId)
          ?.label;
        if (hodLabel) body.hodName = hodLabel.split(" (")[0];
      }
      await superAdminApi.departments.create(body);
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search"
        status={
          loading ? (
            <p className={styles.statusLine}>Loading departments…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Departments &amp; org structure</p>
          <h1 className={styles.title}>How Afresh is organised</h1>
          <p className={styles.subtitle}>
            Manage departments, assign heads, and monitor team composition across
            the company.
          </p>
        </div>
        {manager ? null : (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add department
          </button>
        )}
      </div>

      <div className={styles.stats}>
        {departmentStats.map((stat) => (
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
                  <span
                    className={
                      department.status === "Active"
                        ? styles.statusActive
                        : styles.statusInactive
                    }
                  >
                    {department.status}
                  </span>
                </div>
                <h2 className={styles.deptName}>{department.name}</h2>
                <div className={styles.managerRow}>
                  <span className={styles.managerAvatar}>
                    {department.hasHod ? department.managerInitials : "—"}
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
              <button
                type="button"
                className={styles.cardFooter}
                onClick={() => viewDepartment(department)}
              >
                View department
                <ChevronRight size={14} />
              </button>
            </article>
          );
        })}

        {filteredDepartments.length === 0 && !loading && (
          <div className={styles.empty}>No departments match this view.</div>
        )}
      </div>

        {manager ? null : (
          <SimpleModal
            open={addOpen}
            title="Add department"
            fields={addDepartmentFields}
            submitLabel="Create department"
            showClose
            appearance="soft"
            onClose={() => setAddOpen(false)}
            onSubmit={handleAddDepartment}
          />
        )}

        {selectedDepartment ? (
          <DepartmentDetailDrawer
            department={selectedDepartment}
            hodOptions={hodOptions ?? []}
            onClose={() => setSelectedDepartment(null)}
            onUpdated={refetch}
          />
        ) : null}
      </div>
  );
}
