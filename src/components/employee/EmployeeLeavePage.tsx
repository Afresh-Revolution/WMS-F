"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeLeave, employeeProfile } from "@/data/employeeHome";
import { leaveApi } from "@/lib/api";
import styles from "./EmployeeLeavePage.module.css";

type LeaveFilter = "All" | "Pending" | "Approved" | "Rejected";

const filters: LeaveFilter[] = ["All", "Pending", "Approved", "Rejected"];

function statusClass(status: string) {
  if (status === "Approved") return styles.approved;
  if (status === "Rejected") return styles.rejected;
  return styles.pending;
}

export function EmployeeLeavePage({
  initialFilter = "All",
}: {
  initialFilter?: LeaveFilter;
}) {
  const [filter, setFilter] = useState<LeaveFilter>(initialFilter);
  const [applyOpen, setApplyOpen] = useState(false);
  const { runAction, showToast } = usePageActions();

  useEffect(() => {
    if (!applyOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setApplyOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [applyOpen]);

  const requests = useMemo(
    () =>
      employeeLeave.requests.filter(
        (request) => filter === "All" || request.status === filter,
      ),
    [filter],
  );

  async function submitLeave(values: Record<string, string>) {
    await runAction(
      "Leave application",
      async () => {
        await leaveApi.create(values);
      },
      "Leave request submitted",
    );
  }

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await submitLeave({
        type: String(form.get("type") ?? ""),
        startDate: String(form.get("startDate") ?? ""),
        endDate: String(form.get("endDate") ?? ""),
        reason: String(form.get("reason") ?? ""),
      });
      setApplyOpen(false);
    } catch {
      // runAction displays the API error.
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <p>Wednesday, August 12</p>
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {employeeProfile.initials}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <div>
          <p>My leave</p>
          <h1>Leave &amp; time off</h1>
          <span>Apply for leave, track your requests and download decision letters.</span>
        </div>
        <button
          type="button"
          className={styles.applyButton}
          onClick={() => setApplyOpen(true)}
        >
          <Plus size={15} />
          Apply for leave
        </button>
      </div>

      <section className={styles.balances} aria-label="Leave balances">
        {employeeLeave.balances.map((balance, index) => (
          <article
            key={balance.label}
            className={`${styles.balanceCard} ${
              index === 0 ? styles.balancePrimary : ""
            }`}
          >
            <p>{balance.label}</p>
            <div>
              <strong>{balance.value}</strong>
              <span>{balance.hint}</span>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.filters} aria-label="Filter leave requests">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setFilter(item)}
            className={filter === item ? styles.filterActive : ""}
          >
            {item}
          </button>
        ))}
      </div>

      <section className={styles.requestList}>
        {requests.map((request) => (
          <article key={request.id} className={styles.requestCard}>
            <div className={styles.requestMain}>
              <div className={styles.requestTitle}>
                <span>{request.id}</span>
                <h2>
                  {request.type} · {request.days} {request.days === 1 ? "day" : "days"}
                </h2>
                <span className={`${styles.status} ${statusClass(request.status)}`}>
                  {request.status}
                </span>
              </div>
              <p>
                {request.dates} · {request.reason}
              </p>
              {request.note ? <small>{request.note}</small> : null}
            </div>
            {request.status !== "Pending" ? (
              <button
                type="button"
                className={styles.letterButton}
                onClick={() => showToast(`${request.id} decision letter ready`, "success")}
              >
                <Download size={14} />
                Decision letter
              </button>
            ) : null}
          </article>
        ))}
        {requests.length === 0 ? (
          <p className={styles.empty}>No {filter.toLowerCase()} leave requests.</p>
        ) : null}
      </section>

      {applyOpen ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setApplyOpen(false)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-leave-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              aria-label="Close"
              onClick={() => setApplyOpen(false)}
            >
              <X size={17} />
            </button>
            <h2 id="apply-leave-title">Apply for leave</h2>
            <p className={styles.modalDescription}>
              Your request goes to your HOD / HR for approval.
            </p>
            <form onSubmit={handleApply}>
              <label className={styles.modalField}>
                <span>Leave type</span>
                <select name="type" defaultValue="annual" required>
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                </select>
              </label>
              <div className={styles.dateFields}>
                <label className={styles.modalField}>
                  <span>From</span>
                  <input name="startDate" type="date" required />
                </label>
                <label className={styles.modalField}>
                  <span>To</span>
                  <input name="endDate" type="date" required />
                </label>
              </div>
              <p className={styles.duration}>Duration: <strong>3 days</strong></p>
              <label className={styles.modalField}>
                <span>
                  Reason <b>*</b>
                </span>
                <textarea name="reason" rows={4} required />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={() => setApplyOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmit}>
                  <Plus size={15} />
                  Submit request
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
