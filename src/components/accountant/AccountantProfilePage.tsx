"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled, ApiError } from "@/lib/api";
import {
  asRecord,
  mapAccountantDocuments,
  mapAccountantExpense,
  mapAccountantLeaveHistory,
  mapAccountantProfile,
  unwrapAccountantData,
  unwrapAccountantList,
} from "@/lib/api/accountantMappers";
import {
  accountantProfile as fallbackProfile,
  accountantProfileTabs,
  type AccountantProfileTab,
} from "@/data/accountantProfile";
import styles from "./AccountantProfilePage.module.css";

export function AccountantProfilePage() {
  const [tab, setTab] = useState<AccountantProfileTab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const { runAction } = usePageActions();
  const titleId = useId();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [profile, employment, documents, expenses] = await Promise.all([
      accountantApi.profile.get(),
      accountantSettled(accountantApi.employmentRecord.get()),
      accountantSettled(accountantApi.employmentRecord.documents()),
      accountantSettled(accountantApi.expenses.list()),
    ]);
    return { profile, employment, documents, expenses };
  }, []);

  const profile = useMemo(
    () => mapAccountantProfile(data?.profile, data?.employment, fallbackProfile),
    [data],
  );

  const documents = useMemo(
    () => mapAccountantDocuments(data?.documents),
    [data],
  );
  const leaveHistory = useMemo(() => {
    const employment = asRecord(unwrapAccountantData(data?.employment));
    return mapAccountantLeaveHistory(
      employment.leave ?? employment.leaveHistory ?? employment.requests,
    );
  }, [data]);
  const expenses = useMemo(
    () => unwrapAccountantList(data?.expenses).map(mapAccountantExpense),
    [data],
  );

  useEffect(() => {
    if (!editOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setEditOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editOpen]);

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").trim();
    const personalEmail = String(form.get("personalEmail") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();

    await runAction(
      "Update profile",
      async () => {
        try {
          await accountantApi.profile.patch({
            phone,
            personalEmail,
            location,
          });
        } catch (err) {
          if (!(err instanceof ApiError) || err.status !== 404) throw err;
          await accountantApi.profile.put({
            phone,
            personalEmail,
            location,
          });
        }
        try {
          await accountantApi.employmentRecord.patch({
            phone,
            personalEmail,
            location,
          });
        } catch (err) {
          if (!(err instanceof ApiError) || err.status !== 404) throw err;
          await accountantApi.employmentRecord.put({
            phone,
            personalEmail,
            location,
          });
        }
        refetch();
        setEditOpen(false);
      },
      "Profile details updated",
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="profile" />
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
            href="/accountant/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/accountant/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            {profile.initials}
          </Link>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>My profile</p>
          <h1 className={styles.title}>Your employment record</h1>
          <p className={styles.subtitle}>
            View your personal and employment details, leave balance, and request
            history.
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

      <section className={styles.heroCard}>
        <div className={styles.heroMain}>
          <span className={styles.heroAvatar}>{profile.initials}</span>
          <div>
            <h2 className={styles.heroName}>{profile.name}</h2>
            <p className={styles.heroRole}>
              {profile.jobTitle} · {profile.department}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.statusBadge}>{profile.status}</span>
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
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Profile sections">
        {accountantProfileTabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={`${styles.tab} ${tab === item ? styles.tabActive : ""}`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className={styles.overviewGrid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Personal details</h3>
            <ul className={styles.detailList}>
              <li>
                <Mail size={15} />
                <span>
                  {profile.personal.companyEmail}
                  <span className={styles.companyBadge}>Company</span>
                </span>
              </li>
              <li>
                <Mail size={15} />
                <span>{profile.personal.personalEmail}</span>
              </li>
              <li>
                <Phone size={15} />
                <span>{profile.personal.phone}</span>
              </li>
              <li>
                <MapPin size={15} />
                <span>{profile.personal.location}</span>
              </li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Employment details</h3>
            <ul className={styles.detailList}>
              <li>
                <Briefcase size={15} />
                <span>
                  <strong>Role</strong>
                  {profile.employment.role}
                </span>
              </li>
              <li>
                <Building2 size={15} />
                <span>
                  <strong>Department</strong>
                  {profile.employment.department}
                </span>
              </li>
              <li>
                <Calendar size={15} />
                <span>
                  <strong>Start date</strong>
                  {profile.employment.startDate || "—"}
                </span>
              </li>
              <li>
                <UserRound size={15} />
                <span>
                  <strong>Employment type</strong>
                  {profile.employment.type}
                </span>
              </li>
              <li>
                <UserRound size={15} />
                <span>
                  <strong>Reports to</strong>
                  {profile.employment.reportsTo || "—"}
                </span>
              </li>
            </ul>
          </article>

          <article className={`${styles.card} ${styles.leaveCard}`}>
            <h3 className={styles.cardTitle}>Documents</h3>
            {documents.length === 0 ? (
              <p className={styles.listMeta}>No documents on your employment record.</p>
            ) : (
              <ul className={styles.detailList}>
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <span>
                      <strong>{doc.name}</strong>
                      {[doc.type, doc.date].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      ) : null}

      {tab === "Leave" ? (
        <div className={styles.listCard}>
          {leaveHistory.length === 0 ? (
            <p className={styles.listMeta}>No leave history on your employment record.</p>
          ) : (
            leaveHistory.map((item) => (
            <article key={item.id} className={styles.listRow}>
              <div>
                <h3 className={styles.listTitle}>{item.type}</h3>
                <p className={styles.listMeta}>
                  {item.dates} · {item.days}
                </p>
              </div>
              <span className={styles.listStatus}>{item.status}</span>
            </article>
            ))
          )}
        </div>
      ) : null}

      {tab === "Expenses" ? (
        <div className={styles.listCard}>
          {expenses.length === 0 ? (
            <p className={styles.listMeta}>No expenses returned for your account.</p>
          ) : (
            expenses.map((item) => (
            <article key={item.id} className={styles.listRow}>
              <div>
                <h3 className={styles.listTitle}>
                  {item.ref} · {item.category}
                </h3>
                <p className={styles.listMeta}>
                  {item.note} · {item.date}
                </p>
              </div>
              <div className={styles.listAside}>
                <strong>{item.amountLabel}</strong>
                <span className={styles.listStatus}>{item.status}</span>
              </div>
            </article>
            ))
          )}
        </div>
      ) : null}

      {editOpen ? (
        <div
          className={styles.backdrop}
          onClick={() => setEditOpen(false)}
          role="presentation"
        >
          <div
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <button
              type="button"
              className={styles.close}
              onClick={() => setEditOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h2 id={titleId} className={styles.modalTitle}>
              Edit details
            </h2>
            <p className={styles.modalDescription}>
              Update your contact details for {profile.name}.
            </p>
            <form className={styles.form} onSubmit={(event) => void handleEdit(event)}>
              <label className={styles.field}>
                <span>Phone</span>
                <input name="phone" defaultValue={profile.personal.phone} />
              </label>
              <label className={styles.field}>
                <span>Personal email</span>
                <input
                  name="personalEmail"
                  type="email"
                  defaultValue={profile.personal.personalEmail}
                />
              </label>
              <label className={styles.field}>
                <span>Location</span>
                <input
                  name="location"
                  defaultValue={profile.personal.location}
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.save}>
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
