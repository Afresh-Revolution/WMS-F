"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Department } from "@/data/departments";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { asRecord, superAdminApi, unwrapRecord } from "@/lib/api";
import { num, str } from "@/lib/api/mappers";
import styles from "./DepartmentDetailDrawer.module.css";

type HodOption = {
  id: string;
  label: string;
};

type DepartmentDetail = {
  name: string;
  hodName: string;
  totalStaff: number;
  activeCount: number;
  targetPercent: number;
  status: string;
};

function formatCount(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "—";
}

function detailFromDepartment(department: Department): DepartmentDetail {
  return {
    name: department.name,
    hodName: department.managerName,
    totalStaff: department.activeCount,
    activeCount: department.activeCount,
    targetPercent: department.targetPercent,
    status: department.status,
  };
}

function mergeDetail(
  department: Department,
  payload: unknown,
): DepartmentDetail {
  const record = unwrapRecord(payload);
  const dataRecord = asRecord(record.data);
  const nested = Object.keys(dataRecord).length > 0 ? dataRecord : record;
  const hod = asRecord(nested.hod);
  const head = asRecord(nested.head);
  const statsRecord = asRecord(nested.stats);
  const stats = Object.keys(statsRecord).length > 0 ? statsRecord : nested;
  const hodName = str(
    hod.fullName ??
      hod.name ??
      head.fullName ??
      head.name ??
      nested.hodName ??
      nested.head ??
      nested.managerName,
    department.managerName,
  );
  const activeCount = num(
    stats.activeCount ?? stats.active ?? nested.activeCount ?? nested.active,
    department.activeCount,
  );
  const totalStaff = num(
    stats.totalStaff ??
      nested.totalStaff ??
      stats.headcount ??
      nested.headcount ??
      stats.staffCount ??
      nested.staffCount ??
      nested.totalEmployees ??
      nested.employeeCount,
    activeCount,
  );
  const statusRaw = str(nested.status ?? stats.status, department.status);
  return {
    name: str(nested.name, department.name),
    hodName: hodName.trim() || "—",
    totalStaff,
    activeCount,
    targetPercent: num(
      stats.targetPercent ??
        stats.targetAttainment ??
        nested.targetPercent ??
        nested.target ??
        nested.performance,
      department.targetPercent,
    ),
    status: statusRaw.toLowerCase().includes("inactive") ? "Inactive" : "Active",
  };
}

async function loadDepartmentDetail(id: string) {
  try {
    return await superAdminApi.departments.overview(id);
  } catch {
    return await superAdminApi.departments.get(id);
  }
}

type DepartmentDetailDrawerProps = {
  department: Department;
  hodOptions: HodOption[];
  onClose: () => void;
  onUpdated: () => void;
};

export function DepartmentDetailDrawer({
  department,
  hodOptions,
  onClose,
  onUpdated,
}: DepartmentDetailDrawerProps) {
  const router = useRouter();
  const { runAction } = usePageActions();
  const [editHodOpen, setEditHodOpen] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(
    () => loadDepartmentDetail(department.id),
    [department.id],
  );

  const detail = useMemo(
    () => (data ? mergeDetail(department, data) : detailFromDepartment(department)),
    [data, department],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !editHodOpen) onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editHodOpen, onClose]);

  const hodFields = useMemo(
    () => [
      {
        name: "hodId",
        label: "Head of department",
        type: "select" as const,
        defaultValue: "",
        options: [
          { label: "No HOD", value: "" },
          ...hodOptions.map((option) => ({
            label: option.label,
            value: option.id,
          })),
        ],
      },
    ],
    [hodOptions],
  );

  async function handleEditHod(values: Record<string, string>) {
    await runAction("Update HOD", async () => {
      const hodId = values.hodId.trim();
      if (!hodId) {
        await superAdminApi.departments.removeHod(department.id);
      } else {
        await superAdminApi.departments.setHod(department.id, {
          hodId,
          employeeId: hodId,
        });
      }
      refetch();
      onUpdated();
    });
  }

  return createPortal(
    <>
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Department detail</p>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close department detail"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {loading ? <p className={styles.statusLine}>Loading department…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}

        <h2 id="department-detail-title" className={styles.name}>
          {detail.name}
        </h2>
        <p className={styles.hod}>HOD: {detail.hodName}</p>

        <div className={styles.stats}>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Total staff</p>
            <p className={styles.statValue}>{formatCount(detail.totalStaff)}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Active</p>
            <p className={styles.statValue}>{formatCount(detail.activeCount)}</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Target attainment</p>
            <p className={styles.statValue}>{detail.targetPercent}%</p>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statLabel}>Status</p>
            <p className={styles.statValue}>{detail.status}</p>
          </article>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              onClose();
              router.push(
                `/employees?department=${encodeURIComponent(detail.name)}`,
              );
            }}
          >
            View staff
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setEditHodOpen(true)}
          >
            Edit HOD
          </button>
        </div>
      </aside>
    </div>
    <SimpleModal
      open={editHodOpen}
      title="Edit HOD"
      description={`Choose a head of department for ${detail.name}.`}
      fields={hodFields}
      submitLabel="Save HOD"
      onClose={() => setEditHodOpen(false)}
      onSubmit={handleEditHod}
    />
    </>,
    document.body,
  );
}
