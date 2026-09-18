"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Mail,
  MinusCircle,
  MoreVertical,
  Search,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import {
  avatarColor,
  initials,
  listFrom,
  nestedStr,
  str,
} from "@/lib/api/mappers";
import {
  directoryFilters,
  directoryMailboxes as fallbackMailboxes,
  directoryStats as fallbackStats,
  type DirectoryMailbox,
  type DirectoryStat,
  type MailboxFilter,
  type MailboxStatus,
} from "@/data/secretary";
import styles from "./SecretaryEmailDirectoryPage.module.css";

const statusClass: Record<MailboxStatus, string> = {
  Active: styles.statusActive,
  Suspended: styles.statusSuspended,
  "Deactivation Pending": styles.statusPending,
  Deactivated: styles.statusDeactivated,
};

function mapStatus(value: unknown): MailboxStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("deactiv") && raw.includes("pending")) {
    return "Deactivation Pending";
  }
  if (raw.includes("deactiv")) return "Deactivated";
  if (raw.includes("suspend") || raw.includes("hold")) return "Suspended";
  return "Active";
}

function mapMailbox(record: Record<string, unknown>): DirectoryMailbox {
  const employee = record.employee;
  const name = str(
    record.name ?? record.employeeName,
    nestedStr(employee, ["name", "fullName"]),
  );
  return {
    id: str(record.id),
    name,
    initials: str(record.initials, initials(name)),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    email: str(
      record.email ?? record.address ?? record.emailAddress,
      nestedStr(employee, ["companyEmail", "email"]),
    ),
    department: nestedStr(
      record.department ??
        (employee as Record<string, unknown> | undefined)?.department,
    ),
    storage: str(
      record.storage ?? record.storageUsed ?? record.usage,
      "0.0 GB",
    ),
    since: str(
      record.since ?? record.createdAt ?? record.activeSince ?? record.activatedAt,
    ),
    status: mapStatus(record.status),
  };
}

type DirectoryAction = {
  id: "edit" | "suspend" | "deactivate" | "reactivate" | "cancel-deactivation";
  label: string;
  icon: LucideIcon;
  danger?: boolean;
};

function actionsFor(status: MailboxStatus): DirectoryAction[] {
  const edit: DirectoryAction = {
    id: "edit",
    label: "Edit address",
    icon: Mail,
  };
  const suspend: DirectoryAction = {
    id: "suspend",
    label: "Suspend mailbox",
    icon: MinusCircle,
  };
  const deactivate: DirectoryAction = {
    id: "deactivate",
    label: "Request deactivation",
    icon: UserMinus,
    danger: true,
  };
  const reactivate: DirectoryAction = {
    id: "reactivate",
    label: "Reactivate mailbox",
    icon: UserPlus,
  };
  if (status === "Suspended") return [edit, reactivate, deactivate];
  if (status === "Deactivation Pending") return [edit];
  if (status === "Deactivated") return [edit, reactivate];
  return [edit, suspend, deactivate];
}

