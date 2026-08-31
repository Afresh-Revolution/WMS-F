"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  taskFilters,
  taskStats,
  tasks as fallbackTasks,
  type Task,
  type TaskFilter,
  type TaskPriority,
  type TaskStatus,
} from "@/data/tasks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { tasksApi } from "@/lib/api";
import { listFrom, mapTask } from "@/lib/api/mappers";
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

const createFields = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" as const },
  {
    name: "priority",
    label: "Priority",
    type: "select" as const,
    defaultValue: "Medium",
    options: [
      { label: "High", value: "High" },
      { label: "Medium", value: "Medium" },
      { label: "Low", value: "Low" },
    ],
  },
  { name: "assignee", label: "Assignee", required: true },
  { name: "dueDate", label: "Due date", type: "date" as const, required: true },
  { name: "department", label: "Department", required: true },
];

function matchesFilter(status: TaskStatus, filter: TaskFilter): boolean {
  if (filter === "All") return true;
  if (filter === "In Progress") return status === "In Progress";
  if (filter === "Overdue") return status === "Overdue";
  return status === "Completed";
}

export function TasksPage() {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(() => tasksApi.list(), []);

  const tasks = useMemo(() => {
    const records = listFrom(data ?? undefined);
    return records.length > 0
      ? records.map((record) => mapTask(record))
      : fallbackTasks;
  }, [data]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!matchesFilter(task.status, activeFilter)) return false;
      if (!normalizedQuery) return true;
      const haystack =
        `${task.title} ${task.description} ${task.assignee} ${task.department}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeFilter, query, tasks]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Create task", async () => {
      await tasksApi.create({ ...values, status: "Not Started" });
      refetch();
    });
  }

  async function toggleComplete(task: Task) {
    const nextStatus = task.status === "Completed" ? "In Progress" : "Completed";
    await runAction("Update task", async () => {
      await tasksApi.patch(task.id, { status: nextStatus });
      refetch();
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredTasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        dueDate: task.dueDate,
        department: task.department,
      })),
      "tasks.csv",
    );
  }

  return (
    <>
      <div className={styles.page}>
        {loading ? <p>Loading tasks…</p> : null}
        {error ? <p role="alert">Using cached tasks — {error}</p> : null}
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <NotificationsLink className={styles.iconButton} />
            <button
              type="button"
              aria-label="Refresh"
              className={styles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              aria-label="Export"
              className={styles.iconButton}
              onClick={handleExport}
            >
              <Download size={16} />
            </button>
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

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
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span className={styles.statBadge}>{stat.badge}</span>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {taskFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterTab} ${active ? styles.filterTabActive : ""}`}
              >
                {active && <span className={styles.filterDot} aria-hidden />}
                {filter}
              </button>
            );
          })}
        </div>

        <div className={styles.list}>
          {filteredTasks.map((task) => {
            const completed = task.status === "Completed";

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
                  {completed && <Check size={12} strokeWidth={3} />}
                </button>

                <div className={styles.cardBody}>
                  <div className={styles.cardTitleRow}>
                    <h2
                      className={`${styles.cardTitle} ${completed ? styles.cardTitleCompleted : ""}`}
                    >
                      {task.title}
                    </h2>
                    <div className={styles.tags}>
                      <span className={priorityClass[task.priority]}>
                        {task.priority}
                      </span>
                      <span className={statusClass[task.status]}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  <p className={styles.cardDescription}>{task.description}</p>

                  <div className={styles.cardMeta}>
                    <span className={styles.metaItem}>
                      <span
                        className={styles.assigneeAvatar}
                        style={{ background: task.assigneeColor }}
                      >
                        {task.assigneeInitials}
                      </span>
                      {task.assignee}
                    </span>
                    <span className={styles.metaItem}>
                      <CalendarDays size={14} />
                      Due {task.dueDate}
                    </span>
                    <span className={styles.metaItem}>{task.department}</span>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className={styles.empty}>No tasks match this filter.</div>
          )}
        </div>
      </div>

      <SimpleModal
        open={createOpen}
        title="Create task"
        description="Assign work to a team member with a due date and priority."
        fields={createFields}
        submitLabel="Create task"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
