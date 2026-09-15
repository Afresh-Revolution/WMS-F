"use client";

import { FormEvent, useEffect, useId } from "react";
import { Plus, X } from "lucide-react";
import { accountantBillCategories } from "@/data/accountantBills";
import styles from "./CreateBillModal.module.css";

export type CreateBillValues = {
  vendor: string;
  category: string;
  amount: string;
  dueDate: string;
  invoice: string;
};

type CreateBillModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBillValues) => void | Promise<void>;
};

export function CreateBillModal({
  open,
  onClose,
  onSubmit,
}: CreateBillModalProps) {
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
    const values: CreateBillValues = {
      vendor: String(form.get("vendor") ?? "").trim(),
      category: String(form.get("category") ?? ""),
      amount: String(form.get("amount") ?? "").trim(),
      dueDate: String(form.get("dueDate") ?? ""),
      invoice: String(form.get("invoice") ?? "").trim(),
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
            Create bill
          </h2>
          <p id={descriptionId} className={styles.description}>
            Record a new vendor bill or invoice for payment.
          </p>
        </div>

        <form key="create-bill" className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>
              Vendor <em>*</em>
            </span>
            <input
              name="vendor"
              required
              placeholder="e.g. ARM Pensions"
              autoFocus
            />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Category</span>
              <select name="category" defaultValue="Utilities" required>
                {accountantBillCategories.map((category) => (
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
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>
                Due date <em>*</em>
              </span>
              <input name="dueDate" type="date" required />
            </label>
            <label className={styles.field}>
              <span>Invoice ref (optional)</span>
              <input name="invoice" placeholder="INV-" />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              <Plus size={15} />
              Create bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
