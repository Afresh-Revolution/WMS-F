"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
} from "lucide-react";
import {
  profileExpenseClaims as fallbackExpenseClaims,
  profileLeaveHistory as fallbackLeaveHistory,
  profileLeaveBalances as fallbackLeaveBalances,
  profileRecord as fallbackProfile,
} from "@/data/profile";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { profileApi, secretaryApi } from "@/lib/api";
import { initials, nestedStr, num, str } from "@/lib/api/mappers";
import styles from "./ProfilePage.module.css";

const editProfileFields = [
  { name: "phone", label: "Phone", type: "text" as const },
  { name: "personalEmail", label: "Personal email", type: "email" as const },
  { name: "location", label: "Location", type: "text" as const },
];

type ProfileSection = "Overview" | "Leave" | "Expenses";

export function ProfilePage({
  initialSection = "Overview",
  secretary = false,
}: {
  initialSection?: ProfileSection;
  secretary?: boolean;
}) {
  const { runAction, showToast } = usePageActions();
  const [editOpen, setEditOpen] = useState(false);

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      secretary
        ? secretaryApi.getEmploymentRecord()
        : profileApi.get(),
    [secretary],
  );

  const profile = useMemo(() => {
    if (!data) return fallbackProfile;
    const record = data as Record<string, unknown>;
    const employee = (record.employee ?? record.user ?? record) as Record<
      string,
      unknown
    >;
    const personal = (record.personal ?? employee.personal ?? employee) as Record<
      string,
      unknown
    >;
    const employment = (record.employment ??
      record.employmentRecord ??
      employee) as Record<string, unknown>;
    const name = str(
      record.name ?? record.fullName ?? employee.name ?? employee.fullName,
      fallbackProfile.name,
    );
    return {
      initials: str(record.initials, initials(name)),
      name,
      jobTitle: str(
        record.jobTitle ?? employee.jobTitle ?? employment.role,
        fallbackProfile.jobTitle,
      ),
      department: nestedStr(
        record.department ?? employee.department ?? employment.department,
        ["name", "title", "label"],
        fallbackProfile.department,
      ),
      status: str(record.status, fallbackProfile.status) as "Active",
      employeeId: str(
        record.employeeId ?? employee.employeeId ?? employee.id ?? record.id,
        fallbackProfile.employeeId,
      ),
      annualLeaveDays: num(
        record.annualLeaveDays ?? record.leaveBalance,
        fallbackProfile.annualLeaveDays,
      ),
      personal: {
        companyEmail: str(
          personal.companyEmail ?? record.companyEmail ?? employee.email,
          fallbackProfile.personal.companyEmail,
        ),
        personalEmail: str(
          personal.personalEmail ?? personal.email,
          fallbackProfile.personal.personalEmail,
        ),
        phone: str(personal.phone ?? record.phone, fallbackProfile.personal.phone),
        location: str(
          personal.location ?? record.location,
          fallbackProfile.personal.location,
        ),
      },
      employment: {
        role: str(
          employment.role ?? employment.jobTitle ?? employee.jobTitle,
          fallbackProfile.employment.role,
        ),
        department: nestedStr(
          employment.department ?? employee.department,
          ["name", "title", "label"],
          fallbackProfile.employment.department,
        ),
        startDate: str(
          employment.startDate ?? record.startDate,
          fallbackProfile.employment.startDate,
        ),
        type: str(employment.type ?? record.employmentType, fallbackProfile.employment.type),
        reportsTo: str(employment.reportsTo ?? record.reportsTo, ""),
      },
    };
  }, [data]);

  const leaveBalances = useMemo(() => {
    const record = (data ?? {}) as Record<string, unknown>;
    const balances = record.leaveBalances ?? record.leave;
    if (!Array.isArray(balances)) return fallbackLeaveBalances;
    return balances.map((item, index) => {
      const balance = item as Record<string, unknown>;
      return {
        id: str(balance.id, String(index)),
        label: str(balance.label ?? balance.type),
        remaining: num(balance.remaining ?? balance.balance),
        total: num(balance.total ?? balance.allocated, 1),
      };
    });
  }, [data]);

  const leaveHistory = useMemo(() => {
    const record = (data ?? {}) as Record<string, unknown>;
    const history = record.leaveHistory ?? record.leaveRequests;
    if (!Array.isArray(history)) return fallbackLeaveHistory;
    return history.map((item, index) => {
      const leave = item as Record<string, unknown>;
      const status = str(leave.status, "Pending");
      return {
        id: str(leave.id, String(index)),
        type: str(leave.type ?? leave.leaveType),
        dates: str(leave.dates ?? leave.dateRange ?? leave.startDate),
        duration: str(leave.duration ?? leave.days),
        status: (status === "Approved" ? "Approved" : "Pending") as
          | "Approved"
          | "Pending",
      };
    });
  }, [data]);

  const expenseClaims = useMemo(() => {
    const record = (data ?? {}) as Record<string, unknown>;
    const claims = record.expenseClaims ?? record.expenses;
    if (!Array.isArray(claims)) return fallbackExpenseClaims;
    return claims.map((item, index) => {
      const claim = item as Record<string, unknown>;
      const status = str(claim.status, "Pending");
      return {
        id: str(claim.id, String(index)),
        title: str(claim.title ?? claim.description),
        date: str(claim.date ?? claim.submittedAt),
        amount: num(claim.amount),
        status: (status === "Approved" ? "Approved" : "Pending") as
          | "Approved"
          | "Pending",
      };
    });
  }, [data]);

  const { personal, employment } = profile;

  async function handleProfileUpdate(values: Record<string, string>) {
    await runAction("Update profile", async () => {
      const body = {
        phone: values.phone,
        personalEmail: values.personalEmail,
        address: values.location,
        location: values.location,
        personal: {
          phone: values.phone,
          personalEmail: values.personalEmail,
          location: values.location,
        },
      };
      if (secretary) await secretaryApi.updateEmploymentRecord(body);
      else await profileApi.update(body);
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        <div className={styles.topActions}>
          <label className={styles.topSearch}>
            <Search size={15} className={styles.topSearchIcon} />
            <input
              placeholder="Search"
              className={styles.topSearchInput}
              readOnly
              aria-label="Search"
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>{profile.initials}</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>My profile</p>
          <h1 className={styles.title}>Your employment record</h1>
          <p className={styles.subtitle}>
            View your personal and employment details, leave balance, and request
            history.
          </p>
          {loading ? <p className={styles.subtitle}>Loading profile…</p> : null}
          {error ? (
            <p className={styles.subtitle} role="alert">
              Showing cached profile — {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.editButton}
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={14} strokeWidth={2.25} />
          Edit details
        </button>
      </div>

      <article className={styles.heroCard}>
        <div className={styles.heroMain}>
          <span className={styles.heroAvatar}>{profile.initials}</span>
          <div className={styles.heroCopy}>
            <h2 className={styles.heroName}>{profile.name}</h2>
            <p className={styles.heroRole}>
              {profile.jobTitle} · {profile.department}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} aria-hidden />
                {profile.status}
              </span>
              <span className={styles.employeeId}>{profile.employeeId}</span>
            </div>
          </div>
        </div>
        <div className={styles.leaveSummary}>
          <p className={styles.leaveSummaryLabel}>Annual leave</p>
          <p className={styles.leaveSummaryValue}>
            {profile.annualLeaveDays} days
          </p>
        </div>
      </article>

      <nav className={styles.tabs} aria-label="Profile sections">
        <Link
          href={secretary ? "/secretary/profile" : "/profile"}
          className={`${styles.tab} ${
            initialSection === "Overview" ? styles.tabActive : ""
          }`}
        >
          Overview
        </Link>
        <Link
          href={secretary ? "/secretary/profile/leave" : "/profile/leave"}
          className={`${styles.tab} ${
            initialSection === "Leave" ? styles.tabActive : ""
          }`}
        >
          Leave
        </Link>
        <Link
          href={secretary ? "/secretary/profile/expenses" : "/profile/expenses"}
          className={`${styles.tab} ${
            initialSection === "Expenses" ? styles.tabActive : ""
          }`}
        >
          Expenses
        </Link>
      </nav>

      {initialSection === "Overview" ? (
        <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Personal details</h2>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <Mail size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <div className={styles.detailValueRow}>
                  <p className={styles.detailValue}>{personal.companyEmail}</p>
                  <span className={styles.companyBadge}>Company</span>
                </div>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <Mail size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailValue}>{personal.personalEmail}</p>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <Phone size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailValue}>{personal.phone}</p>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon} aria-hidden>
                <MapPin size={15} strokeWidth={2} />
              </span>
              <div className={styles.detailCopy}>
                <p className={styles.detailValue}>{personal.location}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Employment details</h2>
          <div className={styles.detailList}>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>
                <BriefcaseBusiness size={14} />
                Role
              </h3>
              <p className={styles.employmentValue}>{employment.role}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>
                <BriefcaseBusiness size={14} />
                Department
              </h3>
              <p className={styles.employmentValue}>{employment.department}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>
                <CalendarDays size={14} />
                Start date
              </h3>
              <p className={styles.employmentValue}>{employment.startDate}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Employment type</h3>
              <p className={styles.employmentValue}>{employment.type}</p>
            </div>
            <div className={styles.employmentRow}>
              <h3 className={styles.employmentLabel}>Reports to</h3>
              <p
                className={`${styles.employmentValue} ${
                  employment.reportsTo ? "" : styles.employmentEmpty
                }`}
              >
                {employment.reportsTo || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Leave balance</h2>
          <div className={styles.balanceList}>
            {leaveBalances.map((balance) => {
              const remainingPercent = (balance.remaining / balance.total) * 100;
              return (
                <div key={balance.id} className={styles.balanceRow}>
                  <div className={styles.balanceHeader}>
                    <h3 className={styles.balanceLabel}>{balance.label}</h3>
                    <span className={styles.balanceMeta}>
                      {balance.remaining} of {balance.total} left
                    </span>
                  </div>
                  <div
                    className={styles.meterTrack}
                    role="meter"
                    aria-label={balance.label}
                    aria-valuemin={0}
                    aria-valuemax={balance.total}
                    aria-valuenow={balance.remaining}
                  >
                    <div
                      className={styles.meterFill}
                      style={{ width: `${remainingPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        </div>
      ) : null}

      {initialSection === "Leave" ? (
        <section className={styles.historyCard}>
          <h2 className={styles.historyTitle}>Leave history</h2>
          <div className={styles.historyList}>
            {leaveHistory.map((leave) => (
              <article key={leave.id} className={styles.historyRow}>
                <div>
                  <h3 className={styles.historyType}>{leave.type}</h3>
                  <p className={styles.historyDates}>
                    {leave.dates} · {leave.duration}
                  </p>
                </div>
                <div className={styles.historyActions}>
                  <span
                    className={`${styles.historyStatus} ${
                      leave.status === "Approved"
                        ? styles.historyApproved
                        : styles.historyPending
                    }`}
                  >
                    {leave.status}
                  </span>
                  {leave.status === "Approved" ? (
                    <button
                      type="button"
                      className={styles.downloadButton}
                      onClick={() =>
                        showToast("Leave letter download started", "success")
                      }
                    >
                      Download letter
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {initialSection === "Expenses" ? (
        <section className={styles.historyCard}>
          <h2 className={styles.historyTitle}>My expense claims</h2>
          <div className={styles.historyList}>
            {expenseClaims.map((claim) => (
              <article key={claim.id} className={styles.historyRow}>
                <div>
                  <h3 className={styles.historyType}>{claim.title}</h3>
                  <p className={styles.historyDates}>{claim.date}</p>
                </div>
                <div className={styles.historyActions}>
                  <strong className={styles.expenseAmount}>
                    ₦ {claim.amount.toLocaleString("en-NG")}
                  </strong>
                  <span
                    className={`${styles.historyStatus} ${
                      claim.status === "Approved"
                        ? styles.historyApproved
                        : styles.historyPending
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <SimpleModal
        open={editOpen}
        title="Edit personal details"
        description="Update contact information on your profile."
        fields={editProfileFields.map((field) => ({
          ...field,
          defaultValue:
            field.name === "phone"
              ? personal.phone
              : field.name === "personalEmail"
                ? personal.personalEmail
                : personal.location,
        }))}
        submitLabel="Save changes"
        onClose={() => setEditOpen(false)}
        onSubmit={handleProfileUpdate}
      />
    </div>
  );
}
