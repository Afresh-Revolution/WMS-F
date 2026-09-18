"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
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
  type ProfileExpenseClaim,
  type ProfileLeaveBalance,
  type ProfileLeaveHistoryItem,
} from "@/data/profile";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi, superAdminApi, unwrapRecord } from "@/lib/api";
import {
  cacheCurrentUser,
  initialsFromIdentity,
  readCachedOrJwtUser,
} from "@/lib/currentUser";
import { initials, listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import styles from "./ProfilePage.module.css";

const contactOnlyFields: ModalField[] = [
  { name: "phone", label: "Phone", type: "text" },
  { name: "personalEmail", label: "Personal email", type: "email" },
  { name: "location", label: "Location", type: "text" },
];

const employmentTypeOptions = [
  { label: "Full-time", value: "Full-time" },
  { label: "Part-time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
];

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "On leave", value: "On leave" },
];

function toDateInputValue(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return "";
  const date = new Date(parsed);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

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
        : superAdminApi.profile.get(),
    [secretary],
  );

  const profile = useMemo(() => {
    const record = unwrapRecord(data);
    const employee = unwrapRecord(record.employee ?? record.user ?? record);
    const personal = unwrapRecord(record.personal ?? employee.personal ?? employee);
    const employment = unwrapRecord(
      record.employment ?? record.employmentRecord ?? employee,
    );
    const name = str(
      record.name ?? record.fullName ?? employee.name ?? employee.fullName,
      "—",
    );
    return {
      initials: str(record.initials, initials(name === "—" ? "?" : name)),
      name,
      jobTitle: str(
        record.jobTitle ?? employee.jobTitle ?? employment.role,
        "—",
      ),
      department: nestedStr(
        record.department ?? employee.department ?? employment.department,
        ["name", "title", "label"],
        "—",
      ),
      status: str(record.status, "Active") as "Active",
      employeeId: str(
        record.employeeId ?? employee.employeeId ?? employee.id ?? record.id,
        "—",
      ),
      annualLeaveDays: num(record.annualLeaveDays ?? record.leaveBalance),
      personal: {
        companyEmail: str(
          personal.companyEmail ?? record.companyEmail ?? employee.email,
        ),
        personalEmail: str(personal.personalEmail ?? personal.email),
        phone: str(personal.phone ?? record.phone),
        location: str(personal.location ?? record.location),
      },
      employment: {
        role: str(employment.role ?? employment.jobTitle ?? employee.jobTitle),
        department: nestedStr(
          employment.department ?? employee.department,
          ["name", "title", "label"],
        ),
        startDate: str(employment.startDate ?? record.startDate),
        type: str(employment.type ?? record.employmentType, "Full-time"),
        reportsTo: str(employment.reportsTo ?? record.reportsTo),
      },
    };
  }, [data]);

  const leaveBalances = useMemo((): ProfileLeaveBalance[] => {
    const record = unwrapRecord(data);
    return listFrom(
      (record.leaveBalances ?? record.leave) as never,
    ).map((balance, index) => ({
      id: str(balance.id, String(index)),
      label: str(balance.label ?? balance.type),
      remaining: num(balance.remaining ?? balance.balance),
      total: num(balance.total ?? balance.allocated, 1),
    }));
  }, [data]);

  const leaveHistory = useMemo((): ProfileLeaveHistoryItem[] => {
    const record = unwrapRecord(data);
    return listFrom(
      (record.leaveHistory ?? record.leaveRequests) as never,
    ).map((leave, index) => {
      const status = str(leave.status, "Pending");
      return {
        id: str(leave.id, String(index)),
        type: str(leave.type ?? leave.leaveType),
        dates: str(leave.dates ?? leave.dateRange ?? leave.startDate),
        duration: str(leave.duration ?? leave.days),
        status: (status.toLowerCase().includes("approv") ? "Approved" : "Pending") as
          | "Approved"
          | "Pending",
      };
    });
  }, [data]);

  const expenseClaims = useMemo((): ProfileExpenseClaim[] => {
    const record = unwrapRecord(data);
    return listFrom(
      (record.expenseClaims ?? record.expenses) as never,
    ).map((claim, index) => {
      const status = str(claim.status, "Pending");
      return {
        id: str(claim.id, String(index)),
        title: str(claim.title ?? claim.description),
        date: str(claim.date ?? claim.submittedAt),
        amount: num(claim.amount),
        status: (status.toLowerCase().includes("approv") ? "Approved" : "Pending") as
          | "Approved"
          | "Pending",
      };
    });
  }, [data]);

  const { personal, employment } = profile;

  const adminEditFields: ModalField[] = [
    {
      name: "name",
      label: "Full name",
      required: true,
      defaultValue: profile.name,
      group: "Identity",
    },
    {
      name: "employeeId",
      label: "Employee ID",
      defaultValue: profile.employeeId,
      group: "Identity",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      defaultValue: profile.status,
      options: statusOptions,
      group: "Identity",
    },
    {
      name: "companyEmail",
      label: "Company email",
      type: "email",
      required: true,
      defaultValue: personal.companyEmail,
      group: "Personal details",
    },
    {
      name: "personalEmail",
      label: "Personal email",
      type: "email",
      defaultValue: personal.personalEmail,
      group: "Personal details",
    },
    {
      name: "phone",
      label: "Phone",
      defaultValue: personal.phone,
      group: "Personal details",
    },
    {
      name: "location",
      label: "Location",
      defaultValue: personal.location,
      group: "Personal details",
      fullWidth: true,
    },
    {
      name: "jobTitle",
      label: "Role",
      required: true,
      defaultValue: employment.role,
      group: "Employment details",
    },
    {
      name: "department",
      label: "Department",
      required: true,
      defaultValue: employment.department,
      group: "Employment details",
    },
    {
      name: "startDate",
      label: "Start date",
      type: toDateInputValue(employment.startDate) ? "date" : "text",
      defaultValue:
        toDateInputValue(employment.startDate) || employment.startDate,
      group: "Employment details",
    },
    {
      name: "type",
      label: "Employment type",
      type: "select",
      defaultValue: employment.type,
      options: employmentTypeOptions.some((option) => option.value === employment.type)
        ? employmentTypeOptions
        : [
            { label: employment.type, value: employment.type },
            ...employmentTypeOptions,
          ],
      group: "Employment details",
    },
    {
      name: "reportsTo",
      label: "Reports to",
      defaultValue: employment.reportsTo,
      group: "Employment details",
    },
  ];

  async function handleProfileUpdate(values: Record<string, string>) {
    await runAction("Update profile", async () => {
      if (secretary) {
        await secretaryApi.updateEmploymentRecord({
          phone: values.phone,
          personalEmail: values.personalEmail,
          address: values.location,
          location: values.location,
          personal: {
            phone: values.phone,
            personalEmail: values.personalEmail,
            location: values.location,
          },
        });
        refetch();
        return;
      }

      const name = values.name.trim();
      const { firstName, lastName } = splitName(name);
      const body = {
        name,
        fullName: name,
        firstName,
        lastName,
        employeeId: values.employeeId,
        status: values.status,
        email: values.companyEmail,
        companyEmail: values.companyEmail,
        personalEmail: values.personalEmail,
        phone: values.phone,
        location: values.location,
        address: values.location,
        jobTitle: values.jobTitle,
        role: values.jobTitle,
        department: values.department,
        startDate: values.startDate,
        employmentType: values.type,
        type: values.type,
        reportsTo: values.reportsTo,
        personal: {
          companyEmail: values.companyEmail,
          personalEmail: values.personalEmail,
          phone: values.phone,
          location: values.location,
        },
        employment: {
          role: values.jobTitle,
          jobTitle: values.jobTitle,
          department: values.department,
          startDate: values.startDate,
          type: values.type,
          reportsTo: values.reportsTo,
        },
      };
      await superAdminApi.profile.update(body);
      const current = readCachedOrJwtUser();
      cacheCurrentUser({
        id: current?.id ?? profile.employeeId,
        email: values.companyEmail || current?.email || "",
        name,
        role: current?.role || values.jobTitle,
        initials: initialsFromIdentity(name, values.companyEmail),
      });
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
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
              {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.editButton}
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={14} strokeWidth={2.25} />
          {secretary ? "Edit details" : "Edit profile"}
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
        key={editOpen ? `${secretary ? "contact" : "admin"}-${profile.employeeId}` : "closed"}
        open={editOpen}
        title={secretary ? "Edit personal details" : "Edit profile"}
        description={
          secretary
            ? "Update contact information on your profile."
            : "Update your identity, contact, and employment details."
        }
        wide={!secretary}
        fields={
          secretary
            ? contactOnlyFields.map((field) => ({
                ...field,
                defaultValue:
                  field.name === "phone"
                    ? personal.phone
                    : field.name === "personalEmail"
                      ? personal.personalEmail
                      : personal.location,
              }))
            : adminEditFields
        }
        submitLabel="Save changes"
        onClose={() => setEditOpen(false)}
        onSubmit={handleProfileUpdate}
      />
    </div>
  );
}
