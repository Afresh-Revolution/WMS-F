"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./ConfirmClockInModal.module.css";

type ConfirmClockInModalProps = {
  open: boolean;
  name: string;
  department: string;
  dateLabel: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

function formatCurrentTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
}

export function ConfirmClockInModal({
  open,
  name,
  department,
  dateLabel,
  busy = false,
  onClose,
  onConfirm,
}: ConfirmClockInModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [currentTime, setCurrentTime] = useState(formatCurrentTime);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCurrentTime(formatCurrentTime());
    const timer = window.setInterval(() => {
      setCurrentTime(formatCurrentTime());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, open, onClose]);

  if (!open || !mounted) return null;

  async function handleConfirm() {
    if (busy) return;
    try {
      await Promise.resolve(onConfirm());
      onClose();
    } catch {
      /* toast handled by caller */
    }
  }

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={busy ? undefined : onClose}
      role="presentation"
    >
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
          disabled={busy}
        >
          <X size={18} />
        </button>

        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            Confirm Clock In
          </h2>
          <p id={descriptionId} className={styles.description}>
            Please confirm the details below.
          </p>
        </div>

        <dl className={styles.details}>
          <div className={styles.row}>
            <dt>Name</dt>
            <dd>{name}</dd>
          </div>
          <div className={styles.row}>
            <dt>Department</dt>
            <dd>{department}</dd>
          </div>
          <div className={styles.row}>
            <dt>Date</dt>
            <dd className={styles.dateValue}>{dateLabel}</dd>
          </div>
          <div className={styles.row}>
            <dt>Current time</dt>
            <dd>{currentTime}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submit}
            onClick={() => void handleConfirm()}
            disabled={busy}
          >
            {busy ? "Clocking in…" : "Clock In"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
