"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, Monitor, Plus, Users, X } from "lucide-react";
import {
  meetingFilters,
  type Meeting,
  type MeetingFilter,
  type MeetingTag,
} from "@/data/meetings";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { listFrom, mapMeeting } from "@/lib/api/mappers";
import styles from "./MeetingsPage.module.css";

const tagClass: Record<MeetingTag, string> = {
  Upcoming: styles.tagUpcoming,
  "Company-wide": styles.tagCompany,
  Completed: styles.tagCompleted,
};

const durationOptions = [
  { label: "15 minutes", value: "15 minutes" },
  { label: "30 minutes", value: "30 minutes" },
  { label: "45 minutes", value: "45 minutes" },
  { label: "1 hour", value: "1 hour" },
  { label: "1.5 hours", value: "1.5 hours" },
  { label: "2 hours", value: "2 hours" },
];

const typeOptions = [
  { label: "In-person", value: "in-person" },
  { label: "Virtual", value: "virtual" },
];

const createMeetingFields = [
  {
    name: "title",
    label: "Meeting title",
    required: true,
    fullWidth: true,
    placeholder: "e.g. Q3 planning session",
  },
  {
    name: "date",
    label: "Date",
    type: "date" as const,
    required: true,
    placeholder: "mm/dd/yyyy",
  },
  {
    name: "time",
    label: "Time",
    type: "time" as const,
    required: true,
  },
  {
    name: "duration",
    label: "Duration",
    type: "select" as const,
    defaultValue: "30 minutes",
    options: durationOptions,
  },
  {
    name: "type",
    label: "Type",
    type: "select" as const,
    defaultValue: "in-person",
    options: typeOptions,
  },
  {
    name: "location",
    label: "Location / virtual link",
    fullWidth: true,
    placeholder: "Meeting room or Google Meet URL",
  },
  {
    name: "agenda",
    label: "Agenda",
    type: "textarea" as const,
    fullWidth: true,
    rows: 3,
    placeholder: "Meeting agenda and topics",
  },
];

function durationMinutes(value: string) {
  const formatted = formatDuration(value);
  if (/^\d+m$/.test(formatted)) return Number(formatted.slice(0, -1));
  const hours = formatted.match(/^(\d+(?:\.\d+)?)h$/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  return undefined;
}

function meetingWriteBody(values: Record<string, string>) {
  const meetingType = values.type.trim() || "in-person";
  const isVirtual = meetingType === "virtual";
  const duration = values.duration.trim();
  const agenda = values.agenda.trim();
  const location = values.location.trim();
  const body: Record<string, unknown> = {
    title: values.title.trim(),
    date: values.date.trim(),
    startDate: values.date.trim(),
    time: values.time.trim(),
    type: meetingType,
    meetingType,
    isVirtual,
    virtual: isVirtual,
  };
  if (location) {
    body.location = location;
    if (isVirtual) body.meetingUrl = location;
  }
  if (duration) {
    body.duration = duration;
    const minutes = durationMinutes(duration);
    if (minutes) body.durationMinutes = minutes;
  }
  if (agenda) {
    body.agenda = agenda;
    body.notes = agenda;
    body.description = agenda;
  }
  return body;
}

function parseDate(value: string) {
  const text = value.trim();
  if (!text) return null;
  const isoDay = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDay) {
    return new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function formatTime(value: string) {
  const text = value.trim();
  if (!text) return "";
  const ampm = text.match(/^(\d{1,2}:\d{2})\s*([AaPp][Mm])$/);
  if (ampm) return `${ampm[1]} ${ampm[2].toUpperCase()}`;
  return text.replace(/([0-9])([AaPp][Mm])$/, "$1 $2");
}

function formatDuration(value: string) {
  const text = value.trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  const hourOnly = lower.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)$/);
  if (hourOnly) return `${hourOnly[1]}h`;
  const minOnly = lower.match(/^(\d+)\s*(m|min|mins|minute|minutes)$/);
  if (minOnly) return `${minOnly[1]}m`;
  const hm = lower.match(/^(\d+)\s*h(?:ours?)?\s*(\d+)\s*m(?:in(?:ute)?s?)?$/);
  if (hm) {
    const hours = Number(hm[1]);
    const minutes = Number(hm[2]);
    if (minutes === 30) return `${hours + 0.5}h`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  const minutes = Number(text);
  if (Number.isFinite(minutes) && minutes > 0 && !/[a-z]/i.test(text)) {
    if (minutes % 60 === 0) return `${minutes / 60}h`;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (rest === 30) return `${hours + 0.5}h`;
    return `${hours}h ${rest}m`;
  }
  return text;
}

function toTimeInput(value: string) {
  const text = value.trim();
  if (!text) return "";
  const ampm = text.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase() === "pm") hours += 12;
    return `${String(hours).padStart(2, "0")}:${ampm[2]}`;
  }
  const hm = text.match(/^(\d{1,2}):(\d{2})/);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  return "";
}

