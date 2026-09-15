"use client";

import { FormEvent, useEffect, useId } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import type { AccountantPurchase } from "@/data/accountantPurchases";
import styles from "./AddPurchaseRecommendationModal.module.css";

type AddPurchaseRecommendationModalProps = {
  open: boolean;
  purchase: AccountantPurchase | null;
  onClose: () => void;
  onSubmit: (recommendation: string) => void | Promise<void>;
};

export function AddPurchaseRecommendationModal({
  open,
  purchase,
  onClose,
  onSubmit,
}: AddPurchaseRecommendationModalProps) {
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

  if (!open || !purchase) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const recommendation = String(form.get("recommendation") ?? "").trim();
    if (!recommendation) return;
    try {
      await Promise.resolve(onSubmit(recommendation));
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
            Add financial recommendation
          </h2>
          <p id={descriptionId} className={styles.description}>
            {purchase.ref} · {purchase.amount} — forwarded to Admin for final
            approval.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>
              Recommendation <em>*</em>
            </span>
            <textarea
              name="recommendation"
              rows={5}
              required
              placeholder="e.g. Within Q3 budget. Vendor pricing verified. Recommend approval."
            />
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              <MessageSquarePlus size={15} />
              Recommend to Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
