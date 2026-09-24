"use client";

import { FormEvent, useEffect, useId, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { accountantExpenseCategories } from "@/data/accountantExpenses";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listStaffEmployees } from "@/lib/api";
import { mapEmployee } from "@/lib/api/mappers";
import styles from "./RecordExpenseModal.module.css";

export type RecordExpenseValues = {
  employeeId: string;
  employeeName: string;
  department: string;
  initials: string;
  avatarColor: string;
  category: string;
  amount: string;
  note: string;
  hasReceipt: boolean;
};

type RecordExpenseModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RecordExpenseValues) => void | Promise<void>;
};

export function RecordExpenseModal({
  open,
  onClose,
  onSubmit,
}: RecordExpenseModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { data: staffPayload } = useAsyncData(
    () => listStaffEmployees().catch(() => []),
    [],
  );
  const employees = useMemo(
    () => (staffPayload ?? []).map(mapEmployee).filter((item) => item.id),
    [staffPayload],
  );

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
    const employeeId = String(form.get("employeeId") ?? "");
    const employee = employees.find((item) => item.id === employeeId);
    const values: RecordExpenseValues = {
      employeeId,
      employeeName: employee?.name ?? "",
      department: employee?.department ?? "",
      initials: employee?.initials ?? "",
      avatarColor: employee?.avatarColor ?? "",
      category: String(form.get("category") ?? ""),
      amount: String(form.get("amount") ?? "").trim(),
      note: String(form.get("note") ?? "").trim(),
      hasReceipt: form.get("hasReceipt") === "on",
    };
    try {
      await Promise.resolve(onSubmit(values));
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
            Record expense
          </h2>
          <p id={descriptionId} className={styles.description}>
            Log an expense on behalf of an employee.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>
              Employee <em>*</em>
            </span>
            <select name="employeeId" defaultValue="" required>
              <option value="" disabled>
                {employees.length ? "Select employee" : "No employees available"}
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                  {employee.department ? ` · ${employee.department}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Category</span>
            <select name="category" defaultValue="Travel" required>
              {accountantExpenseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>
              Amount (₦) <em>*</em>
            </span>
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              defaultValue={0}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Note (optional)</span>
            <textarea name="note" rows={4} placeholder="What was this for?" />
          </label>

          <label className={styles.checkbox}>
            <input name="hasReceipt" type="checkbox" defaultChecked />
            <span>Receipt attached</span>
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              <Plus size={15} />
              Record expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
