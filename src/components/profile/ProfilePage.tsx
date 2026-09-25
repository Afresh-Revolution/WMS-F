"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  profileLeaveHistory,
  type ProfileExpenseClaim,
  type ProfileLeaveBalance,
  type ProfileLeaveHistoryItem,
} from "@/data/profile";
import { HideOnManager } from "@/components/layout/HideOnManager";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { usePageActions } from "@/hooks/usePageActions";
import {
  employeeApi,
  leaveDayCount,
  listLeaveBalances,
  listMyLeave,
  managerApi,
  secretaryApi,
  superAdminApi,
  unwrapRecord,
} from "@/lib/api";
import {
  cacheCurrentUser,
  initialsFromIdentity,
  readCachedOrJwtUser,
} from "@/lib/currentUser";
import { initials, listFrom, mapLeaveBalance, nestedStr, num, str } from "@/lib/api/mappers";
import { portalHref } from "@/lib/portalPaths";
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

function formatProfileDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = Date.parse(
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : trimmed,
  );
  if (!Number.isFinite(parsed)) return trimmed;
  return new Date(parsed).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function parseProfileDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : trimmed,
  );
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed);
}

function formatLeaveShortDate(value: string, includeYear = true) {
  const date = parseProfileDate(value);
  if (!date) return value.trim();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
  });
}

function formatLeaveHistoryDates(startRaw: string, endRaw: string, fallback = "") {
  const start = parseProfileDate(startRaw);
  const end = parseProfileDate(endRaw);
  if (start && end) {
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) return formatLeaveShortDate(startRaw);
    const sameYear = start.getFullYear() === end.getFullYear();
    return `${formatLeaveShortDate(startRaw, !sameYear)} – ${formatLeaveShortDate(endRaw)}`;
  }
  if (start) return formatLeaveShortDate(startRaw);
  return fallback.trim();
}

function formatLeaveHistoryDuration(raw: unknown, startRaw: string, endRaw: string) {
  const numeric =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && /^\d+(\.\d+)?$/.test(raw.trim())
        ? Number(raw.trim())
        : NaN;
  const days = Number.isFinite(numeric)
    ? numeric
    : startRaw && endRaw
      ? leaveDayCount(startRaw, endRaw)
      : NaN;
  if (Number.isFinite(days) && days > 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }
  return str(raw);
}

