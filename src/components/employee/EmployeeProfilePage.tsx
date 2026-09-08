"use client";

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
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeProfile } from "@/data/employeeHome";
import styles from "./EmployeeProfilePage.module.css";

const employmentDetails = [
  { label: "Employee ID", value: employeeProfile.employeeId, icon: IdCard },
  {
    label: "Department",
    value: employeeProfile.department,
    icon: BriefcaseBusiness,
  },
  {
    label: "Employment type",
    value: employeeProfile.employmentType,
    icon: BriefcaseBusiness,
  },
  { label: "Start date", value: employeeProfile.startDate, icon: CalendarDays },
  { label: "Reports to", value: employeeProfile.reportsTo, icon: ShieldCheck },
];

const contactDetails = [
  {
    label: "Company email",
    value: employeeProfile.companyEmail,
    icon: Mail,
  },
  {
    label: "Personal email",
    value: employeeProfile.personalEmail,
    icon: Mail,
  },
  { label: "Phone", value: employeeProfile.phone, icon: Phone },
  {
    label: "Emergency contact",
    value: employeeProfile.emergencyContact,
    icon: Contact,
  },
  { label: "Address", value: employeeProfile.address, icon: MapPin, wide: true },
];

export function EmployeeProfilePage() {
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
        <p>My profile</p>
        <h1>Your employment record</h1>
        <span>
          Your personal and employment details. To change contact details, go
          to Account Settings.
        </span>
      </div>

      <div className={styles.profileGrid}>
        <section className={styles.identityCard}>
          <div className={styles.identity}>
            <div className={styles.avatar}>{employeeProfile.initials}</div>
            <h2>{employeeProfile.name}</h2>
            <p>{employeeProfile.role}</p>
            <span className={styles.activeBadge}>{employeeProfile.status}</span>
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
