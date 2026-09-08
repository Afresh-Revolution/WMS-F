"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Search, UserRound, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeProfile, employeeTasks } from "@/data/employeeHome";
import { tasksApi } from "@/lib/api";
import styles from "./EmployeeTasksPage.module.css";

type TaskFilter = "All" | "In Progress" | "In Review" | "Overdue" | "Completed";

const filters: TaskFilter[] = [
  "All",
  "In Progress",
  "In Review",
  "Overdue",
  "Completed",
];

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
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [selectedTask, setSelectedTask] = useState<(typeof employeeTasks)[number] | null>(
    null,
  );
  const [draftStatus, setDraftStatus] = useState("In Progress");
  const [draftProgress, setDraftProgress] = useState(0);
  const { runAction } = usePageActions();

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

  const tasks = useMemo(
    () =>
      employeeTasks.filter((task) => filter === "All" || task.status === filter),
    [filter],
  );

  async function updateProgress(values: Record<string, string>) {
    if (!selectedTask) return;
    await runAction(
      "Update task",
      async () => {
        await tasksApi.patch(selectedTask.id, {
          status: values.status,
          progress: Number(values.progress),
        });
      },
      "Task progress updated",
    );
  }

  function openProgress(
    task: (typeof employeeTasks)[number],
  ) {
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
        {tasks.map((task) => (
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
              <span>
                <UserRound size={12} />
                Assigned by {task.assignedBy}
              </span>
              <span>
                <CalendarDays size={12} />
                Due {task.due}
              </span>
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
        ))}
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
