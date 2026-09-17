"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  Search,
  UserRound,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useInternAccount } from "@/hooks/useInternAccount";
import { usePageActions } from "@/hooks/usePageActions";
import {
  nyscAccountList,
  nyscTaskFilters,
  type NyscAccountId,
  type NyscTask,
  type NyscTaskFilter,
  type NyscTaskPriority,
  type NyscTaskStatus,
} from "@/data/nyscOverview";
import { internApi, internSettled } from "@/lib/api";
import {
  mapInternTask,
  mappedOrFallback,
  toInternTaskStatus,
  unwrapInternList,
} from "@/lib/api/internMappers";
import styles from "./NyscTasksPage.module.css";

const statusClass: Record<NyscTaskStatus, string> = {
  "In Progress": styles.statusProgress,
  Overdue: styles.statusOverdue,
  "Not Started": styles.statusNotStarted,
  "In Review": styles.statusReview,
  Completed: styles.statusCompleted,
};

const priorityClass: Record<NyscTaskPriority, string> = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

const statusOptions = [
  { label: "Not Started", value: "Not Started" },
  { label: "In Progress", value: "In Progress" },
  { label: "In Review", value: "In Review" },
  { label: "Overdue", value: "Overdue" },
  { label: "Completed", value: "Completed" },
];

export function NyscTasksPage() {
  const [accountId, setAccountId] = useState<NyscAccountId>("chidi");
  const [filter, setFilter] = useState<NyscTaskFilter>("All");
  const [editing, setEditing] = useState<NyscTask | null>(null);
  const { runAction } = usePageActions();
  const { account, loading, error } = useInternAccount(accountId);
  const {
    data: tasksPayload,
    loading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useAsyncData(() => internSettled(internApi.tasks.list()), []);

  const remoteTasks = useMemo(
    () => unwrapInternList(tasksPayload).map(mapInternTask),
    [tasksPayload],
  );
  const [localTasks, setLocalTasks] = useState<NyscTask[] | null>(null);
  const tasks = localTasks ?? mappedOrFallback(tasksPayload, remoteTasks, account.tasks);
  const visible = useMemo(
    () =>
      filter === "All" ? tasks : tasks.filter((task) => task.status === filter),
    [filter, tasks],
  );

  async function handleUpdate(values: Record<string, string>) {
    if (!editing) return;
    const progress = Math.min(
      100,
      Math.max(0, Number(values.progress) || 0),
    );
    const nextStatus = (
      progress >= 100 ? "Completed" : values.status
    ) as NyscTaskStatus;
    const note = values.note?.trim();

    await runAction(
      "Update progress",
      async () => {
        if (tasksPayload) {
          await internApi.tasks.updateProgress(editing.id, {
            progress,
            status: toInternTaskStatus(nextStatus),
            ...(note ? { note } : {}),
          });
          refetchTasks();
        } else {
          setLocalTasks(
            tasks.map((task) =>
              task.id === editing.id
                ? { ...task, progress, status: nextStatus }
                : task,
            ),
          );
        }
        setEditing(null);
      },
      "Task progress updated",
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading || tasksLoading}
        error={error || tasksError}
        resource="tasks"
      />
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
        <p className={styles.eyebrow}>My tasks</p>
        <h1 className={styles.title}>Assigned to me</h1>
        <p className={styles.subtitle}>
          Track the tasks your supervisor has assigned and keep your progress up
          to date.
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
              onClick={() => {
                setAccountId(item.id);
                setLocalTasks(null);
              }}
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

      <div className={styles.filters} role="tablist" aria-label="Task status">
        {nyscTaskFilters.map((item) => {
          const active = item === filter;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.filter} ${
                active
                  ? item === "All"
                    ? styles.filterActiveAll
                    : styles.filterActive
                  : ""
              }`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className={styles.list}>
        {visible.map((task) => (
          <article key={task.id} className={styles.taskCard}>
            <div className={styles.taskMain}>
              <div className={styles.taskHead}>
                <h2 className={styles.taskTitle}>{task.title}</h2>
                <span className={`${styles.priority} ${priorityClass[task.priority]}`}>
                  {task.priority}
                </span>
                <span className={`${styles.status} ${statusClass[task.status]}`}>
                  {task.status}
                </span>
              </div>
              <p className={styles.taskDescription}>{task.description}</p>
              <p className={styles.taskMeta}>
                <span>
                  <UserRound size={13} />
                  Assigned by {task.assignee}
                </span>
                <span>
                  <Clock size={13} />
                  {task.due}
                  {task.dueMeta ? ` · ${task.dueMeta}` : ""}
                </span>
              </p>
              <div className={styles.progressTrack} aria-hidden>
                <div
                  className={styles.progressFill}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              className={styles.updateButton}
              onClick={() => setEditing(task)}
            >
              Update progress
            </button>
          </article>
        ))}
      </div>

      <div className={styles.prototypeWrap}>
        <span className={styles.prototypeChip}>
          <UserRound size={13} />
          Prototype: NYSC / Intern
        </span>
      </div>

      <SimpleModal
        key={editing?.id ?? "closed"}
        open={Boolean(editing)}
        title="Update progress"
        description={
          editing
            ? `Record how far you have gotten on “${editing.title}”.`
            : undefined
        }
        submitLabel="Save progress"
        fields={
          editing
            ? [
                {
                  name: "progress",
                  label: "Progress (%)",
                  type: "number",
                  required: true,
                  defaultValue: String(editing.progress),
                },
                {
                  name: "status",
                  label: "Status",
                  type: "select",
                  required: true,
                  defaultValue: editing.status,
                  options: statusOptions,
                },
                {
                  name: "note",
                  label: "Note (optional)",
                  type: "textarea",
                  placeholder: "What did you complete?",
                },
              ]
            : []
        }
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
