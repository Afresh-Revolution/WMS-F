"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Download, Plus, Search, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  applyForLeave,
  employeeBalanceCards,
  getEmployeeLeave,
  leaveDayCount,
  leaveDecisionLetter,
  listLeaveBalances,
  listLeaveTypes,
  listMyLeave,
  remainingDaysForType,
  withdrawLeaveRequest,
} from "@/lib/api";
import { listFrom, mapEmployeeLeaveRequest } from "@/lib/api/mappers";
import styles from "./EmployeeLeavePage.module.css";

type LeaveFilter = "All" | "Pending" | "Approved" | "Rejected";

const filters: LeaveFilter[] = ["All", "Pending", "Approved", "Rejected"];

const statusQuery: Record<LeaveFilter, string | undefined> = {
  All: undefined,
  Pending: "PENDING",
  Approved: "APPROVED",
  Rejected: "REJECTED",
};

function statusClass(status: string) {
  if (status === "Approved") return styles.approved;
  if (status === "Rejected" || status === "Cancelled") return styles.rejected;
  return styles.pending;
}

export function EmployeeLeavePage({
  initialFilter = "All",
}: {
  initialFilter?: LeaveFilter;
}) {
  const [filter, setFilter] = useState<LeaveFilter>(initialFilter);
  const [applyOpen, setApplyOpen] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [durationType, setDurationType] = useState<"FULL_DAY" | "HALF_DAY">(
    "FULL_DAY",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();

  const status = statusQuery[filter];
  const { data, error, refetch } = useAsyncData(
    () => listMyLeave(status),
    [status],
  );
  const { data: typeData, error: typesError } = useAsyncData(
    () => listLeaveTypes(),
    [],
  );
  const { data: balanceData, refetch: refetchBalances } = useAsyncData(
    () => listLeaveBalances().catch(() => null),
    [],
  );

  const leaveTypes = useMemo(
    () => (Array.isArray(typeData) ? typeData.filter((item) => item.id) : []),
    [typeData],
  );
  const selectedType =
    leaveTypes.find((item) => item.id === leaveTypeId) ?? leaveTypes[0];
  const estimatedDays =
    durationType === "HALF_DAY" ? 0.5 : leaveDayCount(startDate, endDate);

  const requests = useMemo(
    () =>
      listFrom(data ?? undefined).map((record) => mapEmployeeLeaveRequest(record)),
    [data],
  );

  const balances = useMemo(
    () => employeeBalanceCards(balanceData, leaveTypes),
    [balanceData, leaveTypes],
  );

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (!leaveTypeId && leaveTypes[0]?.id) setLeaveTypeId(leaveTypes[0].id);
  }, [leaveTypeId, leaveTypes]);

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

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const typeId =
      leaveTypeId || selectedType?.id || String(form.get("type") ?? "");
    const note = String(form.get("note") ?? form.get("reason") ?? "").trim();
    const from = startDate || String(form.get("startDate") ?? "");
    const to =
      durationType === "HALF_DAY"
        ? from
        : endDate || String(form.get("endDate") ?? from);
    const days =
      durationType === "HALF_DAY" ? 0.5 : leaveDayCount(from, to);
    const remaining = remainingDaysForType(balanceData, selectedType);
    const fileUrl = String(form.get("fileUrl") ?? "").trim();
    const fileName = String(form.get("fileName") ?? "supporting-document").trim();
    const attachments =
      selectedType?.requiresDocument && fileUrl
        ? [
            {
              name: fileName,
              fileUrl,
              type: fileUrl.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "application/octet-stream",
            },
          ]
        : undefined;
    try {
      await runAction(
        "Leave application",
        async () => {
          if (days > remaining) {
            throw new Error(
              `This request is ${days} working days, but only ${remaining} remain for ${selectedType?.name ?? "this type"}.`,
            );
          }
          await applyForLeave({
            leaveTypeId: typeId,
            startDate: from,
            endDate: to,
            durationType,
            note,
            attachments,
          });
          await Promise.all([refetch(), refetchBalances()]);
        },
        "Leave request submitted",
      );
      setApplyOpen(false);
      setStartDate("");
      setEndDate("");
      setDurationType("FULL_DAY");
    } catch {
      // runAction displays the API error.
    }
  }

  async function withdrawRequest(id: string) {
    try {
      await runAction(
        "Withdraw leave",
        async () => {
          await withdrawLeaveRequest(id, "Plans changed");
          await Promise.all([refetch(), refetchBalances()]);
        },
        "Leave request withdrawn",
      );
    } catch {
      /* toast already shown */
    }
  }

  async function openDecisionLetter(id: string) {
    try {
      await runAction("Decision letter", async () => {
        const payload = await getEmployeeLeave(id);
        setLetter(leaveDecisionLetter(payload));
      });
    } catch {
      /* toast already shown */
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <div>
          <p>My leave</p>
          <h1>Leave &amp; time off</h1>
          <span>Apply for leave, track your requests and download decision letters.</span>
          {error &&
          !/not linked to an employee|employee profile is still being set up/i.test(
            error,
          ) ? (
            <p className={styles.empty} role="alert">
              {error}
            </p>
          ) : null}
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
        {balances.map((balance, index) => (
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
                <span>{request.code}</span>
                <h2>
                  {request.type} · {request.days}{" "}
                  {request.days === 1 ? "day" : "days"}
                </h2>
                <span className={`${styles.status} ${statusClass(request.status)}`}>
                  {request.status}
                </span>
              </div>
              <p>
                {request.dates}
                {request.note ? ` · ${request.note}` : ""}
              </p>
            </div>
            {request.status === "Approved" ? (
              <button
                type="button"
                className={styles.letterButton}
                onClick={() => void openDecisionLetter(request.id)}
              >
                <Download size={14} />
                Decision letter
              </button>
            ) : null}
            {request.status === "Pending" ? (
              <button
                type="button"
                className={styles.letterButton}
                onClick={() => void withdrawRequest(request.id)}
              >
                Withdraw
              </button>
            ) : null}
          </article>
        ))}
        {requests.length === 0 ? (
          <p className={styles.empty}>No {filter.toLowerCase()} leave requests.</p>
        ) : null}
      </section>

      {applyOpen && typeof document !== "undefined"
        ? createPortal(
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
                  Your request goes to your manager, then HR, for approval.
                </p>
                {typesError ? (
                  <p className={styles.empty} role="alert">
                    {typesError}
                  </p>
                ) : null}
                <form onSubmit={handleApply}>
                  <div className={styles.modalFields}>
                    <label className={styles.modalField}>
                      <span>Leave type</span>
                      <select
                        name="type"
                        value={selectedType?.id ?? ""}
                        onChange={(event) => setLeaveTypeId(event.target.value)}
                        required
                      >
                        {leaveTypes.length === 0 ? (
                          <option value="" disabled>
                            No leave types loaded
                          </option>
                        ) : (
                          leaveTypes.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <label className={styles.modalField}>
                      <span>Duration</span>
                      <select
                        value={durationType}
                        onChange={(event) => {
                          const next = event.target.value as
                            | "FULL_DAY"
                            | "HALF_DAY";
                          setDurationType(next);
                          if (next === "HALF_DAY" && startDate) {
                            setEndDate(startDate);
                          }
                        }}
                      >
                        <option value="FULL_DAY">Full day</option>
                        <option value="HALF_DAY">Half day</option>
                      </select>
                    </label>
                    <div className={styles.dateFields}>
                      <label className={styles.modalField}>
                        <span>From</span>
                        <input
                          name="startDate"
                          type="date"
                          required
                          value={startDate}
                          onChange={(event) => {
                            const value = event.target.value;
                            setStartDate(value);
                            if (durationType === "HALF_DAY") setEndDate(value);
                          }}
                        />
                      </label>
                      <label className={styles.modalField}>
                        <span>To</span>
                        <input
                          name="endDate"
                          type="date"
                          required
                          value={
                            durationType === "HALF_DAY" ? startDate : endDate
                          }
                          onChange={(event) => setEndDate(event.target.value)}
                          disabled={durationType === "HALF_DAY"}
                        />
                      </label>
                    </div>
                    <p className={styles.duration}>
                      Estimated working days:{" "}
                      <strong>
                        {estimatedDays > 0
                          ? `${estimatedDays} ${estimatedDays === 1 ? "day" : "days"}`
                          : "—"}
                      </strong>
                      <span>
                        {" "}
                        Weekends are not counted. The server confirms the
                        final duration.
                      </span>
                    </p>
                    {selectedType?.requiresDocument ? (
                      <>
                        <label className={styles.modalField}>
                          <span>
                            Document name <b>*</b>
                          </span>
                          <input
                            name="fileName"
                            defaultValue="doctors-note.pdf"
                            required
                          />
                        </label>
                        <label className={styles.modalField}>
                          <span>
                            Document URL <b>*</b>
                          </span>
                          <input
                            name="fileUrl"
                            type="url"
                            placeholder="https://..."
                            required
                          />
                        </label>
                      </>
                    ) : null}
                    <label className={styles.modalField}>
                      <span>
                        Note <b>*</b>
                      </span>
                      <textarea name="note" rows={4} required />
                    </label>
                  </div>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.modalCancel}
                      onClick={() => setApplyOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.modalSubmit}
                      disabled={leaveTypes.length === 0}
                    >
                      <Plus size={15} />
                      Submit request
                    </button>
                  </div>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}

      {letter && typeof document !== "undefined"
        ? createPortal(
            <div
              className={styles.modalBackdrop}
              role="presentation"
              onClick={() => setLetter(null)}
            >
              <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="leave-letter-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.modalClose}
                  aria-label="Close"
                  onClick={() => setLetter(null)}
                >
                  <X size={17} />
                </button>
                <h2 id="leave-letter-title">Decision letter</h2>
                <pre className={styles.letterBody}>{letter}</pre>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancel}
                    onClick={() => setLetter(null)}
                  >
                    Close
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