export function SecretaryEmailDirectoryPage({
  initialFilter = "All",
}: {
  initialFilter?: MailboxFilter;
}) {
  const { runAction } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<MailboxFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editMailbox, setEditMailbox] = useState<DirectoryMailbox | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [emailOverrides, setEmailOverrides] = useState<Record<string, string>>(
    {},
  );

  const { data, loading, error, refetch } = useAsyncData(
    () => secretaryApi.listEmailDirectory(),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setMenuId(null);
        setEditMailbox(null);
        setEditEmail("");
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const menus = document.querySelectorAll("[data-directory-menu]");
      for (const menu of menus) {
        if (menu.contains(target)) return;
      }
      setMenuId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!editMailbox) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editMailbox]);

  const mailboxes = useMemo((): DirectoryMailbox[] => {
    const records = Array.isArray(data)
      ? data
      : listFrom((data ?? undefined) as never);
    const mapped =
      data === null
        ? fallbackMailboxes
        : records.map((record) => mapMailbox(record));
    return mapped.map((mailbox) =>
      emailOverrides[mailbox.id]
        ? { ...mailbox, email: emailOverrides[mailbox.id] }
        : mailbox,
    );
  }, [data, emailOverrides]);

  const stats = useMemo((): DirectoryStat[] => {
    const counts: Record<MailboxFilter, number> = {
      All: mailboxes.length,
      Active: mailboxes.filter((item) => item.status === "Active").length,
      Suspended: mailboxes.filter((item) => item.status === "Suspended").length,
      "Deactivation Pending": mailboxes.filter(
        (item) => item.status === "Deactivation Pending",
      ).length,
      Deactivated: mailboxes.filter((item) => item.status === "Deactivated")
        .length,
    };
    return fallbackStats.map((stat) => ({
      ...stat,
      value: String(counts[stat.filter]),
    }));
  }, [mailboxes]);

  const filteredMailboxes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return mailboxes.filter((mailbox) => {
      const matchesFilter =
        activeFilter === "All" || mailbox.status === activeFilter;
      const haystack =
        `${mailbox.email} ${mailbox.name} ${mailbox.department}`.toLowerCase();
      return matchesFilter && haystack.includes(needle);
    });
  }, [activeFilter, mailboxes, query]);

  async function runMailboxAction(
    mailbox: DirectoryMailbox,
    action: DirectoryAction["id"],
  ) {
    setMenuId(null);
    if (action === "edit") {
      setEditMailbox(mailbox);
      setEditEmail(mailbox.email);
      return;
    }
    const labels: Record<DirectoryAction["id"], string> = {
      edit: "Edit address",
      suspend: "Suspend mailbox",
      deactivate: "Request deactivation",
      reactivate: "Reactivate mailbox",
      "cancel-deactivation": "Cancel deactivation",
    };
    await runAction(labels[action], async () => {
      if (action === "suspend") await secretaryApi.suspendMailbox(mailbox.id);
      else if (action === "reactivate") {
        await secretaryApi.reactivateMailbox(mailbox.id);
      } else if (action === "deactivate") {
        await secretaryApi.deactivateMailbox(mailbox.id);
      }
    });
    refetch();
  }

  function closeEditModal() {
    setEditMailbox(null);
    setEditEmail("");
  }

  async function handleEditAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editMailbox) return;
    const nextEmail = editEmail.trim().toLowerCase();
    await runAction(
      "Edit address",
      async () => {
        await secretaryApi.updateMailbox(editMailbox.id, { email: nextEmail });
        setEmailOverrides((current) => ({
          ...current,
          [editMailbox.id]: nextEmail,
        }));
      },
      `${nextEmail} updated`,
    );
    closeEditModal();
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        {loading ? <p className={styles.dateLabel}>Loading directory…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Using cached directory — {error}
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

      <p className={styles.breadcrumb}>Secretary — Company email directory</p>
      <h1 className={styles.title}>Company email directory</h1>
      <p className={styles.subtitle}>
        All provisioned company mailboxes. Edit, suspend, reactivate or
        deactivate addresses.
      </p>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <button
            key={stat.id}
            type="button"
            className={`${styles.statCard} ${
              activeFilter === stat.filter ? styles.statCardActive : ""
            }`}
            onClick={() => setActiveFilter(stat.filter)}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span
              className={
                stat.tone === "action"
                  ? styles.statTagAction
                  : stat.tone === "muted"
                    ? styles.statTagMuted
                    : styles.statTagSoft
              }
            >
              {stat.tag}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.listSearch}>
          <Search size={15} className={styles.searchIcon} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search address, name or department..."
            className={styles.searchInput}
          />
        </label>
        <div className={styles.filters} role="tablist" aria-label="Mailbox filters">
          {directoryFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <section className={styles.listSection}>
        <div className={styles.list}>
          {filteredMailboxes.map((mailbox) => (
            <article key={mailbox.id} className={styles.listRow}>
              <span
                className={styles.avatar}
                style={{ background: mailbox.avatarColor }}
              >
                {mailbox.initials}
              </span>
              <div className={styles.rowBody}>
                <div className={styles.titleRow}>
                  <h2 className={styles.email}>{mailbox.email}</h2>
                  <span className={statusClass[mailbox.status]}>
                    {mailbox.status}
                  </span>
                </div>
                <p className={styles.meta}>
                  {mailbox.name} · {mailbox.department} · {mailbox.storage} ·
                  since {mailbox.since}
                </p>
              </div>
              <div className={styles.actionMenu} data-directory-menu>
                <button
                  type="button"
                  className={styles.menuButton}
                  aria-label={`Actions for ${mailbox.email}`}
                  aria-expanded={menuId === mailbox.id}
                  onClick={() =>
                    setMenuId((current) =>
                      current === mailbox.id ? null : mailbox.id,
                    )
                  }
                >
                  <MoreVertical size={16} />
                </button>
                {menuId === mailbox.id ? (
                  <div className={styles.dropdown} role="menu">
                    {actionsFor(mailbox.status).map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          role="menuitem"
                          className={`${styles.dropdownItem} ${
                            action.danger ? styles.dropdownDanger : ""
                          }`}
                          onClick={() =>
                            void runMailboxAction(mailbox, action.id)
                          }
                        >
                          <Icon size={15} />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {filteredMailboxes.length === 0 ? (
            <div className={styles.empty}>No mailboxes match this filter.</div>
          ) : null}
        </div>
      </section>

      {editMailbox ? (
        <div
          className={styles.modalBackdrop}
          onClick={closeEditModal}
          role="presentation"
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-email-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id="edit-email-title" className={styles.modalTitle}>
                Edit company email
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close"
                onClick={closeEditModal}
              >
                <X size={16} />
              </button>
            </div>
            <p className={styles.modalCopy}>
              Update the mailbox address for {editMailbox.name}.
            </p>
            <form className={styles.modalForm} onSubmit={handleEditAddress}>
              <label className={styles.modalField}>
                <span>Email address</span>
                <input
                  type="email"
                  name="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  required
                  autoComplete="off"
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSave}>
                  <Mail size={15} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
