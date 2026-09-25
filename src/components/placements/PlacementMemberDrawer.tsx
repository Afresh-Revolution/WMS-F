"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { PlacementMember } from "@/data/placements";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  managerApi,
  nyscInternsManageApi,
  superAdminApi,
  unwrapRecord,
} from "@/lib/api";
import { mapPlacement } from "@/lib/api/mappers";
import styles from "./PlacementMemberDrawer.module.css";

function display(value: string) {
  return value.trim() || "—";
}

async function loadMember(id: string, manager: boolean) {
  try {
    if (manager) return await managerApi.getNyscIntern(id);
    return await superAdminApi.nyscInterns.get(id);
  } catch {
    return null;
  }
}

type PlacementMemberDrawerProps = {
  member: PlacementMember;
  manager?: boolean;
  onClose: () => void;
  onUpdated?: () => void;
};

export function PlacementMemberDrawer({
  member,
  manager = false,
  onClose,
  onUpdated,
}: PlacementMemberDrawerProps) {
  const { runAction } = usePageActions();
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const { data, loading, error } = useAsyncData(
    () => loadMember(member.id, manager),
    [member.id, manager],
  );

  const detail = useMemo(() => {
    if (!data) return member;
    const mapped = mapPlacement(unwrapRecord(data));
    return {
      ...member,
      ...mapped,
      name: mapped.name || member.name,
      institution: mapped.institution || member.institution,
      course: mapped.course || member.course,
      department: mapped.department || member.department,
      supervisor: mapped.supervisor || member.supervisor,
      startDate: mapped.startDate || member.startDate,
      endDate: mapped.endDate || member.endDate,
      progress: mapped.progress || member.progress,
      daysRemaining: mapped.daysRemaining ?? member.daysRemaining,
      initials: mapped.initials || member.initials,
      type: mapped.type || member.type,
      status: mapped.status || member.status,
      userId: mapped.userId || member.userId,
    };
  }, [data, member]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !noteOpen && !taskOpen) onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [noteOpen, onClose, taskOpen]);

  const progress = Math.min(100, Math.max(0, detail.progress));
  const daysRemaining = detail.daysRemaining ?? 0;
  const statusClass =
    detail.status === "Exited"
      ? styles.statusExited
      : detail.status === "Exiting soon"
        ? styles.statusExiting
        : styles.statusActive;

  async function handleAddNote(values: Record<string, string>) {
    const comments = values.comments.trim();
    if (!comments) return;
    await runAction("Add progress note", async () => {
      const body = {
        reviewPeriod: "MONTHLY",
        comments,
        recommendation: "CONTINUE",
      };
      if (manager) {
        await nyscInternsManageApi.reviews.add(detail.id, body);
      } else {
        await superAdminApi.nyscInterns.reviews.add(detail.id, body);
      }
      onUpdated?.();
      setNoteOpen(false);
    });
  }

  async function handleAssignTask(values: Record<string, string>) {
    const title = values.title.trim();
    if (!title) return;
    await runAction("Assign task", async () => {
      const body = {
        title,
        description: values.description.trim(),
        dueDate: values.dueDate,
        deadline: values.dueDate,
        priority: values.priority || "Medium",
        status: "Not Started",
        assignee: detail.name,
        assigneeName: detail.name,
        assigneeId: detail.userId || detail.id,
        department: detail.department,
      };
      if (manager) {
        await managerApi.createTask(body);
      } else {
        await superAdminApi.tasks.create(body);
      }
      onUpdated?.();
      setTaskOpen(false);
    });
  }

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} role="presentation">
        <aside
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-profile-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className={styles.head}>
            <p className={styles.eyebrow}>Member profile</p>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close member profile"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </header>

          {loading ? (
            <p className={styles.statusLine}>Loading profile…</p>
          ) : null}
          {error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.identity}>
            <span className={styles.avatar}>{detail.initials}</span>
            <div>
              <h2 id="member-profile-title" className={styles.name}>
                {display(detail.name)}
              </h2>
              <div className={styles.badges}>
                <span className={styles.typeTag}>{detail.type}</span>
                <span className={statusClass}>{detail.status}</span>
              </div>
            </div>
          </div>

          <dl className={styles.meta}>
            <div className={styles.metaRow}>
              <dt>Institution</dt>
              <dd>{display(detail.institution)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Course</dt>
              <dd>{display(detail.course)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Department</dt>
              <dd>{display(detail.department)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Supervisor</dt>
              <dd>{display(detail.supervisor)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Start date</dt>
              <dd>{display(detail.startDate)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>End date</dt>
              <dd>{display(detail.endDate)}</dd>
            </div>
            <div className={styles.metaRow}>
              <dt>Days remaining</dt>
              <dd>
                {daysRemaining === 1 ? "1 day" : `${daysRemaining} days`}
              </dd>
            </div>
          </dl>

          <section className={styles.progressBlock}>
            <div className={styles.progressTop}>
              <span>Placement progress</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressHint}>{progress}% complete</p>
          </section>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() => setNoteOpen(true)}
            >
              Add progress note
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setTaskOpen(true)}
            >
              Assign task
            </button>
          </div>
        </aside>
      </div>

      <SimpleModal
        open={noteOpen}
        title="Add progress note"
        fields={[
          {
            name: "comments",
            label: "Note",
            type: "textarea",
            required: true,
            fullWidth: true,
            rows: 4,
            placeholder: "Progress, feedback, or next steps",
          },
        ]}
        submitLabel="Save note"
        showClose
        appearance="soft"
        onClose={() => setNoteOpen(false)}
        onSubmit={handleAddNote}
      />

      <SimpleModal
        open={taskOpen}
        title="Assign task"
        fields={[
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
            type: "textarea",
            fullWidth: true,
            rows: 3,
            placeholder: "Details and context",
          },
          {
            name: "priority",
            label: "Priority",
            type: "select",
            defaultValue: "Medium",
            options: [
              { label: "High", value: "High" },
              { label: "Medium", value: "Medium" },
              { label: "Low", value: "Low" },
            ],
          },
          {
            name: "dueDate",
            label: "Due date",
            type: "date",
            required: true,
            fullWidth: true,
          },
        ]}
        submitLabel="Assign task"
        showClose
        appearance="soft"
        onClose={() => setTaskOpen(false)}
        onSubmit={handleAssignTask}
      />
    </>,
    document.body,
  );
}