function formatLeaveHistoryType(value: string) {
  const raw = value.trim();
  if (!raw) return "Leave";
  if (/^personal(\s+leave)?$/i.test(raw)) return "Personal";
  if (/\bleave$/i.test(raw)) {
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return `${titleCase(raw)} leave`;
}

function titleCase(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

type ProfileSection = "Overview" | "Leave" | "Expenses";

export function ProfilePage({
  initialSection = "Overview",
  secretary = false,
  employee = false,
}: {
  initialSection?: ProfileSection;
  secretary?: boolean;
  employee?: boolean;
}) {
  const { runAction, showToast } = usePageActions();
  const [editOpen, setEditOpen] = useState(false);
  const [section, setSection] = useState<ProfileSection>(initialSection);
  const pathname = usePathname();
  const manager = useManagerPortal();
  const { user: sessionUser } = useCurrentUser();
  const selfEdit = secretary || manager || employee;
  const activeSection = employee ? section : initialSection;

  const { data, loading, error, refetch } = useAsyncData(async () => {
    if (employee) {
      const [profile, employment, settings, balances, leave, expenses] =
        await Promise.all([
          employeeApi.profile.get().catch(() => null),
          employeeApi.employmentRecord.get().catch(() => null),
          employeeApi.settings.get().catch(() => null),
          employeeApi.leave
            .balances()
            .catch(() => listLeaveBalances().catch(() => [])),
          employeeApi.leave.list().catch(() => listMyLeave().catch(() => [])),
          employeeApi.expenses
            .list()
            .catch(() => employeeApi.expenses.claims().catch(() => [])),
        ]);
      return { profile, employment, settings, balances, leave, expenses };
    }
    if (manager) {
      const [profile, employment] = await Promise.all([
        managerApi.getProfile().catch(() => null),
        managerApi.getEmploymentRecord().catch(() => null),
      ]);
      return { profile, employment };
    }
    if (secretary) {
      return { employment: await secretaryApi.getEmploymentRecord() };
    }
    return { profile: await superAdminApi.profile.get() };
  }, [employee, manager, secretary]);

  const profile = useMemo(() => {
    const root = unwrapRecord(data);
    const record = unwrapRecord(root.profile ?? root.employment ?? root);
    const settings = unwrapRecord(root.settings);
    const employmentRoot = unwrapRecord(root.employment ?? record);
    const overview = unwrapRecord(employmentRoot.overview ?? record.overview ?? record);
    const employeeRecord = unwrapRecord(
      record.employee ?? employmentRoot.employee ?? record.user ?? overview,
    );
    const personal = unwrapRecord(
      settings.personal ??
        employmentRoot.personalInformation ??
        record.personal ??
        employeeRecord.personal ??
        employeeRecord,
    );
    const employment = unwrapRecord(
      employmentRoot.employment ?? record.employment ?? record.employmentRecord ?? employeeRecord,
    );
    const name = str(
      overview.fullName ??
        record.name ??
        record.fullName ??
        employeeRecord.name ??
        employeeRecord.fullName ??
        personal.fullName ??
        sessionUser?.name,
      "—",
    );
    const department = nestedStr(
      overview.department ??
        record.department ??
        employeeRecord.department ??
        employment.department ??
        employment.departmentName,
      ["name", "title", "label"],
      "—",
    );
    const jobTitle = str(
      employment.jobTitle ??
        employment.role ??
        nestedStr(overview.position, ["title", "name", "label"]) ??
        record.jobTitle ??
        employeeRecord.jobTitle,
      "—",
    );
    const reportsTo = nestedStr(
      overview.manager ?? employment.manager ?? employment.reportsTo ?? record.reportsTo,
      ["name", "fullName", "title", "label"],
    );
    return {
      initials: str(
        record.initials ?? overview.initials ?? sessionUser?.initials,
        initials(name === "—" ? "?" : name),
      ),
      name,
      jobTitle,
      department,
      status: titleCase(str(overview.status ?? record.status ?? employment.status, "Active")),
      employeeId: str(
        overview.employeeId ??
          overview.employee_id ??
          record.employeeId ??
          employeeRecord.employeeId ??
          employeeRecord.employee_id ??
          employeeRecord.id ??
          record.id ??
          sessionUser?.employeeId,
        "—",
      ),
      annualLeaveDays: num(
        record.annualLeaveDays ?? record.leaveBalance ?? overview.annualLeaveDays,
      ),
      personal: {
        companyEmail: str(
          personal.companyEmail ??
            overview.email ??
            record.companyEmail ??
            employeeRecord.email ??
            personal.email ??
            sessionUser?.email,
        ),
        personalEmail: str(
          settings.personalEmail ??
            personal.personalEmail ??
            personal.personal_email ??
            personal.alternateEmail,
        ),
        phone: str(
          settings.phone ?? personal.phone ?? overview.phone ?? record.phone,
        ),
        location: str(
          settings.address ??
            settings.location ??
            personal.location ??
            personal.address ??
            employment.workLocation ??
            record.location,
        ),
      },
      employment: {
        role: jobTitle === "—" ? "" : jobTitle,
        department: department === "—" ? "" : department,
        startDate: formatProfileDate(
          str(
            employment.startDate ??
              employment.start_date ??
              record.startDate ??
              employeeRecord.hireDate,
          ),
        ),
        type: str(
          employment.employmentType ?? employment.type ?? record.employmentType,
          "Full-time",
        ),
        reportsTo,
      },
    };
  }, [data, sessionUser]);

  const leaveBalances = useMemo((): ProfileLeaveBalance[] => {
    const root = unwrapRecord(data);
    const record = unwrapRecord(root.employment ?? root.profile ?? root);
    const dedicated = listFrom((root.balances ?? data?.balances) as never);
    const nested = listFrom(
      (record.leaveBalances ?? record.leave ?? root.leaveBalances) as never,
    );
    const rows = dedicated.length ? dedicated : nested;
    return rows
      .map((balance, index) => {
        const mapped = mapLeaveBalance(balance, index);
        return {
          id: mapped.id,
          label: mapped.label,
          remaining: mapped.remaining,
          total: mapped.total || 1,
        };
      })
      .filter((balance) => balance.label);
  }, [data]);

  const annualLeaveDays = useMemo(() => {
    const annual = leaveBalances.find((balance) =>
      /annual/i.test(balance.label),
    );
    return annual?.remaining ?? profile.annualLeaveDays;
  }, [leaveBalances, profile.annualLeaveDays]);

  const leaveHistory = useMemo((): ProfileLeaveHistoryItem[] => {
    const root = unwrapRecord(data);
    const record = unwrapRecord(root.employment ?? root.profile ?? root);
    const dedicated = listFrom((root.leave ?? data?.leave) as never);
    const nested = listFrom(
      (record.leaveHistory ?? record.leaveRequests) as never,
    );
    const rows = (dedicated.length ? dedicated : nested).map((leave, index) => {
      const status = str(leave.status, "Pending");
      const startRaw = str(leave.startDate ?? leave.start_date ?? leave.from);
      const endRaw = str(leave.endDate ?? leave.end_date ?? leave.to);
      const dates = formatLeaveHistoryDates(
        startRaw,
        endRaw,
        str(leave.dates ?? leave.dateRange),
      );
      return {
        id: str(leave.id, String(index)),
        type: formatLeaveHistoryType(
          str(leave.type ?? leave.leaveType ?? leave.leave_type ?? leave.category),
        ),
        dates,
        duration: formatLeaveHistoryDuration(
          leave.duration ?? leave.days ?? leave.dayCount ?? leave.numberOfDays,
          startRaw,
          endRaw,
        ),
        status: (status.toLowerCase().includes("approv") ? "Approved" : "Pending") as
          | "Approved"
          | "Pending",
      };
    });
    if (employee && rows.length === 0) return profileLeaveHistory;
    return rows;
  }, [data, employee]);

  const expenseClaims = useMemo((): ProfileExpenseClaim[] => {
    const root = unwrapRecord(data);
    const record = unwrapRecord(root.employment ?? root.profile ?? root);
    const dedicated = listFrom((root.expenses ?? data?.expenses) as never);
    const nested = listFrom(
      (record.expenseClaims ?? record.expenses) as never,
    );
    return (dedicated.length ? dedicated : nested).map((claim, index) => {
      const status = str(claim.status, "Pending");
      return {
        id: str(claim.id, String(index)),
        title: str(claim.title ?? claim.description),
        date: formatProfileDate(str(claim.date ?? claim.submittedAt)),
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
      if (selfEdit) {
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
        if (employee) {
          try {
            await employeeApi.settings.patch(body);
          } catch {
            await employeeApi.profile.patch(body);
          }
          await employeeApi.employmentRecord.patch(body).catch(() => undefined);
          refetch();
          return;
        }
        await (manager
          ? managerApi.updateEmploymentRecord(body)
          : secretaryApi.updateEmploymentRecord(body));
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
      <HideOnManager>
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
      </HideOnManager>

      {employee && activeSection === "Leave" ? null : (
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
          Edit details
        </button>
      </div>
      )}

      <article className={styles.heroCard}>
        <div className={styles.heroMain}>
          <span className={styles.heroAvatar}>{profile.initials}</span>
          <div className={styles.heroCopy}>
            <h2 className={styles.heroName}>{profile.name}</h2>
            <p className={styles.heroRole}>
              {[profile.jobTitle, profile.department].filter((part) => part && part !== "—").join(" · ") || "—"}
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
            {annualLeaveDays || "—"} days
          </p>
        </div>
      </article>

      <nav className={styles.tabs} aria-label="Profile sections">
        {(
          [
            ["Overview", secretary ? "/secretary/profile" : portalHref(pathname, "/profile")],
            ["Leave", secretary ? "/secretary/profile/leave" : portalHref(pathname, "/profile/leave")],
            ["Expenses", secretary ? "/secretary/profile/expenses" : portalHref(pathname, "/profile/expenses")],
          ] as const
        ).map(([label, href]) =>
          employee ? (
            <button
              key={label}
              type="button"
              className={`${styles.tab} ${
                activeSection === label ? styles.tabActive : ""
              }`}
              onClick={() => setSection(label)}
            >
              {label}
            </button>
          ) : (
            <Link
              key={label}
              href={href}
              className={`${styles.tab} ${
                activeSection === label ? styles.tabActive : ""
              }`}
            >
              {label}
            </Link>
          ),
        )}
      </nav>

      {activeSection === "Overview" ? (
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
            {leaveBalances.length === 0 ? (
              <p className={styles.emptyCopy}>No leave balances yet.</p>
            ) : null}
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

      {activeSection === "Leave" ? (
        <div className={styles.leaveHistoryWrap}>
          <section className={styles.leaveHistory}>
            <h2 className={styles.leaveHistoryTitle}>Leave history</h2>
            <div className={styles.leaveHistoryList}>
              {leaveHistory.length === 0 ? (
                <p className={styles.emptyCopy}>No leave requests yet.</p>
              ) : null}
              {leaveHistory.map((leave) => (
                <article key={leave.id} className={styles.leaveHistoryRow}>
                  <div>
                    <h3 className={styles.leaveHistoryType}>{leave.type}</h3>
                    <p className={styles.leaveHistoryDates}>
                      {leave.dates}
                      {leave.duration ? ` · ${leave.duration}` : ""}
                    </p>
                  </div>
                  <div className={styles.leaveHistoryActions}>
                    <span
                      className={`${styles.leaveHistoryStatus} ${
                        leave.status === "Approved"
                          ? styles.leaveHistoryApproved
                          : styles.leaveHistoryPending
                      }`}
                    >
                      {leave.status}
                    </span>
                    {leave.status === "Approved" ? (
                      <button
                        type="button"
                        className={styles.downloadLetter}
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
        </div>
      ) : null}

      {activeSection === "Expenses" ? (
        <section className={styles.historyCard}>
          <h2 className={styles.historyTitle}>My expense claims</h2>
          <div className={styles.historyList}>
            {expenseClaims.length === 0 ? (
              <p className={styles.emptyCopy}>No expense claims yet.</p>
            ) : null}
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
        key={editOpen ? `${selfEdit ? "contact" : "admin"}-${profile.employeeId}` : "closed"}
        open={editOpen}
        title={selfEdit ? "Edit personal details" : "Edit profile"}
        description={
          selfEdit
            ? "Update contact information on your profile."
            : "Update your identity, contact, and employment details."
        }
        wide={!selfEdit}
        fields={
          selfEdit
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
