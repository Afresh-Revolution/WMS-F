"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Clock, Plus } from "lucide-react";
import {
  taskFilters,
  type Task,
  type TaskFilter,
  type TaskPriority,
  type TaskStatus,
} from "@/data/tasks";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { listStaffEmployees, managerApi, superAdminApi } from "@/lib/api";
import { listFrom, mapEmployee, mapTask } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./TasksPage.module.css";

const priorityClass: Record<TaskPriority, string> = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

const statusClass: Record<TaskStatus, string> = {
  "In Progress": styles.statusInProgress,
  "Not Started": styles.statusNotStarted,
  Overdue: styles.statusOverdue,
  Completed: styles.statusCompleted,
};

function matchesFilter(status: TaskStatus, filter: TaskFilter): boolean {
  if (filter === "All") return true;
  if (filter === "In Progress") return status === "In Progress";
  if (filter === "Overdue") return status === "Overdue";
  return status === "Completed";
}

function formatDueDate(value: string) {
  const text = value.trim();
  if (!text) return "";
  const isoDay = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoDay
    ? new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]))
    : new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TasksPage() {
  const manager = useManagerPortal();
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => (manager ? managerApi.listTasks() : superAdminApi.tasks.list()),
    [manager],
  );
  const { data: employeeData } = useAsyncData(
    () => listStaffEmployees().catch(() => []),
    [],
  );

  const tasks = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapTask(record));
  }, [data]);

  const employees = useMemo(
    () => (employeeData ?? []).map((record) => mapEmployee(record)),
    [employeeData],
  );

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
        required: true,
        defaultValue: "",
        options: [
          { label: "Select employee", value: "" },
          ...employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          })),
        ],
      },
      {
        name: "priority",
        label: "Priority",
        type: "select" as const,
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
        required: true,
        fullWidth: true,
        placeholder: "mm/dd/yyyy",
      },
    ],
    [employees],
  );

  const taskStats = useMemo(() => {
    const open = tasks.filter((task) => task.status !== "Completed").length;
    const overdue = tasks.filter((task) => task.status === "Overdue").length;
    const inProgress = tasks.filter((task) => task.status === "In Progress").length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    return [
      { id: "open", label: "Open tasks", value: String(open), hint: "Active" },
      {
        id: "overdue",
        label: "Overdue",
        value: String(overdue),
        hint: "Urgent",
        accent: true,
      },
      { id: "progress", label: "In progress", value: String(inProgress), hint: "Now" },
      { id: "completed", label: "Completed", value: String(completed), hint: "Total" },
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!matchesFilter(task.status, activeFilter)) return false;
      if (!needle) return true;
      const haystack =
        `${task.title} ${task.description} ${task.assignee} ${task.department}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [activeFilter, query, tasks]);

  async function handleCreate(values: Record<string, string>) {
    const employee = employees.find((item) => item.id === values.assigneeId);
    await runAction("Create task", async () => {
      const body = {
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        dueDate: values.dueDate,
        deadline: values.dueDate,
        assigneeId: values.assigneeId,
        assignee: employee?.name,
        assigneeName: employee?.name,
        department: employee?.department,
        status: "Not Started",
      };
      if (manager) {
        await managerApi.createTask(body);
      } else {
        await superAdminApi.tasks.create(body);
      }
      refetch();
    });
  }

  async function toggleComplete(task: Task) {
    const nextStatus = task.status === "Completed" ? "In Progress" : "Completed";
    await runAction("Update task", async () => {
      if (manager) {
        await managerApi.updateTask(task.id, { status: nextStatus });
      } else {
        await superAdminApi.tasks.patch(task.id, { status: nextStatus });
      }
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        status={
          loading ? (
            <p className={styles.statusLine}>Loading tasks…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

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
        {taskStats.map((stat) => (
          <article
            key={stat.id}
            className={`${styles.statCard} ${stat.accent ? styles.statCardAccent : ""}`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <div className={styles.statRow}>
              <p className={styles.statValue}>{stat.value}</p>
              <span className={styles.statHint}>{stat.hint}</span>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.filters}>
        {taskFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`${styles.filterChip} ${
              activeFilter === filter ? styles.filterChipActive : ""
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <p className={styles.empty}>No tasks match this filter.</p>
      ) : (
        <div className={styles.list}>
          {filteredTasks.map((task) => {
            const completed = task.status === "Completed";
            const due = formatDueDate(task.dueDate);
            return (
              <article key={task.id} className={styles.card}>
                <button
                  type="button"
                  aria-label={
                    completed
                      ? `Mark ${task.title} incomplete`
                      : `Mark ${task.title} complete`
                  }
                  className={`${styles.checkbox} ${completed ? styles.checkboxChecked : ""}`}
                  onClick={() => void toggleComplete(task)}
                >
                  {completed ? <Check size={12} strokeWidth={3} /> : null}
                </button>

                <div className={styles.cardBody}>
                  <div className={styles.cardTitleRow}>
                    <h2
                      className={`${styles.cardTitle} ${completed ? styles.cardTitleCompleted : ""}`}
                    >
                      {task.title}
                    </h2>
                    <span className={priorityClass[task.priority]}>
                      {task.priority}
                    </span>
                    <span className={statusClass[task.status]}>
                      {task.status === "Overdue" ? (
                        <AlertTriangle size={11} strokeWidth={2.25} />
                      ) : null}
                      {task.status}
                    </span>
                  </div>

                  {task.description ? (
                    <p className={styles.cardDescription}>{task.description}</p>
                  ) : null}

                  <div className={styles.cardMeta}>
                    {task.assignee ? (
                      <span className={styles.metaItem}>
                        <span className={styles.assigneeAvatar}>
                          {task.assigneeInitials}
                        </span>
                        {task.assignee}
                      </span>
                    ) : null}
                    {due ? (
                      <span className={styles.metaItem}>
                        <Clock size={14} className={styles.metaIcon} />
                        Due {due}
                      </span>
                    ) : null}
                    {task.department ? (
                      <span className={styles.metaItem}>{task.department}</span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight size={18} className={styles.chevron} />
              </article>
            );
          })}
        </div>
      )}

      <SimpleModal
        open={createOpen}
        title="Create task"
        fields={createFields}
        submitLabel="Create task"
        showClose
        wide
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
