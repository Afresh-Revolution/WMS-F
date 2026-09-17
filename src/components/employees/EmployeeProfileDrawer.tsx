"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Mail, MapPin, Phone, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getStaffEmployee } from "@/lib/api";
import { mapEmployee, type MappedEmployee } from "@/lib/api/mappers";
import styles from "./EmployeeProfileDrawer.module.css";

function display(value: string) {
  return value.trim() || "—";
}

type EmployeeProfileDrawerProps = {
  employee: MappedEmployee;
  onClose: () => void;
};

export function EmployeeProfileDrawer({
  employee,
  onClose,
}: EmployeeProfileDrawerProps) {
  const router = useRouter();
  const { data, loading, error } = useAsyncData(
    () => getStaffEmployee(employee.id),
    [employee.id],
  );

  const profile = useMemo(() => {
    if (!data) return employee;
    return { ...employee, ...mapEmployee(data) };
  }, [data, employee]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const locationLine = [profile.location, profile.department]
    .filter((part) => part.trim())
    .join(" · ");

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Profile</p>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close profile"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {loading ? <p className={styles.statusLine}>Loading profile…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.identity}>
          <span
            className={styles.avatar}
            style={{ background: profile.avatarColor }}
          >
            {profile.initials}
          </span>
          <div>
            <h2 id="employee-profile-title" className={styles.name}>
              {display(profile.name)}
            </h2>
            <p className={styles.title}>{display(profile.title)}</p>
          </div>
        </div>

        <span
          className={
            profile.status === "On leave" ? styles.statusLeave : styles.statusActive
          }
        >
          {profile.status}
        </span>

        <ul className={styles.details}>
          <li>
            <Mail size={16} strokeWidth={1.75} aria-hidden />
            <span>{display(profile.email)}</span>
          </li>
          <li>
            <Phone size={16} strokeWidth={1.75} aria-hidden />
            <span>{display(profile.phone)}</span>
          </li>
          <li>
            <MapPin size={16} strokeWidth={1.75} aria-hidden />
            <span>{display(locationLine)}</span>
          </li>
        </ul>

        <div className={styles.actions}>
          {profile.email ? (
            <a className={styles.message} href={`mailto:${profile.email}`}>
              <Mail size={16} strokeWidth={2} />
              Message
            </a>
          ) : (
            <button type="button" className={styles.message} disabled>
              <Mail size={16} strokeWidth={2} />
              Message
            </button>
          )}
          <button
            type="button"
            className={styles.orgChart}
            onClick={() => {
              onClose();
              router.push("/departments");
            }}
          >
            Org chart
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
