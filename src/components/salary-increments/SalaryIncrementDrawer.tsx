"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, TrendingUp, X } from "lucide-react";
import type { SalaryIncrement } from "@/data/salaryIncrements";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { mapSalaryIncrement } from "@/lib/api/mappers";
import styles from "./SalaryIncrementDrawer.module.css";

const statusLabels: Record<SalaryIncrement["status"], string> = {
  "Under admin review": "Under Admin Review",
  Draft: "Draft",
  Approved: "Approved",
};

function parseAmount(value: string) {
  const amount = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatNaira(value: string) {
  if (!value.trim()) return "—";
  if (/₦/.test(value)) return value.replace(/₦\s*/, "₦ ");
  const amount = parseAmount(value);
  if (!amount && value !== "0") return value;
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

function formatEffectiveDate(value: string) {
  const text = value.trim();
  if (!text) return "—";
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

function formatPercent(increment: SalaryIncrement) {
  const labeled = increment.incrementPercent.replace(/\s/g, "");
  if (labeled && labeled !== "+0%") {
    return labeled.startsWith("+") || labeled.startsWith("-")
      ? labeled
      : `+${labeled}`;
  }
  const current = parseAmount(increment.currentSalary);
  const proposed = parseAmount(increment.proposedSalary);
  if (!current) return "—";
  const percent = ((proposed - current) / current) * 100;
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

async function loadIncrement(id: string) {
  try {
    return await superAdminApi.salaryIncrements.get(id);
  } catch {
    return await superAdminApi.hr.salaryAdjustments.get(id);
  }
}

async function tryActions(attempts: Array<() => Promise<unknown>>) {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Request failed");
}

type SalaryIncrementDrawerProps = {
  increment: SalaryIncrement;
  onClose: () => void;
  onUpdated: () => void;
};

export function SalaryIncrementDrawer({
  increment,
  onClose,
  onUpdated,
}: SalaryIncrementDrawerProps) {
  const { runAction } = usePageActions();
  const { data, loading, error } = useAsyncData(
    () => loadIncrement(increment.id),
    [increment.id],
  );

  const detail = useMemo(() => {
    if (!data) return increment;
    const mapped = mapSalaryIncrement(data as Record<string, unknown>);
    return {
      ...increment,
      ...mapped,
      name: mapped.name || increment.name,
      department: mapped.department || increment.department,
      currentSalary: mapped.currentSalary || increment.currentSalary,
      proposedSalary: mapped.proposedSalary || increment.proposedSalary,
      justification: mapped.justification || increment.justification,
      effectiveDate: mapped.effectiveDate || increment.effectiveDate,
      initials: mapped.initials || increment.initials,
    };
  }, [data, increment]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const canDecide = detail.status !== "Approved";
  const statusClass =
    detail.status === "Approved"
      ? styles.statusApproved
      : detail.status === "Draft"
        ? styles.statusDraft
        : styles.statusReview;

  async function handleApprove() {
    await runAction("Approve increment", async () => {
      await tryActions([
        () => superAdminApi.hr.salaryAdjustments.approve(detail.id),
        () => superAdminApi.salaryIncrements.action(detail.id, "approve"),
        () =>
          superAdminApi.salaryIncrements.patch(detail.id, {
            status: "approved",
          }),
      ]);
      onUpdated();
      onClose();
    });
  }

  async function handleReturn() {
    await runAction("Return for revision", async () => {
      await tryActions([
        () => superAdminApi.hr.salaryAdjustments.return(detail.id),
        () => superAdminApi.hr.salaryAdjustments.reject(detail.id),
        () => superAdminApi.salaryIncrements.action(detail.id, "return"),
        () => superAdminApi.salaryIncrements.action(detail.id, "reject"),
        () =>
          superAdminApi.salaryIncrements.patch(detail.id, {
            status: "draft",
          }),
      ]);
      onUpdated();
      onClose();
    });
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="salary-increment-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Salary increment</p>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close salary increment"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {loading ? <p className={styles.statusLine}>Loading increment…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.identity}>
          <span
            className={styles.avatar}
            style={{ background: detail.avatarColor }}
          >
            {detail.initials}
          </span>
          <div>
            <h2 id="salary-increment-title" className={styles.name}>
              {detail.name}
            </h2>
            <p className={styles.department}>{detail.department || "—"}</p>
          </div>
        </div>
        <span className={statusClass}>{statusLabels[detail.status]}</span>

        <div className={styles.salaryRow}>
          <article className={styles.salaryCard}>
            <p className={styles.salaryLabel}>Current salary</p>
            <p className={styles.salaryValue}>
              {formatNaira(detail.currentSalary)}
            </p>
          </article>
          <article className={styles.salaryCard}>
            <p className={styles.salaryLabel}>
              <TrendingUp size={12} strokeWidth={2.25} />
              Proposed salary
            </p>
            <p className={styles.salaryValue}>
              {formatNaira(detail.proposedSalary)}
            </p>
          </article>
        </div>

        <article className={styles.incrementCard}>
          <p className={styles.incrementLabel}>Increment</p>
          <p className={styles.incrementValue}>{formatPercent(detail)}</p>
        </article>

        <section className={styles.meta}>
          <p className={styles.metaLabel}>Justification</p>
          <p className={styles.metaBody}>
            {detail.justification?.trim() || "—"}
          </p>
          <p className={styles.metaLabel}>Effective date</p>
          <p className={styles.metaBody}>
            {formatEffectiveDate(detail.effectiveDate)}
          </p>
        </section>

        {canDecide ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => void handleApprove()}
            >
              <Check size={16} strokeWidth={2.5} />
              Approve increment
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => void handleReturn()}
            >
              Return for revision
            </button>
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
