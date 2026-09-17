"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlarmClock,
  Bell,
  Check,
  Link2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import {
  PROTOTYPE_TODAY,
  managedReminders as fallbackReminders,
  reminderFilterFromPath,
  reminderFilterHrefs,
  reminderFilters,
  type ManagedReminder,
  type ReminderChannel,
  type ReminderFilter,
} from "@/data/secretary";
import styles from "./SecretaryRemindersPage.module.css";

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function whenFromDate(date: string): string {
  const event = parseDay(date);
  const today = parseDay(PROTOTYPE_TODAY);
  const diff = Math.round(
    (event.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Yesterday";
  return `${Math.abs(diff)} days ago`;
}

function formatDateLabel(date: string): string {
  return parseDay(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  if (!value) return "9:00 AM";
  if (/AM|PM/i.test(value)) return value;
  const [hours, minutes] = value.split(":").map(Number);
  const meridian = hours >= 12 ? "PM" : "AM";
  const hour = ((hours + 11) % 12) + 1;
  return `${hour}:${String(minutes ?? 0).padStart(2, "0")} ${meridian}`;
}

function mapChannel(value: unknown): ReminderChannel {
  const raw = str(value).toLowerCase();
  if (raw.includes("both")) return "Both";
  if (raw.includes("email") || raw.includes("mail")) return "Email";
  return "In-app";
}

function mapReminder(
  record: Record<string, unknown>,
  index: number,
): ManagedReminder {
  const scheduledAt =
    record.scheduledAt ?? record.scheduled_at ?? record.date ?? record.day;
  const date = str(scheduledAt, PROTOTYPE_TODAY).slice(0, 10);
  const link = str(
    record.link ??
      record.relatedTitle ??
      record.related ??
      record.task,
  );
  const status = str(record.status).toUpperCase();
  return {
    id: str(record.id, String(index + 1)),
    title: str(record.title ?? record.name),
    date,
    time: formatTime(
      str(
        record.time,
        scheduledAt
          ? new Date(str(scheduledAt)).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "9:00 AM",
      ),
    ),
    when: str(record.when, whenFromDate(date)),
    dateLabel: str(record.dateLabel, formatDateLabel(date)),
    channel: mapChannel(record.channel ?? record.notify),
    link: link || undefined,
    linkHref: str(record.linkHref ?? record.href) || undefined,
    due: Boolean(record.due ?? record.overdue),
    done:
      Boolean(record.done ?? record.completed) ||
      status === "SENT" ||
      status === "CANCELLED",
  };
}

function matchesFilter(
  reminder: ManagedReminder,
  filter: ReminderFilter,
): boolean {
  if (filter === "All") return true;
  if (filter === "Done") return Boolean(reminder.done);
  return !reminder.done;
}

const channelClass: Record<ReminderChannel, string> = {
  Both: styles.channelBoth,
  "In-app": styles.channelInApp,
  Email: styles.channelEmail,
};

const emptyForm = {
  title: "",
  when: "",
  link: "",
  channel: "In-app",
};

export function SecretaryRemindersPage() {
  const { runAction } = usePageActions();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const activeFilter = reminderFilterFromPath(pathname);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [created, setCreated] = useState<ManagedReminder[]>([]);
  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.listReminders(),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") closeCreate();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!createOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [createOpen]);

  const reminders = useMemo((): ManagedReminder[] => {
    const records = Array.isArray(data)
      ? data
      : listFrom((data ?? undefined) as never);
    const mapped =
      data === null
        ? fallbackReminders
        : records.map((record, index) => mapReminder(record, index));
    return [...mapped, ...created].map((reminder) =>
      doneIds[reminder.id]
        ? { ...reminder, done: true, due: false }
        : reminder,
    );
  }, [created, data, doneIds]);

  const stats = useMemo(() => {
    const active = reminders.filter((item) => !item.done).length;
    const dueNow = reminders.filter((item) => item.due && !item.done).length;
    const completed = reminders.filter((item) => item.done).length;
    return [
      {
        id: "active",
        label: "Active reminders",
        value: String(active),
        tag: "Pending",
        tone: "soft" as const,
      },
      {
        id: "due",
        label: "Due now",
        value: String(dueNow),
        tag: "Overdue",
        tone: "danger" as const,
      },
      {
        id: "done",
        label: "Completed",
        value: String(completed),
        tag: "Done",
        tone: "muted" as const,
      },
    ];
  }, [reminders]);

  const filtered = useMemo(
    () => reminders.filter((item) => matchesFilter(item, activeFilter)),
    [activeFilter, reminders],
  );

  function closeCreate() {
    setCreateOpen(false);
    setForm(emptyForm);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [datePart = PROTOTYPE_TODAY, timePart = ""] = form.when.split("T");
    const date = datePart.slice(0, 10);
    const today = parseDay(PROTOTYPE_TODAY);
    const due = parseDay(date).getTime() <= today.getTime();
    const next: ManagedReminder = {
      id: `new-${Date.now()}`,
      title: form.title.trim(),
      date,
      time: formatTime(timePart),
      when: whenFromDate(date),
      dateLabel: formatDateLabel(date),
      channel: mapChannel(form.channel),
      link: form.link.trim() || undefined,
      due,
    };
    await runAction("Set reminder", async () => {
      await secretaryApi.createReminder({
        title: next.title,
        scheduledAt: new Date(form.when).toISOString(),
        channel: form.channel.toUpperCase().replace("-", "_"),
        relatedType: form.link.trim() ? "OTHER" : undefined,
        relatedTitle: form.link.trim() || undefined,
        status: "PENDING",
      });
      setCreated((current) => [...current, next]);
    });
    closeCreate();
  }

  async function handleDone(reminder: ManagedReminder) {
    await runAction("Done", async () => {
      await secretaryApi.updateReminder(reminder.id, { status: "SENT" });
      setDoneIds((current) => ({ ...current, [reminder.id]: true }));
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        {loading ? <p className={styles.dateLabel}>Loading reminders…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Using cached reminders — {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search"
              className={styles.searchInput}
            />
            <kbd className={styles.shortcut}>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton}>
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </NotificationsLink>
          <ProfileLink className={styles.avatarChip}>GB</ProfileLink>
        </div>
      </div>

      <div className={styles.hero}>
        <div>
          <p className={styles.breadcrumb}>Secretary • Reminders</p>
          <h1 className={styles.title}>Reminders</h1>
          <p className={styles.subtitle}>
            Configure and manage reminders for meetings, tasks and follow-ups.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => {
            setForm(emptyForm);
            setCreateOpen(true);
          }}
        >
          <Plus size={16} />
          New reminder
        </button>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span
              className={
                stat.tone === "danger"
                  ? styles.statTagDanger
                  : stat.tone === "muted"
                    ? styles.statTagMuted
                    : styles.statTagSoft
              }
            >
              {stat.tag}
            </span>
          </article>
        ))}
      </div>

      <div className={styles.filters} role="tablist" aria-label="Reminder filters">
        {reminderFilters.map((filter) => {
          const active = activeFilter === filter;
          return (
            <Link
              key={filter}
              href={reminderFilterHrefs[filter]}
              role="tab"
              aria-selected={active}
              className={`${styles.filterChip} ${
                active ? styles.filterChipActive : ""
              }`}
            >
              {filter}
            </Link>
          );
        })}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No reminders</p>
        ) : (
          filtered.map((reminder) => (
            <article key={reminder.id} className={styles.listRow}>
              <span className={styles.rowIcon}>
                <AlarmClock size={16} />
              </span>
              <div className={styles.rowBody}>
                <h2 className={styles.name}>{reminder.title}</h2>
                <p className={styles.when}>
                  {reminder.when} · {reminder.dateLabel} · {reminder.time}
                </p>
                <div className={styles.meta}>
                  {reminder.link ? (
                    reminder.linkHref ? (
                      <Link href={reminder.linkHref} className={styles.related}>
                        <Link2 size={13} />
                        {reminder.link}
                      </Link>
                    ) : (
                      <span className={styles.related}>
                        <Link2 size={13} />
                        {reminder.link}
                      </span>
                    )
                  ) : null}
                  <span className={channelClass[reminder.channel]}>
                    {reminder.channel}
                  </span>
                </div>
              </div>
              <div className={styles.rowEnd}>
                {reminder.due && !reminder.done ? (
                  <span className={styles.dueTag}>Due</span>
                ) : null}
                {reminder.done ? (
                  <span className={styles.doneTag}>Done</span>
                ) : (
                  <button
                    type="button"
                    className={styles.doneButton}
                    onClick={() => void handleDone(reminder)}
                  >
                    <Check size={14} />
                    Done
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {createOpen ? (
        <div
          className={styles.modalBackdrop}
          onClick={closeCreate}
          role="presentation"
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-reminder-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id="create-reminder-title" className={styles.modalTitle}>
                Create reminder
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close"
                onClick={closeCreate}
              >
                <X size={16} />
              </button>
            </div>
            <p className={styles.modalCopy}>
              Set a reminder for a meeting, task or follow-up.
            </p>
            <form className={styles.modalForm} onSubmit={handleCreate}>
              <label className={styles.modalField}>
                <span>
                  Title <em>*</em>
                </span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Send board pack to Admin"
                  required
                />
              </label>
              <label className={styles.modalField}>
                <span>
                  When <em>*</em>
                </span>
                <input
                  type="datetime-local"
                  value={form.when}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      when: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className={styles.modalField}>
                <span>Linked to (optional)</span>
                <input
                  value={form.link}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      link: event.target.value,
                    }))
                  }
                  placeholder="Meeting or task name"
                />
              </label>
              <label className={styles.modalField}>
                <span>Channel</span>
                <select
                  value={form.channel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      channel: event.target.value,
                    }))
                  }
                >
                  <option>In-app</option>
                  <option>Email</option>
                  <option>Both</option>
                </select>
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={closeCreate}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSave}>
                  <Bell size={15} />
                  Set reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