function toDurationSelect(value: string) {
  const formatted = formatDuration(value);
  const match = durationOptions.find(
    (option) =>
      option.value === value ||
      option.label === value ||
      formatDuration(option.value) === formatted,
  );
  return match?.value ?? "30 minutes";
}

export function MeetingsPage() {
  const [activeFilter, setActiveFilter] = useState<MeetingFilter>("Upcoming");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [detailsMeeting, setDetailsMeeting] = useState<Meeting | null>(null);

  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.meetings.list(),
    [],
  );

  const meetings = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapMeeting(record));
  }, [data]);

  const meetingStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = startOfWeek(todayStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const todayCount = meetings.filter((meeting) => {
      const date = parseDate(meeting.date);
      return date ? date.getTime() === todayStart.getTime() : false;
    }).length;
    const weekCount = meetings.filter((meeting) => {
      const date = parseDate(meeting.date);
      return date ? date >= weekStart && date < weekEnd : false;
    }).length;
    const companyCount = meetings.filter((meeting) =>
      meeting.tags.includes("Company-wide"),
    ).length;

    return [
      { id: "today", label: "Today's meetings", value: String(todayCount) },
      {
        id: "week",
        label: "This week",
        value: String(weekCount),
        accent: true,
      },
      { id: "company", label: "Company-wide", value: String(companyCount) },
    ];
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return meetings.filter((meeting) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Upcoming" && meeting.tags.includes("Upcoming")) ||
        (activeFilter === "Completed" && meeting.tags.includes("Completed")) ||
        (activeFilter === "Company-wide" &&
          (meeting.tags.includes("Company-wide") ||
            meeting.category === "Company-wide"));
      const haystack =
        `${meeting.title} ${meeting.location} ${meeting.time}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [activeFilter, query, meetings]);

  async function handleCreateMeeting(values: Record<string, string>) {
    await runAction("Create meeting", async () => {
      await superAdminApi.meetings.create(meetingWriteBody(values));
      refetch();
    });
  }

  async function handleEditMeeting(values: Record<string, string>) {
    if (!editMeeting) return;
    await runAction("Update meeting", async () => {
      await superAdminApi.meetings.patch(
        editMeeting.id,
        meetingWriteBody(values),
      );
      refetch();
    });
    setEditMeeting(null);
  }

  const editMeetingFields = createMeetingFields.map((field) => {
    if (!editMeeting) return field;
    const defaults: Record<string, string | undefined> = {
      title: editMeeting.title,
      date: editMeeting.date,
      time: toTimeInput(editMeeting.time),
      duration: toDurationSelect(editMeeting.duration),
      type: editMeeting.isVirtual ? "virtual" : "in-person",
      location: editMeeting.location,
      agenda: editMeeting.agenda,
    };
    return { ...field, defaultValue: defaults[field.name] };
  });

  return (
    <div className={styles.page}>
      <PageTopBar
        searchValue={query}
        onSearchChange={setQuery}
        status={
          loading ? (
            <p className={styles.statusLine}>Loading meetings…</p>
          ) : error ? (
            <p className={styles.statusLine} role="alert">
              {error}
            </p>
          ) : null
        }
      />

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Meetings & calendar</p>
          <h1 className={styles.title}>Every meeting, in its place</h1>
          <p className={styles.subtitle}>
            Schedule, manage, and track meetings for management and the wider
            team.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create meeting
        </button>
      </div>

      <div className={styles.stats}>
        {meetingStats.map((stat) => (
          <article
            key={stat.id}
            className={`${styles.statCard} ${stat.accent ? styles.statCardAccent : ""}`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </article>
        ))}
      </div>

      <div className={styles.filters}>
        {meetingFilters.map((filter) => (
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

      {filteredMeetings.length === 0 ? (
        <p className={styles.empty}>No meetings match this filter.</p>
      ) : (
        <div className={styles.list}>
          {filteredMeetings.map((meeting) => {
            const time = formatTime(meeting.time);
            const duration = formatDuration(meeting.duration);
            const LocationIcon = meeting.isVirtual ? Monitor : MapPin;
            return (
              <article key={meeting.id} className={styles.listRow}>
                <div className={styles.rowMain}>
                  <span className={styles.dateBadge}>
                    {meeting.month ? (
                      <span className={styles.dateMonth}>{meeting.month}</span>
                    ) : null}
                    <span className={styles.dateDay}>
                      {meeting.day || "–"}
                    </span>
                  </span>
                  <div className={styles.rowBody}>
                    <div className={styles.titleRow}>
                      <h2 className={styles.meetingTitle}>{meeting.title}</h2>
                      {meeting.tags.map((tag) => (
                        <span key={tag} className={tagClass[tag]}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={styles.meta}>
                      {time || duration ? (
                        <p className={styles.metaItem}>
                          <Clock size={14} className={styles.metaIcon} />
                          {[time, duration].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {meeting.location ? (
                        <p className={styles.metaItem}>
                          <LocationIcon size={14} className={styles.metaIcon} />
                          {meeting.location}
                        </p>
                      ) : null}
                      {meeting.attendees > 0 ? (
                        <p className={styles.metaItem}>
                          <Users size={14} className={styles.metaIcon} />
                          {meeting.attendees} attendees
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.detailsButton}
                    onClick={() => setDetailsMeeting(meeting)}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={() => setEditMeeting(meeting)}
                  >
                    Edit
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SimpleModal
        open={createOpen}
        title="Create meeting"
        fields={createMeetingFields}
        submitLabel="Create meeting"
        submitIcon
        showClose
        wide
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateMeeting}
      />

      <SimpleModal
        open={editMeeting !== null}
        title="Edit meeting"
        fields={editMeetingFields}
        submitLabel="Save changes"
        hideCancel
        showClose
        wide
        appearance="soft"
        onClose={() => setEditMeeting(null)}
        onSubmit={handleEditMeeting}
      />

      {detailsMeeting ? (
        <div
          className={styles.detailsBackdrop}
          onClick={() => setDetailsMeeting(null)}
          role="presentation"
        >
          <div
            className={styles.detailsModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-details-title"
          >
            <div className={styles.detailsHead}>
              <h2 id="meeting-details-title" className={styles.detailsTitle}>
                {detailsMeeting.title}
              </h2>
              <button
                type="button"
                className={styles.detailsClose}
                onClick={() => setDetailsMeeting(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.detailsChips}>
              {detailsMeeting.tags.map((tag) => (
                <span key={tag} className={tagClass[tag]}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.detailsMeta}>
              {[formatTime(detailsMeeting.time), formatDuration(detailsMeeting.duration)]
                .filter(Boolean)
                .join(" · ")}
              {detailsMeeting.date
                ? ` · ${detailsMeeting.month} ${detailsMeeting.day}`
                : ""}
            </div>
            {detailsMeeting.location ? (
              <p className={styles.detailsLine}>{detailsMeeting.location}</p>
            ) : null}
            {detailsMeeting.attendees > 0 ? (
              <p className={styles.detailsLine}>
                {detailsMeeting.attendees} attendees
              </p>
            ) : null}
            <div className={styles.detailsActions}>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => {
                  setDetailsMeeting(null);
                  setEditMeeting(detailsMeeting);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
