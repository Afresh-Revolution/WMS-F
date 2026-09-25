"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Download, Plus, Search, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  applyForLeave,
  displayLeaveTypeName,
  employeeBalanceCards,
  getEmployeeLeave,
  leaveDayCount,
  leaveDecisionLetter,
  listLeaveBalances,
  listLeaveTypes,
  listMyLeave,
  remainingDaysForType,
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeSelectRef = useRef<HTMLDivElement>(null);
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
  const estimatedDays = leaveDayCount(startDate, endDate);

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
    const params = new URLSearchParams(window.location.search);
    if (params.get("apply") === "1") setApplyOpen(true);
  }, []);

  useEffect(() => {
    if (!leaveTypeId && leaveTypes[0]?.id) setLeaveTypeId(leaveTypes[0].id);
  }, [leaveTypeId, leaveTypes]);

  useEffect(() => {
    if (!applyOpen) {
      setTypeMenuOpen(false);
      return;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (typeMenuOpen) {
          setTypeMenuOpen(false);
          return;
        }
        setApplyOpen(false);
      }
    }
    function closeOnPointer(event: MouseEvent) {
      if (
        typeSelectRef.current &&
        !typeSelectRef.current.contains(event.target as Node)
      ) {
        setTypeMenuOpen(false);
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("mousedown", closeOnPointer);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("mousedown", closeOnPointer);
    };
  }, [applyOpen, typeMenuOpen]);

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const typeId =
      leaveTypeId || selectedType?.id || String(form.get("type") ?? "");
    const note = String(form.get("reason") ?? form.get("note") ?? "").trim();
    const from = startDate || String(form.get("startDate") ?? "");
    const to = endDate || String(form.get("endDate") ?? from);
    const days = leaveDayCount(from, to);
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
            durationType: "FULL_DAY",
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
    } catch {
      // runAction displays the API error.
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
              <p className={styles.requestMeta}>
                {request.dates}
                {request.reason ? ` · ${request.reason}` : ""}
              </p>
              {request.reviewerName || request.reviewComment ? (
                <p className={styles.requestReview}>
                  {request.reviewerName
                    ? `${request.reviewerName}: “${(request.reviewComment || request.status).replace(/[.]+$/, "")}.”`
                    : `“${request.reviewComment}”`}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.letterButton}
              onClick={() => void openDecisionLetter(request.id)}
            >
              <Download size={16} />
              Decision letter
            </button>
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
                  Your request goes to your HOD / HR for approval.
                </p>
                {typesError ? (
                  <p className={styles.empty} role="alert">
                    {typesError}
                  </p>
                ) : null}
                <form onSubmit={handleApply}>
                  <div className={styles.modalFields}>
                    <div className={styles.modalField}>
                      <span>Leave type</span>
                      <div className={styles.typeSelect} ref={typeSelectRef}>
                        <button
                          type="button"
                          className={styles.typeTrigger}
                          aria-haspopup="listbox"
                          aria-expanded={typeMenuOpen}
                          onClick={() => setTypeMenuOpen((open) => !open)}
                        >
                          <span>
                            {selectedType
                              ? displayLeaveTypeName(selectedType.name)
                              : "No leave types loaded"}
                          </span>
                          <ChevronDown size={16} />
                        </button>
                        {typeMenuOpen ? (
                          <ul className={styles.typeMenu} role="listbox">
                            {leaveTypes.map((item) => {
                              const active = item.id === selectedType?.id;
                              return (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    className={
                                      active
                                        ? styles.typeOptionActive
                                        : styles.typeOption
                                    }
                                    onClick={() => {
                                      setLeaveTypeId(item.id);
                                      setTypeMenuOpen(false);
                                    }}
                                  >
                                    {displayLeaveTypeName(item.name)}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                        <input
                          type="hidden"
                          name="type"
                          value={selectedType?.id ?? ""}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.dateFields}>
                      <label className={styles.modalField}>
                        <span>From</span>
                        <input
                          name="startDate"
                          type="date"
                          required
                          value={startDate}
                          onChange={(event) => setStartDate(event.target.value)}
                        />
                      </label>
                      <label className={styles.modalField}>
                        <span>To</span>
                        <input
                          name="endDate"
                          type="date"
                          required
                          value={endDate}
                          onChange={(event) => setEndDate(event.target.value)}
                        />
                      </label>
                    </div>
                    <p className={styles.duration}>
                      Duration:{" "}
                      {estimatedDays > 0
                        ? `${estimatedDays} ${estimatedDays === 1 ? "day" : "days"}`
                        : "—"}
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
                        Reason <b>*</b>
                      </span>
                      <textarea name="reason" rows={4} required />
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
