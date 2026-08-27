"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  taskFilters,
  taskStats,
  type TaskFilter,
  type TaskPriority,
  type TaskStatus,
} from "@/data/tasks";
import { managerApi } from "@/lib/api/manager";
import { useManagerTasks } from "@/lib/hooks/useManagerApi";
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

export function TasksPage() {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All");
  const { items: tasks, setItems, isLive, refresh } = useManagerTasks();

  const liveStats = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "Not Started").length;
    const inProgress = tasks.filter((task) => task.status === "In Progress").length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    return [
      { id: "total", label: "Total tasks", value: String(tasks.length), badge: "Active" },
      { id: "pending", label: "Pending", value: String(pending), badge: "Urgent" },
      { id: "in-progress", label: "In progress", value: String(inProgress), badge: "Active" },
      { id: "completed", label: "Completed", value: String(completed), badge: "Done" },
    ];
  }, [tasks]);

  const displayedStats = isLive ? liveStats : taskStats;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => matchesFilter(task.status, activeFilter));
  }, [activeFilter, tasks]);

  async function toggleComplete(id: string, completed: boolean) {
    const nextStatus: TaskStatus = completed ? "Completed" : "In Progress";
    if (isLive) {
      await managerApi.updateTask(id, { status: nextStatus.toLowerCase().replace(" ", "_") });
      await refresh();
      return;
    }

    setItems((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status: nextStatus } : task,
      ),
    );
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <button type="button" aria-label="Search" className={styles.iconButton}>
              <Search size={16} />
            </button>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="View options" className={styles.iconButton}>
              <LayoutGrid size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
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
          <button type="button" className={styles.createButton}>
            <Plus size={16} strokeWidth={2.5} />
            Create task
          </button>
        </div>

        <div className={styles.stats}>
          {displayedStats.map((stat) => (
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
                    completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`
                  }
                  className={`${styles.checkbox} ${completed ? styles.checkboxChecked : ""}`}
                  onClick={() => void toggleComplete(task.id, !completed)}
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
    </AppShell>
  );
}
