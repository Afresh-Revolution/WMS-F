"use client";

import { useMemo, useState } from "react";
import { PageDateLabel } from "@/components/layout/PageDateLabel";
import {
  Briefcase,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
} from "lucide-react";
import Link from "next/link";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { formatRoleLabel } from "@/lib/currentUser";
import {
  employeeApi,
  listLeaveBalances,
  profileApi,
  unwrapRecord,
} from "@/lib/api";
import { initials, listFrom, mapLeaveBalance, nestedStr, str } from "@/lib/api/mappers";
import styles from "./EmployeeProfilePage.module.css";

type ProfileTab = "Overview" | "Leave" | "Expenses";

function dash(value: string) {
  return value.trim() || "—";
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = nestedStr(value, [
        "fullName",
        "name",
        "title",
        "label",
        "email",
      ]);
      if (nested && nested !== "[object Object]") return nested;
      continue;
    }
    const text = str(value).trim();
    if (text && text !== "[object Object]") return text;
  }
  return "";
}

function formatDisplayDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : trimmed;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return trimmed;
  return new Date(parsed).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function titleCaseStatus(value: string) {
  const raw = value.trim();
  if (!raw) return "Active";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function fieldValue(value: string) {
  return value === "—" ? "" : value;
}

export function EmployeeProfilePage() {
  const { user: sessionUser } = useCurrentUser();
  const { runAction } = usePageActions();
  const [tab, setTab] = useState<ProfileTab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [profile, employment, balances] = await Promise.all([
      employeeApi.profile.get().catch(() => profileApi.get().catch(() => null)),
      employeeApi.employmentRecord.get().catch(() => null),
      listLeaveBalances().catch(() => []),
    ]);
    return { profile, employment, balances };
  }, []);

  const profile = useMemo(() => {
    const profileRoot = unwrapRecord(data?.profile);
    const employmentRoot = unwrapRecord(data?.employment);
    const user = unwrapRecord(profileRoot.user ?? profileRoot);
    const employee = unwrapRecord(
      profileRoot.employee ?? employmentRoot.employee ?? user.employee,
    );
    const overview = unwrapRecord(employmentRoot.overview ?? employmentRoot);
    const personal = unwrapRecord(
      employmentRoot.personalInformation ??
        employmentRoot.personal ??
        overview.personal ??
        employee,
    );
    const employment = unwrapRecord(
      employmentRoot.employment ?? overview.employment ?? employee,
    );
    const name = firstText(
      overview.fullName,
      personal.fullName,
      user.fullName,
      user.name,
      employee.fullName,
      employee.name,
      sessionUser?.name,
    );
    return {
      initials:
        firstText(user.initials, overview.initials, employee.initials) ||
        (name ? initials(name) : "") ||
        sessionUser?.initials ||
        "—",
      name: dash(name),
      role: dash(
        firstText(
          employment.jobTitle,
          employment.job_title,
          overview.position,
          employee.jobTitle,
          employee.job_title,
          formatRoleLabel(firstText(user.role, sessionUser?.role)),
        ),
      ),
      status: titleCaseStatus(
        firstText(overview.status, employment.status, user.status, employee.status),
      ),
      employeeId: dash(
        firstText(
          overview.employeeId,
          overview.employee_id,
          employee.employeeId,
          employee.employee_id,
          user.employeeId,
          sessionUser?.employeeId,
        ),
      ),
      department: dash(
        firstText(
          overview.department,
          employment.departmentName,
          employment.department_name,
          employment.department,
          employee.department,
        ),
      ),
      employmentType: dash(
        firstText(
          employment.employmentType,
          employment.employment_type,
          employee.employmentType,
          employee.employment_type,
        ),
      ),
      startDate: formatDisplayDate(
        firstText(
          employment.startDate,
          employment.start_date,
          employee.startDate,
          employee.hireDate,
        ),
      ),
      reportsTo: dash(
        firstText(
          overview.manager,
          employment.manager,
          employment.reportsTo,
          employment.reports_to,
        ),
      ),
      companyEmail: dash(
        firstText(
          overview.email,
          user.email,
          employee.email,
          personal.email,
          sessionUser?.email,
        ),
      ),
      personalEmail: dash(
        firstText(
          personal.personalEmail,
          personal.personal_email,
          personal.alternateEmail,
        ),
      ),
      phone: dash(
        firstText(personal.phone, overview.phone, user.phone, employee.phone),
      ),
      location: dash(
        firstText(
          personal.address,
          personal.location,
          employment.workLocation,
          employment.work_location,
          employee.address,
          employee.location,
        ),
      ),
    };
  }, [data, sessionUser]);

  const leaveBalances = useMemo(() => {
    const order = ["annual", "sick", "personal"];
    return listFrom(data?.balances ?? undefined)
      .map((record, index) => mapLeaveBalance(record, index))
      .sort((a, b) => {
        const ai = order.findIndex((key) => a.label.toLowerCase().includes(key));
        const bi = order.findIndex((key) => b.label.toLowerCase().includes(key));
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .slice(0, 3);
  }, [data?.balances]);

  const annual = leaveBalances.find((item) =>
    item.label.toLowerCase().includes("annual"),
  );

  const employmentRows = [
    { label: "Role", value: profile.role, icon: Briefcase },
    { label: "Department", value: profile.department, icon: Building2 },
    { label: "Start date", value: profile.startDate, icon: CalendarDays },
    { label: "Employment type", value: profile.employmentType },
    { label: "Reports to", value: profile.reportsTo },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.statusLine}>Loading profile…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {profile.initials}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>My profile</p>
          <h1 className={styles.title}>Your employment record</h1>
          <p className={styles.subtitle}>
            View your personal and employment details, leave balance, and
            request history.
          </p>
        </div>
        <button
          type="button"
          className={styles.editButton}
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={15} />
          Edit details
        </button>
      </div>

      <section className={styles.identityCard}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{profile.initials}</div>
          <div>
            <h2>{profile.name}</h2>
            <p>
              {[profile.role, profile.department].filter((item) => item !== "—").join(" · ") ||
                "—"}
            </p>
            <div className={styles.badges}>
              <span className={styles.activeBadge}>{profile.status}</span>
              {profile.employeeId !== "—" ? (
                <span className={styles.idBadge}>{profile.employeeId}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className={styles.annualLeave}>
          <span>Annual leave</span>
          <strong>{annual ? `${annual.remaining} days` : "—"}</strong>
        </div>
      </section>

      <div className={styles.tabs}>
        {(["Overview", "Leave", "Expenses"] as ProfileTab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? styles.tabActive : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <>
          <div className={styles.detailGrid}>
            <div className={styles.detailCol}>
              <section className={styles.card}>
                <h2>Personal details</h2>
                <ul>
                  <li>
                    <Mail size={15} />
                    <span>{profile.companyEmail}</span>
                    <em>Company</em>
                  </li>
                  <li>
                    <Mail size={15} />
                    <span>{profile.personalEmail}</span>
                  </li>
                  <li>
                    <Phone size={15} />
                    <span>{profile.phone}</span>
                  </li>
                  <li>
                    <MapPin size={15} />
                    <span>{profile.location}</span>
                  </li>
                </ul>
              </section>
              <LeaveBalance balances={leaveBalances} />
            </div>
            <section className={styles.card}>
              <h2>Employment details</h2>
              <ul className={styles.employmentList}>
                {employmentRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.label}>
                      <span>
                        {Icon ? <Icon size={15} /> : null}
                        {row.label}
                      </span>
                      <strong>{row.value}</strong>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      ) : null}

      {tab === "Leave" ? (
        <>
          <LeaveBalance balances={leaveBalances} />
          <Link href="/employee/leave" className={styles.sectionLink}>
            View leave requests →
          </Link>
        </>
      ) : null}

      {tab === "Expenses" ? (
        <section className={styles.card}>
          <h2>Expenses</h2>
          <p className={styles.empty}>Your expense claims live on My Expenses.</p>
          <Link href="/employee/expenses" className={styles.sectionLink}>
            View expense claims →
          </Link>
        </section>
      ) : null}

      <SimpleModal
        open={editOpen}
        title="Edit personal details"
        description="Update contact information on your profile."
        fields={[
          {
            name: "phone",
            label: "Phone",
            fullWidth: true,
            defaultValue: fieldValue(profile.phone),
          },
          {
            name: "personalEmail",
            label: "Personal email",
            type: "email",
            fullWidth: true,
            defaultValue: fieldValue(profile.personalEmail),
          },
          {
            name: "location",
            label: "Location",
            fullWidth: true,
            defaultValue: fieldValue(profile.location),
          },
        ]}
        submitLabel="Save changes"
        onClose={() => setEditOpen(false)}
        onSubmit={async (values) => {
          const phone = values.phone.trim();
          const personalEmail = values.personalEmail.trim();
          const location = values.location.trim();
          const body = {
            phone,
            personalEmail,
            personal_email: personalEmail,
            location,
            address: location,
          };
          await runAction("Save profile", async () => {
            try {
              await employeeApi.profile.patch(body);
            } catch {
              await employeeApi.employmentRecord.patch(body);
            }
            await refetch();
          });
        }}
      />
    </div>
  );
}

function LeaveBalance({
  balances,
}: {
  balances: ReturnType<typeof mapLeaveBalance>[];
}) {
  return (
    <section className={styles.card}>
      <h2>Leave balance</h2>
      {balances.length === 0 ? (
        <p className={styles.empty}>No leave balances yet.</p>
      ) : (
        <ul className={styles.balanceList}>
          {balances.map((balance) => (
            <li key={balance.id}>
              <div>
                <span>{balance.label}</span>
                <strong>
                  {balance.remaining} of {balance.total} left
                </strong>
              </div>
              <div className={styles.meter}>
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      (balance.used / Math.max(balance.total, 1)) * 100,
                    )}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
