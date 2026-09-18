"use client";

import { useMemo } from "react";
import { PageDateLabel } from "@/components/layout/PageDateLabel";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Contact,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { formatRoleLabel } from "@/lib/currentUser";
import { apiRequest, asRecord, managerApi, profileApi, unwrapRecord } from "@/lib/api";
import { initials, nestedStr, str } from "@/lib/api/mappers";
import styles from "./EmployeeProfilePage.module.css";

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
  return new Date(parsed).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEmergency(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = asRecord(value);
  const name = firstText(record.name, record.fullName);
  const relationship = firstText(record.relationship, record.relation);
  const phone = firstText(record.phone, record.mobile);
  return [name, relationship, phone].filter(Boolean).join(" · ");
}

function titleCaseStatus(value: string) {
  const raw = value.trim();
  if (!raw) return "Active";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function EmployeeProfilePage() {
  const manager = useManagerPortal();
  const { user: sessionUser } = useCurrentUser();
  const { data, loading, error } = useAsyncData(async () => {
    if (manager) {
      const [profile, employment] = await Promise.all([
        managerApi.getProfile().catch(() => null),
        managerApi.getEmploymentRecord().catch(() => null),
      ]);
      return { profile, employment };
    }
    const [profile, employment] = await Promise.all([
      profileApi.get().catch(() => null),
      apiRequest<unknown>("/employee/employment-record").catch(() =>
        apiRequest<unknown>("/employee/profile").catch(() => null),
      ),
    ]);
    return { profile, employment };
  }, [manager]);

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
    const companyEmail = firstText(
      overview.email,
      user.email,
      employee.email,
      personal.email,
      sessionUser?.email,
    );
    const reportsTo = firstText(
      overview.manager,
      employment.manager,
      employment.reportsTo,
      employment.reports_to,
    );
    const emergency = formatEmergency(
      personal.emergencyContact ??
        personal.emergency_contact ??
        employee.emergencyContact ??
        employee.emergency_contact,
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
      reportsTo: dash(reportsTo),
      companyEmail: dash(companyEmail),
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
      emergencyContact: dash(emergency),
      address: dash(
        firstText(
          personal.address,
          employment.workLocation,
          employment.work_location,
          employee.address,
          employee.location,
        ),
      ),
    };
  }, [data, sessionUser]);

  const employmentDetails = [
    { label: "Employee ID", value: profile.employeeId, icon: IdCard },
    { label: "Department", value: profile.department, icon: BriefcaseBusiness },
    {
      label: "Employment type",
      value: profile.employmentType,
      icon: BriefcaseBusiness,
    },
    { label: "Start date", value: profile.startDate, icon: CalendarDays },
    { label: "Reports to", value: profile.reportsTo, icon: ShieldCheck },
  ];

  const contactDetails = [
    { label: "Company email", value: profile.companyEmail, icon: Mail },
    { label: "Personal email", value: profile.personalEmail, icon: Mail },
    { label: "Phone", value: profile.phone, icon: Phone },
    {
      label: "Emergency contact",
      value: profile.emergencyContact,
      icon: Contact,
    },
    { label: "Address", value: profile.address, icon: MapPin, wide: true },
  ];

  const settingsHref = manager ? "/manager/settings" : "/employee/settings";

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
            {profile.initials}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <p>My profile</p>
        {loading ? <p>Loading profile…</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        <h1>Your employment record</h1>
        <span>
          Your personal and employment details. To change contact details, go
          to{" "}
          <Link href={settingsHref} className={styles.inlineLink}>
            Account Settings
          </Link>
          .
        </span>
      </div>

      <div className={styles.profileGrid}>
        <section className={styles.identityCard}>
          <div className={styles.identity}>
            <div className={styles.avatar}>{profile.initials}</div>
            <h2>{profile.name}</h2>
            <p>{profile.role}</p>
            <span className={styles.activeBadge}>{profile.status}</span>
          </div>

          <div className={styles.employmentList}>
            {employmentDetails.map(({ label, value, icon: Icon }) => (
              <div key={label} className={styles.employmentRow}>
                <Icon size={15} />
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.rightColumn}>
          <section className={styles.card}>
            <h2>
              <Mail size={16} />
              Contact
            </h2>
            <div className={styles.contactGrid}>
              {contactDetails.map(({ label, value, icon: Icon, wide }) => (
                <div
                  key={label}
                  className={`${styles.contactRow} ${
                    wide ? styles.contactWide : ""
                  }`}
                >
                  <Icon size={15} />
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2>
              <BadgeCheck size={16} />
              Privacy
            </h2>
            <p className={styles.privacy}>
              This workspace only ever shows <strong>your own records.</strong>{" "}
              Colleagues&apos; information, company payroll and department-wide
              data are not accessible here. Salary details are managed by
              Accounts and are not shown.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
