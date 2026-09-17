"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  Clock,
  Mail,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import { avatarColor, initials, nestedStr, str } from "@/lib/api/mappers";
import {
  emailQueueRequests,
  recentlyCreatedEmails,
  suggestEmails,
  type EmailQueueRequest,
  type EmailRequestStatus,
} from "@/data/secretary";
import styles from "./SecretaryEmailRequestOpenPage.module.css";

const statusClass: Record<EmailRequestStatus, string> = {
  Pending: styles.statusPending,
  Failed: styles.statusFailed,
  Created: styles.statusCreated,
  Cancelled: styles.statusCancelled,
};

function mapDetail(record: Record<string, unknown>, fallback?: EmailQueueRequest): EmailQueueRequest {
  const employee = record.employee;
  const requester = record.requestedBy ?? record.requester;
  const name = str(
    record.name ?? record.employeeName,
    nestedStr(employee, ["name", "fullName"], fallback?.name ?? ""),
  );
  const email = str(
    record.email ?? record.requestedEmail ?? record.emailAddress,
    nestedStr(employee, ["companyEmail", "email"], fallback?.email ?? ""),
  );
  const rawStatus = str(record.status, fallback?.status ?? "Pending").toLowerCase();
  const status: EmailRequestStatus = rawStatus.includes("fail")
    ? "Failed"
    : rawStatus.includes("cancel")
      ? "Cancelled"
      : rawStatus.includes("creat") || rawStatus.includes("done")
        ? "Created"
        : "Pending";

  return {
    id: str(record.id, fallback?.id ?? ""),
    requestId: str(record.requestId ?? record.code, fallback?.requestId ?? ""),
    name,
    initials: str(record.initials, fallback?.initials ?? initials(name)),
    avatarColor: str(
      record.avatarColor,
      fallback?.avatarColor ?? avatarColor(name),
    ),
    role: str(
      record.role ?? record.jobTitle,
      nestedStr(employee, ["jobTitle", "role"], fallback?.role ?? ""),
    ),
    department: nestedStr(
      record.department ??
        (employee as Record<string, unknown> | undefined)?.department,
      ["name", "title", "label"],
      fallback?.department ?? "",
    ),
    email,
    status,
    requestedBy: str(
      record.requesterName,
      nestedStr(requester, ["name", "fullName"], fallback?.requestedBy ?? ""),
    ),
    requestedByRole: str(
      record.requestedByRole ?? record.requesterRole,
      fallback?.requestedByRole ?? "HR",
    ),
    requestedAt: str(
      record.requestedAt ?? record.requested_at ?? record.createdAt,
      fallback?.requestedAt ?? "",
    ),
    hrNote: str(
      record.hrNote ?? record.hr_note ?? record.note ?? record.reason,
      fallback?.hrNote ?? "",
    ),
  };
}

function localAvailability(address: string, currentEmail: string) {
  const normalized = address.trim().toLowerCase();
  const taken = [
    ...recentlyCreatedEmails.map((item) => item.email),
    ...emailQueueRequests
      .filter((item) => item.status === "Created")
      .map((item) => item.email),
  ].map((item) => item.toLowerCase());

  if (normalized === currentEmail.toLowerCase()) return true;
  return !taken.includes(normalized);
}

