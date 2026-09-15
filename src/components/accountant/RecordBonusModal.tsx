"use client";

import { FormEvent, useEffect, useId } from "react";
import { Plus, X } from "lucide-react";
import {
  accountantBonusEmployees,
  accountantBonusTypes,
  accountantBonusesPeriod,
} from "@/data/accountantBonuses";
import styles from "./RecordBonusModal.module.css";

export type RecordBonusValues = {
  employeeId: string;
  type: string;
  amount: string;
  note: string;
};

type RecordBonusModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RecordBonusValues) => void | Promise<void>;
};

export function RecordBonusModal({
  open,
  onClose,
  onSubmit,
}: RecordBonusModalProps) {
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
    const values: RecordBonusValues = {
      employeeId: String(form.get("employeeId") ?? ""),
      type: String(form.get("type") ?? ""),
      amount: String(form.get("amount") ?? "").trim(),
      note: String(form.get("note") ?? "").trim(),
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
            Record bonus
          </h2>
          <p id={descriptionId} className={styles.description}>
            Added to the {accountantBonusesPeriod} payroll run.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>
              Employee <em>*</em>
            </span>
            <select
              name="employeeId"
              defaultValue={accountantBonusEmployees[0]?.id}
              required
            >
              {accountantBonusEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {employee.department}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Bonus type</span>
            <select name="type" defaultValue="Performance" required>
              {accountantBonusTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
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
            <textarea
              name="note"
              rows={4}
              placeholder="Reason for the bonus..."
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              <Plus size={15} />
              Record bonus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
