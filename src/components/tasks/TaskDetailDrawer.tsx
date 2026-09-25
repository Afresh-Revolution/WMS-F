"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Task, TaskStatus } from "@/data/tasks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi } from "@/lib/api";
import { mapTask } from "@/lib/api/mappers";
import styles from "./TaskDetailDrawer.module.css";

export const taskUpdateStatuses = [
  "Not Started",
  "Pending",
  "Completed",
] as const;

export type TaskUpdateStatus = (typeof taskUpdateStatuses)[number];

const statusClass: Record<TaskStatus, string> = {
  "In Progress": styles.statusInProgress,
  "Not Started": styles.statusNotStarted,
  Overdue: styles.statusOverdue,
  Completed: styles.statusCompleted,
};

const priorityClass: Record<Task["priority"], string> = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

function toUpdateStatus(status: TaskStatus): TaskUpdateStatus {
  if (status === "Completed") return "Completed";
  if (status === "Not Started") return "Not Started";
  return "Pending";
}

function formatDueDate(value: string) {
  const text = value.trim();
  if (!text) return "—";
  const isoDay = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoDay
    ? new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]))
    : new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function loadTask(id: string, manager: boolean) {
  try {
    if (manager) return await managerApi.getTask(id);
    return await superAdminApi.tasks.get(id);
  } catch {
    return null;
  }
}

type TaskDetailDrawerProps = {
  task: Task;
  manager?: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export function TaskDetailDrawer({
  task,
  manager = false,
  onClose,
  onUpdated,
}: TaskDetailDrawerProps) {
  const { runAction } = usePageActions();
  const { data, loading, error } = useAsyncData(
    () => loadTask(task.id, manager),
    [task.id, manager],
  );

  const detail = useMemo(() => {
    if (!data) return task;
    const mapped = mapTask(data as Record<string, unknown>);
    return {
      ...task,
      ...mapped,
      title: mapped.title || task.title,
      description: mapped.description || task.description,
      assignee: mapped.assignee || task.assignee,
      department: mapped.department || task.department,
      dueDate: mapped.dueDate || task.dueDate,
      priority: mapped.priority || task.priority,
      status: mapped.status || task.status,
    };
  }, [data, task]);

  const [status, setStatus] = useState<TaskUpdateStatus>(
    toUpdateStatus(detail.status),
  );

  useEffect(() => {
    setStatus(toUpdateStatus(detail.status));
  }, [detail.id, detail.status]);

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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const apiStatus =
      status === "Not Started"
        ? "NOT_STARTED"
        : status === "Completed"
          ? "COMPLETED"
          : "PENDING";
    await runAction("Save task update", async () => {
      const body = {
        status,
        taskStatus: apiStatus,
      };
      if (manager) {
        await managerApi.updateTask(detail.id, body);
      } else {
        await superAdminApi.tasks.patch(detail.id, body);
      }
      onUpdated();
      onClose();
    });
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.head}>
          <p className={styles.eyebrow}>Task detail</p>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close task detail"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {loading ? <p className={styles.statusLine}>Loading task…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}

        <h2 id="task-detail-title" className={styles.title}>
          {detail.title}
        </h2>
        <div className={styles.badges}>
          <span className={priorityClass[detail.priority]}>
            {detail.priority} priority
          </span>
          <span className={statusClass[detail.status]}>{detail.status}</span>
        </div>

        <section className={styles.block}>
          <p className={styles.label}>Description</p>
          <p className={styles.body}>{detail.description.trim() || "—"}</p>
        </section>

        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Assignee</dt>
            <dd>{detail.assignee.trim() || "—"}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Department</dt>
            <dd>{detail.department.trim() || "—"}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Due date</dt>
            <dd>{formatDueDate(detail.dueDate)}</dd>
          </div>
        </dl>

        <form className={styles.form} onSubmit={(event) => void handleSave(event)}>
          <label className={styles.field}>
            <span className={styles.label}>Update status</span>
            <select
              className={styles.select}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as TaskUpdateStatus)
              }
            >
              {taskUpdateStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={styles.save}>
            Save update
          </button>
        </form>
      </aside>
    </div>,
    document.body,
  );
}
