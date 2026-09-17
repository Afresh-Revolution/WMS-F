"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Layers,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  UserRound,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  nyscAccountList,
  type NyscAccountId,
} from "@/data/nyscOverview";
import { useInternAccount } from "@/hooks/useInternAccount";
import styles from "./NyscProfilePage.module.css";

export function NyscProfilePage() {
  const [accountId, setAccountId] = useState<NyscAccountId>("chidi");
  const { account, loading, error } = useInternAccount(accountId);
  const { profile } = account;

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="placement record" />
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </label>
          <Link
            href="/nysc/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/nysc/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            {account.initials}
          </Link>
        </div>
      </div>

      <header className={styles.header}>
        <p className={styles.eyebrow}>My profile</p>
        <h1 className={styles.title}>Your placement record</h1>
        <p className={styles.subtitle}>
          Your placement and contact details. To change contact details, go to{" "}
          <Link href="/nysc/account" className={styles.inlineLink}>
            Account Settings
          </Link>
          .
        </p>
      </header>

      <div className={styles.accounts} role="tablist" aria-label="Example accounts">
        <p className={styles.accountsLabel}>Example account</p>
        {nyscAccountList.map((item) => {
          const active = item.id === accountId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.accountChip} ${
                active ? styles.accountChipActive : ""
              }`}
              onClick={() => setAccountId(item.id)}
            >
              <UserRound size={15} />
              <span className={styles.accountName}>{item.name}</span>
              <span
                className={`${styles.accountType} ${
                  active
                    ? styles.accountTypeOnActive
                    : item.type === "NYSC"
                      ? styles.accountTypeNysc
                      : styles.accountTypeIntern
                }`}
              >
                {item.type}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.columns}>
        <section className={styles.card}>
          <div className={styles.identity}>
            <span className={styles.identityAvatar}>{account.initials}</span>
            <h2 className={styles.identityName}>{account.name}</h2>
            <p className={styles.identityRole}>{profile.roleTitle}</p>
            <span className={styles.statusBadge}>{profile.status}</span>
          </div>

          <ul className={styles.detailList}>
            <li>
              <span className={styles.detailIcon} aria-hidden>
                <Building2 size={15} />
              </span>
              <div>
                <p className={styles.detailLabel}>Institution</p>
                <p className={styles.detailValue}>{account.institution}</p>
              </div>
            </li>
            <li>
              <span className={styles.detailIcon} aria-hidden>
                <BookOpen size={15} />
              </span>
              <div>
                <p className={styles.detailLabel}>Course of study</p>
                <p className={styles.detailValue}>{account.course}</p>
              </div>
            </li>
            <li>
              <span className={styles.detailIcon} aria-hidden>
                <Layers size={15} />
              </span>
              <div>
                <p className={styles.detailLabel}>Placement department</p>
                <p className={styles.detailValue}>{profile.department}</p>
              </div>
            </li>
            <li>
              <span className={styles.detailIcon} aria-hidden>
                <UserRound size={15} />
              </span>
              <div>
                <p className={styles.detailLabel}>Supervisor</p>
                <p className={styles.detailValue}>{profile.supervisor}</p>
              </div>
            </li>
            <li>
              <span className={styles.detailIcon} aria-hidden>
                <CalendarDays size={15} />
              </span>
              <div>
                <p className={styles.detailLabel}>Start date</p>
                <p className={styles.detailValue}>{account.startDate}</p>
              </div>
            </li>
            <li>
              <span className={styles.detailIcon} aria-hidden>
                <CalendarDays size={15} />
              </span>
              <div>
                <p className={styles.detailLabel}>Expected end date</p>
                <p className={styles.detailValue}>
                  {account.endDate} · {account.daysToExit} days left
                </p>
              </div>
            </li>
          </ul>
        </section>

        <div className={styles.rightColumn}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Mail size={18} />
              Contact
            </h2>
            <div className={styles.contactGrid}>
              <div>
                <p className={styles.contactLabel}>
                  <Mail size={14} />
                  Company email
                </p>
                <p className={styles.contactValue}>{profile.companyEmail}</p>
              </div>
              <div>
                <p className={styles.contactLabel}>
                  <Mail size={14} />
                  Personal email
                </p>
                <p className={styles.contactValue}>{profile.personalEmail}</p>
              </div>
              <div>
                <p className={styles.contactLabel}>
                  <Phone size={14} />
                  Phone
                </p>
                <p className={styles.contactValue}>{profile.phone}</p>
              </div>
              <div>
                <p className={styles.contactLabel}>
                  <UserRound size={14} />
                  Emergency contact
                </p>
                <p className={styles.contactValue}>
                  {profile.emergencyName} · {profile.emergencyPhone}
                </p>
              </div>
              <div className={styles.contactFull}>
                <p className={styles.contactLabel}>
                  <MapPin size={14} />
                  Address
                </p>
                <p className={styles.contactValue}>{profile.address}</p>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Shield size={18} />
              Access &amp; privacy
            </h2>
            <p className={styles.privacyCopy}>
              This is a <strong>restricted placement workspace</strong>. It only
              shows your own record — tasks, meetings, progress notes and
              announcements. Payroll, salary information, financial dashboards,
              company-wide employee records, disciplinary management, system
              settings and operational reports are not accessible here.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
