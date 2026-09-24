"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Check, TrendingUp, X } from "lucide-react";
import type { Promotion, PromotionStatus } from "@/data/promotions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi } from "@/lib/api";
import { mapPromotion } from "@/lib/api/mappers";
import styles from "./PromotionRecommendationDrawer.module.css";

const statusLabels: Record<PromotionStatus, string> = {
  "Under admin review": "Under Admin Review",
  Draft: "Draft",
  Approved: "Approved",
  Rejected: "Rejected",
};

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

function formatSubmittedBy(promotion: Promotion) {
  const role = promotion.submittedByRole?.trim();
  const name = promotion.submittedBy?.trim();
  if (role && name) return `${role} · ${name}`;
  return name || role || "—";
}

async function loadPromotion(id: string, manager: boolean) {
  try {
    if (manager) return await managerApi.getPromotion(id);
    try {
      return await superAdminApi.promotions.get(id);
    } catch {
      return await superAdminApi.hr.promotions.get(id);
    }
  } catch {
    return null;
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
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

type PromotionRecommendationDrawerProps = {
  promotion: Promotion;
  manager?: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export function PromotionRecommendationDrawer({
  promotion,
  manager = false,
  onClose,
  onUpdated,
}: PromotionRecommendationDrawerProps) {
  const { runAction } = usePageActions();
  const { data, loading, error } = useAsyncData(
    () => loadPromotion(promotion.id, manager),
    [promotion.id, manager],
  );

  const detail = useMemo(() => {
    if (!data) return promotion;
    const mapped = mapPromotion(data as Record<string, unknown>);
    return {
      ...promotion,
      ...mapped,
      name: mapped.name || promotion.name,
      department: mapped.department || promotion.department,
      currentRole: mapped.currentRole || promotion.currentRole,
      proposedRole: mapped.proposedRole || promotion.proposedRole,
      reason: mapped.reason || promotion.reason,
      submittedBy: mapped.submittedBy || promotion.submittedBy,
      submittedByRole: mapped.submittedByRole || promotion.submittedByRole,
      effectiveDate: mapped.effectiveDate || promotion.effectiveDate,
      initials: mapped.initials || promotion.initials,
    };
  }, [data, promotion]);

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

  const canDecide = detail.status === "Under admin review";
  const statusClass =
    detail.status === "Approved"
      ? styles.statusApproved
      : detail.status === "Rejected"
        ? styles.statusRejected
        : detail.status === "Draft"
          ? styles.statusDraft
          : styles.statusReview;

  async function handleApprove() {
    await runAction("Approve promotion", async () => {
      await tryActions(
        manager
          ? [() => managerApi.approvePromotion(detail.id)]
          : [
              () => superAdminApi.hr.promotions.approve(detail.id),
              () => superAdminApi.promotions.action(detail.id, "approve"),
              () =>
                superAdminApi.promotions.patch(detail.id, {
                  status: "approved",
                }),
            ],
      );
      onUpdated();
      onClose();
    });
  }

  async function handleReturn() {
    await runAction("Return for correction", async () => {
      await tryActions(
        manager
          ? [() => managerApi.returnPromotion(detail.id)]
          : [
              () => superAdminApi.hr.promotions.return(detail.id),
              () => superAdminApi.promotions.action(detail.id, "return"),
              () =>
                superAdminApi.promotions.patch(detail.id, {
                  status: "draft",
                }),
            ],
      );
      onUpdated();
      onClose();
    });
  }

  async function handleReject() {
    await runAction("Reject promotion", async () => {
      await tryActions(
        manager
          ? [() => managerApi.rejectPromotion(detail.id)]
          : [
              () => superAdminApi.hr.promotions.reject(detail.id),
              () => superAdminApi.promotions.action(detail.id, "reject"),
              () =>
                superAdminApi.promotions.patch(detail.id, {
                  status: "rejected",
                }),
            ],
      );
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
        aria-labelledby="promotion-recommendation-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Promotion recommendation</p>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close promotion recommendation"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {loading ? (
          <p className={styles.statusLine}>Loading recommendation…</p>
        ) : null}
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
            <h2 id="promotion-recommendation-title" className={styles.name}>
              {detail.name}
            </h2>
            <p className={styles.department}>{detail.department || "—"}</p>
          </div>
        </div>
        <span className={statusClass}>{statusLabels[detail.status]}</span>

        <div className={styles.positionRow}>
          <article className={styles.positionCard}>
            <p className={styles.positionLabel}>Current position</p>
            <p className={styles.positionValue}>
              {detail.currentRole.trim() || "—"}
            </p>
          </article>
          <article className={styles.positionCard}>
            <p className={styles.positionLabel}>
              <TrendingUp size={12} strokeWidth={2.25} />
              Proposed position
            </p>
            <p className={styles.positionValue}>
              {detail.proposedRole.trim() || "—"}
            </p>
          </article>
        </div>

        <section className={styles.meta}>
          <p className={styles.metaLabel}>Reason for recommendation</p>
          <p className={styles.metaBody}>{detail.reason?.trim() || "—"}</p>
          <p className={styles.metaLabel}>Effective date</p>
          <p className={styles.metaBody}>
            {formatEffectiveDate(detail.effectiveDate)}
          </p>
          <p className={styles.metaLabel}>Submitted by</p>
          <p className={styles.metaBody}>{formatSubmittedBy(detail)}</p>
        </section>

        {canDecide ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => void handleApprove()}
            >
              <Check size={16} strokeWidth={2.5} />
              Approve promotion
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => void handleReturn()}
            >
              Return for correction
            </button>
            <button
              type="button"
              className={styles.reject}
              onClick={() => void handleReject()}
            >
              Reject
            </button>
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
