"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Search, UserRound, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi } from "@/lib/api";
import { listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import type { EmployeeTaskStatus } from "@/data/employeeHome";
import styles from "./EmployeeTasksPage.module.css";

type TaskFilter = "All" | "In Progress" | "In Review" | "Overdue" | "Completed";

type EmployeeTask = {
  id: string;
  title: string;
  priority: string;
  status: string;
  description: string;
  assignedBy: string;
  due: string;
  timing: string;
  progress: number;
};

const filters: TaskFilter[] = [
  "All",
  "In Progress",
  "In Review",
  "Overdue",
  "Completed",
];

function mapStatus(value: unknown): EmployeeTaskStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("overdue")) return "Overdue";
  if (raw.includes("review")) return "In Review";
  if (raw.includes("progress") || raw.includes("active")) return "In Progress";
  if (raw.includes("complete") || raw.includes("done")) return "Completed";
  return "Not Started";
}

function mapPriority(value: unknown): string {
  const raw = str(value).toLowerCase();
  if (raw.includes("high")) return "High";
  if (raw.includes("low")) return "Low";
  return raw ? str(value) : "Medium";
}

function formatDue(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function timingFromDue(value: unknown, status: EmployeeTaskStatus): string {
  const date = new Date(str(value));
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.round(
    (date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (24 * 60 * 60 * 1000),
  );
  if (status === "Completed") return "";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  return `${diff}d left`;
}

function mapTask(record: Record<string, unknown>, index: number): EmployeeTask {
  const due = str(record.dueDate ?? record.due_date ?? record.due);
  const status = mapStatus(record.status);
  return {
    id: str(record.id, String(index + 1)),
    title: str(record.title ?? record.name),
    priority: mapPriority(record.priority),
    status,
    description: str(record.description ?? record.detail),
    assignedBy: nestedStr(
      record.assignedBy ?? record.createdBy ?? record.owner,
      ["name", "fullName"],
      "",
    ),
    due: formatDue(due),
    timing: timingFromDue(due, status),
    progress: num(record.progress ?? record.percent, 0),
  };
}

function priorityClass(priority: string) {
  if (priority === "High") return styles.priorityHigh;
  if (priority === "Low") return styles.priorityLow;
  return styles.priorityMedium;
}

function statusClass(status: string) {
  if (status === "Completed") return styles.statusCompleted;
  if (status === "Overdue") return styles.statusOverdue;
  if (status === "In Review") return styles.statusReview;
  if (status === "In Progress") return styles.statusProgress;
  return styles.statusNotStarted;
}

export function EmployeeTasksPage({
  initialFilter = "All",
}: {
  initialFilter?: TaskFilter;
}) {
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [draftStatus, setDraftStatus] = useState("In Progress");
  const [draftProgress, setDraftProgress] = useState(0);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => employeeApi.tasks.list({ limit: 50 }),
    [],
  );

  useEffect(() => {
    if (!selectedTask) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedTask(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedTask]);

  const tasks = useMemo(() => {
    const records = listFrom((data ?? undefined) as never);
    return records
      .map((record, index) => mapTask(record, index))
      .filter((task) => filter === "All" || task.status === filter);
  }, [data, filter]);

  async function updateProgress(values: Record<string, string>) {
    if (!selectedTask) return;
    await runAction(
      "Update task",
      async () => {
        await employeeApi.tasks.updateProgress(selectedTask.id, {
          status: values.status,
          progress: Number(values.progress),
        });
        refetch();
      },
      "Task progress updated",
    );
  }

  function openProgress(task: EmployeeTask) {
    setSelectedTask(task);
    setDraftStatus(task.status);
    setDraftProgress(task.progress);
  }

  async function handleProgressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await updateProgress({
        status: draftStatus,
        progress: String(draftProgress),
      });
      setSelectedTask(null);
    } catch {
      // runAction displays the API error.
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading tasks…</p> : null}
        {error ? (
          <p className={styles.empty} role="alert">
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
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <p>My tasks</p>
        <h1>Assigned to me</h1>
        <span>Track your tasks and keep your progress up to date.</span>
      </div>

      <div className={styles.filters}>
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            className={filter === item ? styles.filterActive : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className={styles.taskList}>
        {tasks.length === 0 ? (
          <p className={styles.empty}>No tasks in this view.</p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className={styles.taskCard}>
              <div className={styles.taskTop}>
                <div className={styles.taskTitle}>
                  <h2>{task.title}</h2>
                  <span className={`${styles.badge} ${priorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`${styles.badge} ${statusClass(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.updateButton}
                  onClick={() => openProgress(task)}
                >
                  Update progress
                </button>
              </div>
              <p className={styles.description}>{task.description}</p>
              <div className={styles.meta}>
                {task.assignedBy ? (
                  <span>
                    <UserRound size={12} />
                    Assigned by {task.assignedBy}
                  </span>
                ) : null}
                {task.due ? (
                  <span>
                    <CalendarDays size={12} />
                    Due {task.due}
                  </span>
                ) : null}
                {task.timing ? <span>{task.timing}</span> : null}
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label={`${task.title} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={task.progress}
              >
                <span style={{ width: `${task.progress}%` }} />
              </div>
            </article>
          ))
        )}
      </section>

      {selectedTask ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setSelectedTask(null)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-progress-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              aria-label="Close"
              onClick={() => setSelectedTask(null)}
            >
              <X size={16} />
            </button>
            <h2 id="update-progress-title">Update progress</h2>
            <p>{selectedTask.title}</p>
            <form onSubmit={handleProgressSubmit}>
              <label className={styles.modalField}>
                <span>Status</span>
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value)}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>In Review</option>
                  <option>Completed</option>
                </select>
              </label>
              <label className={styles.progressField}>
                <span>
                  Progress — <strong>{draftProgress}%</strong>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={draftProgress}
                  onChange={(event) => setDraftProgress(Number(event.target.value))}
                  style={{ "--progress": `${draftProgress}%` } as React.CSSProperties}
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={() => setSelectedTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSave}>
                  Save
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
