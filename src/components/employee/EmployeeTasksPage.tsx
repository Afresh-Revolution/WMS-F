"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Plus, Search, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi, lookupsApi } from "@/lib/api";
import { initials, listFrom, nestedStr, str } from "@/lib/api/mappers";
import type { EmployeeTaskStatus } from "@/data/employeeHome";
import styles from "./EmployeeTasksPage.module.css";

type TaskFilter = "All" | "In Progress" | "In Review" | "Overdue" | "Completed";

type EmployeeTask = {
  id: string;
  title: string;
  priority: string;
  status: EmployeeTaskStatus;
  description: string;
  assignee: string;
  assigneeInitials: string;
  department: string;
  due: string;
  dueTime: number | null;
};

const visibleFilters: TaskFilter[] = [
  "All",
  "In Progress",
  "Overdue",
  "Completed",
];

const statusOptions = ["Not Started", "In Progress", "In Review", "Completed"];

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
  return raw ? "Medium" : "Medium";
}

function formatDue(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dueTime(value: unknown): number | null {
  const date = new Date(str(value));
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isOverdue(task: EmployeeTask) {
  if (task.status === "Completed") return false;
  if (task.status === "Overdue") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return task.dueTime !== null && task.dueTime < today.getTime();
}

function mapTask(record: Record<string, unknown>, index: number): EmployeeTask {
  const due = record.dueDate ?? record.due_date ?? record.due;
  const assignee = nestedStr(
    record.assignee ?? record.assignedTo ?? record.owner ?? record.assignedBy,
    ["name", "fullName"],
    str(record.assigneeName ?? record.assignedToName),
  );
  return {
    id: str(record.id, String(index + 1)),
    title: str(record.title ?? record.name),
    priority: mapPriority(record.priority),
    status: mapStatus(record.status),
    description: str(record.description ?? record.detail),
    assignee,
    assigneeInitials: initials(assignee),
    department: nestedStr(
      record.department,
      ["name", "title"],
      str(record.departmentName ?? record.department_name),
    ),
    due: formatDue(due),
    dueTime: dueTime(due),
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
  if (status === "In Progress") return styles.statusProgress;
  return styles.statusMuted;
}

export function EmployeeTasksPage({
  initialFilter = "All",
}: {
  initialFilter?: TaskFilter;
}) {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [draftStatus, setDraftStatus] = useState("Not Started");
  const [localTasks, setLocalTasks] = useState<EmployeeTask[]>([]);

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      employeeApi.tasks
        .list({ limit: 50 })
        .catch(() => employeeApi.tasks.assigned({ limit: 50 })),
    [],
  );
  const { data: peopleData } = useAsyncData(
    () => lookupsApi.employees().catch(() => []),
    [],
  );

  const people = useMemo(() => {
    const options = listFrom(peopleData ?? undefined)
      .map((record) => {
        const id = str(record.id ?? record.userId ?? record.employeeId);
        const name = str(record.fullName ?? record.name ?? record.label);
        if (!id || !name) return null;
        return { id, name };
      })
      .filter((item): item is { id: string; name: string } => Boolean(item));
    if (user?.id && user.name && !options.some((item) => item.id === user.id)) {
      options.unshift({ id: user.id, name: user.name });
    }
    return options;
  }, [peopleData, user?.id, user?.name]);

  const allTasks = useMemo(() => {
    const remote = listFrom((data ?? undefined) as never).map((record, index) =>
      mapTask(record, index),
    );
    const seen = new Set(remote.map((task) => task.id));
    return [...localTasks.filter((task) => !seen.has(task.id)), ...remote];
  }, [data, localTasks]);

  const tasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allTasks.filter((task) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Overdue" ? isOverdue(task) : task.status === filter);
      const haystack =
        `${task.title} ${task.description} ${task.assignee} ${task.department}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [allTasks, filter, query]);

  const openCount = allTasks.filter((task) => task.status !== "Completed").length;
  const overdueCount = allTasks.filter(isOverdue).length;
  const progressCount = allTasks.filter((task) => task.status === "In Progress").length;
  const completedCount = allTasks.filter((task) => task.status === "Completed").length;

  const createFields = useMemo(
    () => [
      {
        name: "title",
        label: "Task title",
        required: true,
        fullWidth: true,
        placeholder: "What needs to be done?",
      },
      {
        name: "description",
        label: "Description",
        type: "textarea" as const,
        fullWidth: true,
        rows: 3,
        placeholder: "Details and context",
      },
      {
        name: "assigneeId",
        label: "Assign to",
        type: "select" as const,
        pair: "assign",
        defaultValue: people[0]?.id ?? "",
        options:
          people.length > 0
            ? people.map((person) => ({ label: person.name, value: person.id }))
            : [{ label: "No people loaded", value: "" }],
      },
      {
        name: "priority",
        label: "Priority",
        type: "select" as const,
        pair: "assign",
        defaultValue: "High",
        options: [
          { label: "High", value: "High" },
          { label: "Medium", value: "Medium" },
          { label: "Low", value: "Low" },
        ],
      },
      {
        name: "dueDate",
        label: "Due date",
        type: "date" as const,
        fullWidth: true,
        placeholder: "mm/dd/yyyy",
      },
    ],
    [people],
  );

  useEffect(() => {
    if (!selectedTask && !createOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedTask(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [createOpen, selectedTask]);

  function openTask(task: EmployeeTask) {
    setSelectedTask(task);
    setDraftStatus(task.status === "Overdue" ? "In Progress" : task.status);
  }

  async function handleCreate(values: Record<string, string>) {
    const assignee = people.find((person) => person.id === values.assigneeId);
    const body = {
      title: values.title.trim(),
      description: values.description.trim(),
      assigneeId: values.assigneeId,
      assigneeName: assignee?.name ?? "",
      priority: values.priority,
      dueDate: values.dueDate,
      status: "Not Started",
    };
    await runAction("Create task", async () => {
      try {
        await employeeApi.tasks.create(body);
      } catch {
        setLocalTasks((current) => [
          mapTask(
            {
              ...body,
              id: `local-task-${Date.now()}`,
              assignee: assignee?.name ?? "",
            },
            current.length,
          ),
          ...current,
        ]);
      }
      refetch();
    });
  }

  async function saveStatus() {
    if (!selectedTask) return;
    await runAction("Save update", async () => {
      await employeeApi.tasks.update(selectedTask.id, { status: draftStatus });
      refetch();
      setSelectedTask(null);
    });
  }

  const filters =
    initialFilter === "In Review"
      ? (["All", "In Progress", "In Review", "Overdue", "Completed"] as TaskFilter[])
      : visibleFilters;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.statusLine}>Loading tasks…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input
              aria-label="Search"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Tasks</p>
          <h1 className={styles.title}>Work that moves forward</h1>
          <p className={styles.subtitle}>
            Create, assign, and track tasks across individuals, departments, and
            the whole company.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create task
        </button>
      </div>

      <div className={styles.stats}>
        <article className={styles.statCard}>
          <p>Open tasks</p>
          <div>
            <strong>{openCount}</strong>
            <span>Active</span>
          </div>
        </article>
        <article className={`${styles.statCard} ${styles.statCardAccent}`}>
          <p>Overdue</p>
          <div>
            <strong>{overdueCount}</strong>
            <span>Urgent</span>
          </div>
        </article>
        <article className={styles.statCard}>
          <p>In progress</p>
          <div>
            <strong>{progressCount}</strong>
            <span>Now</span>
          </div>
        </article>
        <article className={styles.statCard}>
          <p>Completed</p>
          <div>
            <strong>{completedCount}</strong>
            <span>Total</span>
          </div>
        </article>
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
              <span className={styles.taskCheck} aria-hidden />
              <div className={styles.taskBody}>
                <div className={styles.taskTitle}>
                  <h2>{task.title}</h2>
                  <span className={`${styles.badge} ${priorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`${styles.badge} ${statusClass(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                {task.description ? <p>{task.description}</p> : null}
                <div className={styles.meta}>
                  {task.assignee ? (
                    <span className={styles.assignee}>
                      <i>{task.assigneeInitials}</i>
                      {task.assignee}
                    </span>
                  ) : null}
                  {task.due ? (
                    <span>
                      <CalendarDays size={13} />
                      Due {task.due}
                    </span>
                  ) : null}
                  {task.department ? <span>{task.department}</span> : null}
                </div>
              </div>
              <button
                type="button"
                className={styles.openButton}
                aria-label={`Open ${task.title}`}
                onClick={() => openTask(task)}
              >
                <ChevronRight size={18} />
              </button>
            </article>
          ))
        )}
      </section>

      <SimpleModal
        open={createOpen}
        title="Create task"
        fields={createFields}
        submitLabel="Create task"
        showClose
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      {selectedTask ? (
        <div className={styles.drawerBackdrop} onClick={() => setSelectedTask(null)}>
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerTop}>
              <p>Task detail</p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedTask(null)}
              >
                <X size={18} />
              </button>
            </div>
            <h2 id="task-detail-title">{selectedTask.title}</h2>
            <div className={styles.drawerBadges}>
              <span className={`${styles.badge} ${priorityClass(selectedTask.priority)}`}>
                {selectedTask.priority} priority
              </span>
              <span className={`${styles.badge} ${statusClass(selectedTask.status)}`}>
                {selectedTask.status}
              </span>
            </div>
            <h3>Description</h3>
            <p className={styles.drawerCopy}>
              {selectedTask.description || "No description."}
            </p>
            <dl className={styles.detailList}>
              <div>
                <dt>Assignee</dt>
                <dd>{selectedTask.assignee || "—"}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{selectedTask.department || "—"}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{selectedTask.due || "—"}</dd>
              </div>
            </dl>
            <label className={styles.statusField}>
              <span>Update status</span>
              <select
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.saveButton}
              onClick={() => void saveStatus()}
            >
              Save update
            </button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
