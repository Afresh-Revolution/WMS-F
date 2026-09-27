"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  Plus,
  Search,
  X,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import { listFrom, nestedStr, str } from "@/lib/api/mappers";
import {
  boardColumns,
  type BoardTask,
  type TaskAudience,
  type TaskColumn,
  type TaskPriority,
} from "@/data/secretary";
import styles from "./SecretaryTasksPage.module.css";

const emptyForm = {
  title: "",
  description: "",
  audience: "Admin",
  priority: "Medium",
  assignee: "",
  due: "",
};

function audienceLabel(value: string): TaskAudience {
  return value.toLowerCase().includes("hod") ? "For HOD" : "For Admin";
}

function formatDueLabel(value: string): string {
  if (!value) return "Due tomorrow";
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  const due = new Date(year, (month ?? 1) - 1, day ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff <= 7) return `Due in ${diff} days`;
  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function mapPriority(value: unknown): TaskPriority {
  const raw = str(value).toLowerCase();
  if (raw.includes("high")) return "High";
  if (raw.includes("low")) return "Low";
  return "Medium";
}

function dueDateFromLabel(value: string): string {
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const today = new Date();
  const lower = raw.toLowerCase();
  const offset = lower.includes("today")
    ? 0
    : lower.includes("overdue") || lower.includes("yesterday")
      ? -1
      : 1;
  const due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  const month = String(due.getMonth() + 1).padStart(2, "0");
  const day = String(due.getDate()).padStart(2, "0");
  return `${due.getFullYear()}-${month}-${day}`;
}

function mapColumn(value: unknown): TaskColumn {
  const raw = str(value).toLowerCase();
  if (raw.includes("progress") || raw.includes("active")) return "In Progress";
  if (raw.includes("done") || raw.includes("complete")) return "Done";
  return "Open";
}

function mapTask(record: Record<string, unknown>, index: number): BoardTask {
  const due = str(
    record.due ??
      record.dueDate ??
      record.due_date ??
      record.deadline ??
      record.statusLabel,
    "Due Tomorrow",
  );
  return {
    id: str(record.id, String(index + 1)),
    title: str(record.title ?? record.name),
    description: str(record.description ?? record.detail),
    priority: mapPriority(record.priority),
    audience: audienceLabel(str(record.audience)),
    owner: nestedStr(
      record.owner ?? record.assignee ?? record.assignedTo,
      ["name", "fullName"],
      "",
    ),
    due,
    overdue:
      Boolean(record.overdue) || due.toLowerCase().includes("overdue"),
    column: mapColumn(record.column ?? record.status),
  };
}

const priorityClass: Record<TaskPriority, string> = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

export function SecretaryTasksPage() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const searchRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<Record<string, TaskColumn>>({});
  const [created, setCreated] = useState<BoardTask[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.listTasks(),
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

  const tasks = useMemo((): BoardTask[] => {
    const records = Array.isArray(data)
      ? data
      : listFrom((data ?? undefined) as never);
    const mapped = records.map((record, index) => mapTask(record, index));
    return [...mapped, ...created].map((task) =>
      columns[task.id] ? { ...task, column: columns[task.id] } : task,
    );
  }, [columns, created, data]);

  const grouped = useMemo(() => {
    return {
      Open: tasks.filter((task) => task.column === "Open"),
      "In Progress": tasks.filter((task) => task.column === "In Progress"),
      Done: tasks.filter((task) => task.column === "Done"),
    };
  }, [tasks]);

  const stats = [
    {
      id: "open",
      label: "Open",
      value: String(grouped.Open.length),
      tag: "To do",
    },
    {
      id: "progress",
      label: "In Progress",
      value: String(grouped["In Progress"].length),
      tag: "Active",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: String(
        tasks.filter(
          (task) => task.overdue && task.column !== "Done",
        ).length,
      ),
      tag: "Past due",
    },
    {
      id: "done",
      label: "Done",
      value: String(grouped.Done.length),
      tag: "Complete",
    },
  ];

  function openCreate() {
    setForm({
      ...emptyForm,
      assignee: user?.name ?? "",
    });
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setForm(emptyForm);
  }

  async function moveTask(task: BoardTask, column: TaskColumn) {
    await runAction(`Move to ${column}`, async () => {
      if (column === "Done") {
        await secretaryApi.completeTask(task.id);
      } else {
        await secretaryApi.updateTask(task.id, {
          status: column === "In Progress" ? "IN_PROGRESS" : "OPEN",
        });
      }
    });
    setColumns((current) => ({ ...current, [task.id]: column }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: BoardTask = {
      id: `new-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: mapPriority(form.priority),
      audience: audienceLabel(form.audience),
      owner: form.assignee.trim(),
      due: formatDueLabel(form.due),
      overdue: formatDueLabel(form.due).toLowerCase().includes("overdue"),
      column: "Open",
    };
    await runAction("New task", async () => {
      await secretaryApi.createTask({
        title: next.title,
        description: next.description,
        priority: next.priority.toUpperCase(),
        audience: next.audience === "For HOD" ? "HOD" : "ADMIN",
        assignedTo: next.owner || undefined,
        dueDate: dueDateFromLabel(form.due),
        status: "TODO",
      });
      setCreated((current) => [...current, next]);
    });
    closeCreate();
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        {loading ? <p className={styles.dateLabel}>Loading tasks…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            {error}
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
          <p className={styles.breadcrumb}>Secretary — Management tasks</p>
          <h1 className={styles.title}>Management task board</h1>
          <p className={styles.subtitle}>
            Track tasks for Admin and HODs, monitor deadlines and move work
            across the board.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={openCreate}
        >
          <Plus size={16} />
          New task
        </button>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span className={styles.statTag}>{stat.tag}</span>
          </article>
        ))}
      </div>

      <div className={styles.board}>
        {boardColumns.map((column) => {
          const items = grouped[column];
          return (
            <section key={column} className={styles.column}>
              <header className={styles.columnHead}>
                <h2>{column}</h2>
                <span>{items.length}</span>
              </header>
              <div className={styles.columnBody}>
                {items.length === 0 ? (
                  <p className={styles.empty}>No tasks.</p>
                ) : (
                  items.map((task) => (
                    <article key={task.id} className={styles.card}>
                      <div className={styles.cardTop}>
                        <h3>{task.title}</h3>
                        <span
                          className={`${styles.priority} ${priorityClass[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className={styles.description}>{task.description}</p>
                      <div className={styles.meta}>
                        <span className={styles.audience}>{task.audience}</span>
                        <span className={styles.owner}>{task.owner}</span>
                      </div>
                      <p
                        className={`${styles.due} ${
                          task.overdue && task.column !== "Done"
                            ? styles.dueOverdue
                            : ""
                        }`}
                      >
                        {task.column === "Done" ? (
                          <Check size={13} />
                        ) : task.overdue ? (
                          <Clock3 size={13} />
                        ) : (
                          <CalendarDays size={13} />
                        )}
                        {task.due}
                      </p>
                      {task.column === "Open" ? (
                        <button
                          type="button"
                          className={styles.moveButton}
                          onClick={() => void moveTask(task, "In Progress")}
                        >
                          Move to In Progress
                        </button>
                      ) : null}
                      {task.column === "In Progress" ? (
                        <button
                          type="button"
                          className={styles.moveButton}
                          onClick={() => void moveTask(task, "Done")}
                        >
                          Move to Done
                        </button>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
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
            aria-labelledby="create-task-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id="create-task-title" className={styles.modalTitle}>
                Create management task
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
              Add a task for Admin or a HOD and set its deadline.
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
                  placeholder="e.g. Prepare board pack"
                  required
                />
              </label>
              <label className={styles.modalField}>
                <span>Detail</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="What needs doing?"
                />
              </label>
              <div className={styles.modalPair}>
                <label className={styles.modalField}>
                  <span>For</span>
                  <select
                    value={form.audience}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        audience: event.target.value,
                      }))
                    }
                  >
                    <option>Admin</option>
                    <option>HOD</option>
                  </select>
                </label>
                <label className={styles.modalField}>
                  <span>Priority</span>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
              </div>
              <div className={styles.modalPair}>
                <label className={styles.modalField}>
                  <span>Assignee</span>
                  <input
                    value={form.assignee}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        assignee: event.target.value,
                      }))
                    }
                    placeholder="Name"
                  />
                </label>
                <label className={styles.modalField}>
                  <span>
                    Due <em>*</em>
                  </span>
                  <input
                    type="date"
                    value={form.due}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        due: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={closeCreate}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSave}>
                  <Plus size={15} />
                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
