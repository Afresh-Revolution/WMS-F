"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  MapPin,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  meetingFilters,
  type Meeting,
  type MeetingFilter,
  type MeetingTag,
} from "@/data/meetings";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapMeeting, str } from "@/lib/api/mappers";
import styles from "./MeetingsPage.module.css";

const tagClass: Record<MeetingTag, string> = {
  Upcoming: styles.tagUpcoming,
  "Company-wide": styles.tagCompany,
  Completed: styles.tagCompleted,
};

const createMeetingFields = [
  { name: "title", label: "Meeting title", required: true },
  { name: "date", label: "Date", type: "date" as const, required: true },
  { name: "time", label: "Time", placeholder: "10:00AM", required: true },
  { name: "duration", label: "Duration", placeholder: "1 HOUR" },
  { name: "location", label: "Location", required: true },
];

function meetingWriteBody(values: Record<string, string>) {
  const body: Record<string, unknown> = {
    title: values.title.trim(),
    date: values.date.trim(),
    time: values.time.replace(/\s+/g, "").toUpperCase(),
    location: values.location.trim(),
  };
  const duration = values.duration.trim().toUpperCase();
  if (duration) body.duration = duration;
  return body;
}

export function MeetingsPage() {
  const [activeFilter, setActiveFilter] = useState<MeetingFilter>("Upcoming");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);

  const { runAction, showToast } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.meetings.list(),
    [],
  );

  const meetings = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapMeeting(record));
  }, [data]);

  const meetingStats = useMemo(() => {
    const summary = unwrapRecord(data);
    const upcoming = meetings.filter((meeting) =>
      meeting.tags.includes("Upcoming"),
    ).length;
    const companyWide = meetings.filter((meeting) =>
      meeting.tags.includes("Company-wide"),
    ).length;
    return [
      {
        id: "today",
        label: "Today's meeting",
        value: str(summary.today ?? summary.todayCount, String(upcoming || "0")),
      },
      {
        id: "week",
        label: "This week",
        value: str(summary.week ?? summary.weekCount, String(meetings.length || "0")),
      },
      {
        id: "company",
        label: "Company-wide",
        value: str(summary.companyWide ?? summary.company, String(companyWide || "0")),
      },
    ];
  }, [data, meetings]);

  const filteredMeetings = useMemo(() => {
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
      return (
        matchesFilter && haystack.includes(query.trim().toLowerCase())
      );
    });
  }, [activeFilter, query, meetings]);

  function viewDetails(meeting: (typeof meetings)[number]) {
    showToast(
      `${meeting.title} — ${meeting.day} ${meeting.time}, ${meeting.location}`,
      "info",
    );
  }

  async function handleCreateMeeting(values: Record<string, string>) {
    await runAction("Create meeting", async () => {
      await superAdminApi.meetings.create(meetingWriteBody(values));
      refetch();
    });
  }

  async function handleEditMeeting(values: Record<string, string>) {
    if (!editMeeting) return;
    await runAction("Update meeting", async () => {
      await superAdminApi.meetings.patch(editMeeting.id, meetingWriteBody(values));
      refetch();
    });
    setEditMeeting(null);
  }

  const editMeetingFields = createMeetingFields.map((field) => {
    if (!editMeeting) return field;
    const defaults: Record<string, string | undefined> = {
      title: editMeeting.title,
      date: String(editMeeting.day),
      time: editMeeting.time,
      duration: editMeeting.duration,
      location: editMeeting.location,
    };
    return { ...field, defaultValue: defaults[field.name] };
  });

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          {loading ? <p className={styles.dateLabel}>Loading meetings…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <button
              type="button"
              aria-label="Filters"
              className={styles.iconButton}
              onClick={() => showToast("Use the filter chips below", "info")}
            >
              <SlidersHorizontal size={16} />
            </button>
            <button
              type="button"
              aria-label="Share"
              className={styles.iconButton}
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                showToast("Page link copied", "success");
              }}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Every meeting, in its place</h1>
            <p className={styles.subtitle}>
              Schedule, manage and track meetings for management and the wider
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
            <article key={stat.id} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {meetingFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <section className={styles.listSection}>
          <div className={styles.list}>
            {filteredMeetings.map((meeting) => (
              <article key={meeting.id} className={styles.listRow}>
                <div className={styles.rowMain}>
                  <span className={styles.dateBadge}>{meeting.day}</span>
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
                      <p className={styles.metaItem}>
                        <Clock size={14} className={styles.metaIcon} />
                        {meeting.time} · {meeting.duration}
                      </p>
                      <p className={styles.metaItem}>
                        <MapPin size={14} className={styles.metaIcon} />
                        {meeting.location}
                      </p>
                      {meeting.attendees > 0 && (
                        <p className={styles.metaItem}>
                          <Users size={14} className={styles.metaIcon} />
                          {meeting.attendees} attendees
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.actionLink}
                    onClick={() => viewDetails(meeting)}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    className={styles.actionLink}
                    onClick={() => setEditMeeting(meeting)}
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}

            {filteredMeetings.length === 0 && (
              <div className={styles.empty}>No meetings match this filter.</div>
            )}
          </div>
        </section>

        <SimpleModal
          open={createOpen}
          title="Create meeting"
          description="Schedule a new meeting."
          fields={createMeetingFields}
          submitLabel="Create meeting"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateMeeting}
        />

        <SimpleModal
          open={editMeeting !== null}
          title="Edit meeting"
          description={editMeeting?.title}
          fields={editMeetingFields}
          submitLabel="Save changes"
          onClose={() => setEditMeeting(null)}
          onSubmit={handleEditMeeting}
        />
      </div>
  );
}