export function SecretaryEmailRequestOpenPage({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { runAction, showToast } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);
  const fallback = emailQueueRequests.find(
    (item) => item.id === requestId || item.requestId === requestId,
  );

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.getEmailRequest(requestId),
    [requestId],
  );

  const request = useMemo(() => {
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (record.id || record.email || record.name) {
        return mapDetail(record, fallback);
      }
    }
    return fallback ?? null;
  }, [data, fallback]);

  const suggestions = useMemo(
    () => suggestEmails(request?.email ?? ""),
    [request?.email],
  );

  const [address, setAddress] = useState(request?.email ?? "");
  const [checkState, setCheckState] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  useEffect(() => {
    if (!request) return;
    setAddress(request.email);
    setCheckState("idle");
  }, [request]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function checkAddress(nextAddress = address) {
    const value = nextAddress.trim().toLowerCase();
    if (!value) {
      showToast("Enter an email address to check", "info");
      return;
    }
    setCheckState("checking");
    try {
      const result = (await secretaryApi.checkEmail(value)) as Record<
        string,
        unknown
      >;
      const available = Boolean(
        result.available ?? result.isAvailable ?? result.free,
      );
      setCheckState(available ? "available" : "taken");
    } catch {
      setCheckState(
        localAvailability(value, request?.email ?? "") ? "available" : "taken",
      );
    }
  }

  function selectSuggestion(email: string) {
    setAddress(email);
    setCheckState("idle");
  }

  async function cancelRequest() {
    if (!request) return;
    await runAction("Cancel request", async () => {
      await secretaryApi.cancelEmailRequest(request.id);
    }, `${request.requestId} cancelled`);
    router.push("/secretary/email-requests");
  }

  async function assignEmail() {
    if (!request) return;
    const value = address.trim().toLowerCase();
    if (!value) {
      showToast("Enter an email address first", "info");
      return;
    }
    if (checkState === "taken") {
      showToast("Choose an available address before assigning", "error");
      return;
    }
    await runAction(
      "Create and assign email",
      async () => {
        await secretaryApi.assignEmail(request.id, { email: value });
      },
      `${value} assigned to ${request.name}`,
    );
    router.push("/secretary/email-requests");
  }

  if (!request) {
    return (
      <div className={styles.page}>
        <Link href="/secretary/email-requests" className={styles.backLink}>
          ← Back to queue
        </Link>
        <p className={styles.empty}>This email request could not be found.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        {loading ? <p className={styles.dateLabel}>Loading request…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Using cached request — {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <NotificationsLink className={styles.iconButton}>
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <Link href="/secretary/email-requests" className={styles.backLink}>
        ← Back to queue
      </Link>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.identity}>
            <span
              className={styles.avatar}
              style={{ background: request.avatarColor }}
            >
              {request.initials}
            </span>
            <div>
              <h1 className={styles.personName}>{request.name}</h1>
              <p className={styles.personRole}>{request.role}</p>
            </div>
            <span className={statusClass[request.status]}>{request.status}</span>
          </div>

          <dl className={styles.metaList}>
            <div className={styles.metaRow}>
              <dt>
                <Building2 size={15} />
                Department
              </dt>
              <dd>{request.department}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>
                <UserRound size={15} />
                Requested by
              </dt>
              <dd>
                {request.requestedBy} ({request.requestedByRole})
              </dd>
            </div>
            <div className={styles.metaRow}>
              <dt>
                <Clock size={15} />
                Requested
              </dt>
              <dd>{request.requestedAt}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>
                <Mail size={15} />
                Preferred
              </dt>
              <dd className={styles.preferred}>{request.email}</dd>
            </div>
          </dl>

          <div className={styles.note}>
            <p className={styles.noteLabel}>HR note</p>
            <p className={styles.noteBody}>{request.hrNote}</p>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.checkerHead}>
            <h2 className={styles.checkerTitle}>
              <Search size={16} />
              Email availability checker
            </h2>
            <p className={styles.checkerCopy}>
              Enter the desired address and check it against the directory before
              provisioning.
            </p>
          </div>

          <form
            className={styles.checkRow}
            onSubmit={(event) => {
              event.preventDefault();
              void checkAddress();
            }}
          >
            <input
              ref={searchRef}
              type="email"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setCheckState("idle");
              }}
              className={styles.emailInput}
              aria-label="Desired email address"
            />
            <button type="submit" className={styles.checkButton}>
              <Search size={14} />
              Check
            </button>
          </form>

          {checkState === "available" ? (
            <p className={styles.checkOk}>This address is available.</p>
          ) : null}
          {checkState === "taken" ? (
            <p className={styles.checkTaken}>
              This address is already in the directory.
            </p>
          ) : null}
          {checkState === "checking" ? (
            <p className={styles.checkIdle}>Checking directory…</p>
          ) : null}

          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>
              <Sparkles size={14} />
              Suggested alternatives
            </p>
            <div className={styles.suggestList}>
              {suggestions.map((email) => (
                <button
                  key={email}
                  type="button"
                  className={`${styles.suggestChip} ${
                    address === email ? styles.suggestChipActive : ""
                  }`}
                  onClick={() => selectSuggestion(email)}
                >
                  {email}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => void cancelRequest()}
            >
              Cancel request
            </button>
            <button
              type="button"
              className={styles.assignButton}
              onClick={() => void assignEmail()}
            >
              <Mail size={16} />
              Create & assign email
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
