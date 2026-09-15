"use client";

import { FormEvent, useEffect, useId } from "react";
import { CalendarPlus, X } from "lucide-react";
import { payrollMonthOptions } from "@/data/accountantPayroll";
import styles from "./CreatePayrollPeriodModal.module.css";

type CreatePayrollPeriodModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { month: string; year: string }) => void | Promise<void>;
  defaultMonth?: string;
  defaultYear?: string;
};

export function CreatePayrollPeriodModal({
  open,
  onClose,
  onSubmit,
  defaultMonth = "September",
  defaultYear = "2026",
}: CreatePayrollPeriodModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const month = String(form.get("month") ?? "");
    const year = String(form.get("year") ?? "").trim();
    try {
      await Promise.resolve(onSubmit({ month, year }));
      onClose();
    } catch {
      /* toast handled by caller */
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            Create payroll period
          </h2>
          <p id={descriptionId} className={styles.description}>
            Opens a new run seeded with the current staff roster and salaries.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Month</span>
              <select name="month" defaultValue={defaultMonth} required>
                {payrollMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Year</span>
              <input
                name="year"
                type="number"
                inputMode="numeric"
                min={2000}
                max={2100}
                defaultValue={defaultYear}
                required
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              <CalendarPlus size={15} />
              Create period
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
