"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { DisciplineCase } from "@/data/discipline";
import { usePageActions } from "@/hooks/usePageActions";
import { disciplineApi } from "@/lib/api";
import styles from "./DisciplineRecordModal.module.css";

const tagClass = {
  warning: styles.tagWarning,
  unacknowledged: styles.tagUnacknowledged,
  active: styles.tagActive,
  closed: styles.tagClosed,
  acknowledged: styles.tagAcknowledged,
  strike: styles.tagStrike,
} as const;

type DisciplineRecordModalProps = {
  record: DisciplineCase;
  onClose: () => void;
  onUpdated?: () => void;
};

export function DisciplineRecordModal({
  record,
  onClose,
  onUpdated,
}: DisciplineRecordModalProps) {
  const { runAction } = usePageActions();
  const isActive = record.status === "Active";

  function acknowledgeRecord() {
    void runAction(`Acknowledge case ${record.ref}`, async () => {
      await disciplineApi.action(record.id, "acknowledge");
      onUpdated?.();
      onClose();
    });
  }

  function closeCase() {
    void runAction(`Close case ${record.ref}`, async () => {
      await disciplineApi.action(record.id, "close");
      onUpdated?.();
      onClose();
    });
  }

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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discipline-record-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="discipline-record-title" className={styles.title}>
            Disciplinary Record
          </h2>
          <button
            type="button"
            aria-label="Close"
            className={styles.closeButton}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.profile}>
          <div className={styles.avatar}>{record.initials}</div>
          <h3 className={styles.name}>{record.name}</h3>
          <p className={styles.role}>{record.role}</p>
          <div className={styles.tags}>
            {record.tags.map((tag) => (
              <span
                key={`${record.id}-${tag.label}`}
                className={`${styles.tag} ${tagClass[tag.tone]}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Ref</span>
            <span className={styles.detailValue}>{record.ref}</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Date issued</span>
            <span className={styles.detailValue}>{record.date}</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Issued by</span>
            <span className={styles.detailValue}>{record.issuedBy}</span>
          </div>
        </div>

        <div className={styles.descriptionBlock}>
          <p className={styles.descriptionLabel}>Description</p>
          <p className={styles.descriptionText}>{record.description}</p>
        </div>

        {isActive && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.acknowledgeButton}
              onClick={acknowledgeRecord}
            >
              Mark as acknowledged
            </button>
            <button
              type="button"
              className={styles.closeCaseButton}
              onClick={closeCase}
            >
              Close case
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
