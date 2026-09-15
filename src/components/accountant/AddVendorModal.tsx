"use client";

import { FormEvent, useEffect, useId } from "react";
import { Plus, X } from "lucide-react";
import { accountantVendorCategories } from "@/data/accountantVendors";
import styles from "./AddVendorModal.module.css";

export type AddVendorValues = {
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  bankDetails: string;
};

type AddVendorModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AddVendorValues) => void | Promise<void>;
};

export function AddVendorModal({
  open,
  onClose,
  onSubmit,
}: AddVendorModalProps) {
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
    const values: AddVendorValues = {
      name: String(form.get("name") ?? "").trim(),
      category: String(form.get("category") ?? ""),
      contactName: String(form.get("contactName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      bankDetails: String(form.get("bankDetails") ?? "").trim(),
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
            Add vendor
          </h2>
          <p id={descriptionId} className={styles.description}>
            Register a new vendor or payee.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>
              Vendor name <em>*</em>
            </span>
            <input
              name="name"
              required
              placeholder="e.g. Acme Supplies Ltd"
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span>Category</span>
            <select name="category" defaultValue="Utilities" required>
              {accountantVendorCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Contact name</span>
            <input name="contactName" placeholder="Primary contact" />
          </label>

          <label className={styles.field}>
            <span>Phone</span>
            <input name="phone" placeholder="+234" />
          </label>

          <label className={styles.field}>
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="accounts@vendor.com"
            />
          </label>

          <label className={styles.field}>
            <span>Bank details</span>
            <input name="bankDetails" placeholder="Bank — Account number" />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              <Plus size={15} />
              Add vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
