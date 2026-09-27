"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Link2,
  List,
  MapPin,
  Plus,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { secretaryApi } from "@/lib/api";
import { avatarColor, initials, listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import {
  meetingFilterFromPath,
  meetingFilterHrefs,
  meetingFilters,
  meetingStatCards,
  todayKey,
  type ManagedMeeting,
  type MeetingAudience,
  type MeetingFilter,
  type MeetingStat,
} from "@/data/secretary";
import styles from "./SecretaryMeetingsPage.module.css";

function parseDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function whenFromDate(date: string): string {
  const event = parseDay(date);
  const today = parseDay(todayKey());
  const diff = Math.round(
    (event.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Yesterday";
  return `${Math.abs(diff)} days ago`;
}

function formatTime(value: string): string {
  if (!value) return "10:00 AM";
  if (/AM|PM/i.test(value)) return value;
  const [hours, minutes] = value.split(":").map(Number);
  const meridian = hours >= 12 ? "PM" : "AM";
  const hour = ((hours + 11) % 12) + 1;
  return `${hour}:${String(minutes ?? 0).padStart(2, "0")} ${meridian}`;
}

function timeFromDateTime(value: unknown): string {
  const raw = str(value);
  const parsed = new Date(raw);
  if (!raw || Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapAudience(value: unknown): MeetingAudience {
  const raw = str(value).toLowerCase();
  if (raw.includes("hod")) return "For HOD";
  return "For Admin";
}

function mapMeeting(record: Record<string, unknown>, index: number): ManagedMeeting {
  const start = record.start ?? record.startAt ?? record.date ?? record.day;
  const date = str(start, todayKey()).slice(0, 10);
  const location = str(record.location ?? record.place, "Virtual");
  const attendeeRecords = Array.isArray(record.attendees)
    ? record.attendees
    : [];
  const virtual =
    Boolean(record.virtual) ||
    Boolean(record.meetingLink) ||
    location.toLowerCase().includes("virtual") ||
    location.toLowerCase().includes("online");
  return {
    id: str(record.id, String(index + 1)),
    title: str(record.title ?? record.name),
    date,
    when: str(record.when, whenFromDate(date)),
    time: str(record.time, timeFromDateTime(start) || "10:00 AM"),
    duration: str(
      record.duration ?? record.durationMinutes,
      record.end && start
        ? `${Math.max(
            0,
            Math.round(
              (new Date(str(record.end)).getTime() -
                new Date(str(start)).getTime()) /
                60000,
            ),
          )}m`
        : "60m",
    ),
    location,
    virtual,
    attendees: num(record.attendeeCount, attendeeRecords.length),
    audience: mapAudience(record.audience ?? record.for ?? record.description),
    organiser:
      nestedStr(
        record.organiser ??
          record.organizer ??
          record.organizerName ??
          record.createdBy,
        ["name", "fullName"],
      ) || undefined,
    virtualLink:
      str(record.virtualLink ?? record.meetingLink ?? record.link) || undefined,
  };
}

function matchesFilter(meeting: ManagedMeeting, filter: MeetingFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Today") {
    return meeting.date === todayKey() || meeting.when === "Today";
  }
  if (filter === "Upcoming") return meeting.date > todayKey();
  if (filter === "For Admin") return meeting.audience === "For Admin";
  return meeting.audience === "For HOD";
}

const emptyCreateForm = {
  title: "",
  for: "Admin",
  organiser: "",
  date: "",
  time: "10:00",
  mins: "60",
  location: "",
  virtualLink: "",
  reminder: "30",
  attendeeDraft: "",
  agendaDraft: "",
};

function addToken(list: string[], value: string) {
  const next = value.trim();
  if (!next || list.some((item) => item.toLowerCase() === next.toLowerCase())) {
    return list;
  }
  return [...list, next];
}

export function SecretaryMeetingsPage() {
  const { runAction } = usePageActions();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const activeFilter = meetingFilterFromPath(pathname);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<ManagedMeeting[]>([]);
  const [form, setForm] = useState(emptyCreateForm);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [agenda, setAgenda] = useState<string[]>([]);

  const { data, loading, error } = useAsyncData(
    () => secretaryApi.listMeetings(),
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

  const meetings = useMemo((): ManagedMeeting[] => {
    const records = Array.isArray(data)
      ? data
      : listFrom((data ?? undefined) as never);
    const mapped = records.map((record, index) => mapMeeting(record, index));
    return [...mapped, ...created];
  }, [created, data]);

  const stats = useMemo((): MeetingStat[] => {
    const counts: Record<MeetingFilter, number> = {
      All: meetings.length,
      Today: meetings.filter((item) => matchesFilter(item, "Today")).length,
      Upcoming: meetings.filter((item) => matchesFilter(item, "Upcoming")).length,
      "For Admin": meetings.filter((item) => matchesFilter(item, "For Admin"))
        .length,
      "For HODs": meetings.filter((item) => matchesFilter(item, "For HODs"))
        .length,
    };
    return meetingStatCards.map((stat) => ({
      ...stat,
      value: String(counts[stat.filter]),
    }));
  }, [meetings]);

  const filteredMeetings = useMemo(
    () => meetings.filter((meeting) => matchesFilter(meeting, activeFilter)),
    [activeFilter, meetings],
  );

  function closeCreate() {
    setCreateOpen(false);
    setForm(emptyCreateForm);
    setAttendees([]);
    setAgenda([]);
  }

  function openCreate() {
    setForm(emptyCreateForm);
    setAttendees([]);
    setAgenda([]);
    setCreateOpen(true);
  }

  function addAttendee() {
    setAttendees((current) => addToken(current, form.attendeeDraft));
    setForm((current) => ({ ...current, attendeeDraft: "" }));
  }

  function addAgendaItem() {
    setAgenda((current) => addToken(current, form.agendaDraft));
    setForm((current) => ({ ...current, agendaDraft: "" }));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const date = form.date || todayKey();
    const mins = form.mins.trim() || "60";
    const location = form.location.trim() || (form.virtualLink ? "Virtual" : "TBD");
    const next: ManagedMeeting = {
      id: `new-${Date.now()}`,
      title: form.title.trim(),
      date,
      when: whenFromDate(date),
      time: formatTime(form.time),
      duration: `${mins}m`,
      location,
      virtual: Boolean(form.virtualLink) || location.toLowerCase().includes("virtual"),
      attendees: Math.max(attendees.length, 1),
      audience: mapAudience(form.for),
      organiser: form.organiser.trim() || undefined,
      virtualLink: form.virtualLink.trim() || undefined,
      reminder: form.reminder,
      people: attendees.map((name, index) => ({
        id: `attendee-${index}`,
        name,
        initials: initials(name),
        avatarColor: avatarColor(name),
      })),
      agenda,
    };
    await runAction("Schedule meeting", async () => {
      const startsAt = `${date}T${form.time || "10:00"}:00`;
      const endsAt = new Date(
        new Date(startsAt).getTime() + Number(mins) * 60_000,
      ).toISOString();
      const startAt = new Date(startsAt).toISOString();
      await secretaryApi.createMeeting({
        title: next.title,
        description: next.audience,
        start: startAt,
        startAt,
        end: endsAt,
        endAt: endsAt,
        date,
        time: form.time || "10:00",
        durationMinutes: Number(mins),
        location,
        meetingLink: next.virtualLink,
        organiser: form.organiser.trim() || undefined,
        organizerName: form.organiser.trim() || undefined,
        audience: next.audience === "For HOD" ? "HOD" : "ADMIN",
        reminderMinutes: Number(form.reminder),
        reminders: [{ minutesBefore: Number(form.reminder) }],
        attendees,
        attendeeNames: attendees,
        agenda,
        agendaItems: agenda,
      });
      setCreated((current) => [...current, next]);
    });
    closeCreate();
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
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
          <p className={styles.breadcrumb}>Secretary • Meetings</p>
          <h1 className={styles.title}>Meetings</h1>
          <p className={styles.subtitle}>
            Schedule and manage meetings for Admin and HODs — attendees,
            agendas, locations, links and reminders.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={openCreate}
        >
          <Plus size={16} />
          New meeting
        </button>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <Link
            key={stat.id}
            href={meetingFilterHrefs[stat.filter]}
            className={`${styles.statCard} ${
              activeFilter === stat.filter ? styles.statCardActive : ""
            }`}
          >
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span
              className={
                stat.tone === "action"
                  ? styles.statTagAction
                  : stat.tone === "muted"
                    ? styles.statTagMuted
                    : styles.statTagSoft
              }
            >
              {stat.tag}
            </span>
          </Link>
        ))}
      </div>

      <div className={styles.filters} role="tablist" aria-label="Meeting filters">
        {meetingFilters.map((filter) => {
          const active = activeFilter === filter;
          return (
            <Link
              key={filter}
              href={meetingFilterHrefs[filter]}
              role="tab"
              aria-selected={active}
              className={`${styles.filterChip} ${
                active ? styles.filterChipActive : ""
              }`}
            >
              {filter}
            </Link>
          );
        })}
      </div>

      <div className={styles.list}>
        {filteredMeetings.map((meeting) => (
          <Link
            key={meeting.id}
            href={`/secretary/meetings/${meeting.id}`}
            className={styles.listRow}
          >
            <span
              className={`${styles.whenBadge} ${
                meeting.when === "Today" ? styles.whenBadgeToday : ""
              }`}
            >
              {meeting.when}
            </span>
            <div className={styles.rowBody}>
              <div className={styles.titleRow}>
                <h2 className={styles.name}>{meeting.title}</h2>
                <span className={styles.audience}>{meeting.audience}</span>
              </div>
              <p className={styles.meta}>
                <span>
                  <Clock3 size={13} />
                  {meeting.time} · {meeting.duration}
                </span>
                {meeting.location &&
                meeting.location.toLowerCase() !== "virtual" ? (
                  <span>
                    <MapPin size={13} />
                    {meeting.location}
                  </span>
                ) : null}
                {meeting.virtual ? (
                  <span>
                    <Video size={13} />
                    Virtual
                  </span>
                ) : null}
                <span>
                  <Users size={13} />
                  {meeting.attendees}
                </span>
              </p>
            </div>
            <ChevronRight size={18} className={styles.chevron} />
          </Link>
        ))}

        {filteredMeetings.length === 0 ? (
          <div className={styles.empty}>No meetings match this filter.</div>
        ) : null}
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
            aria-labelledby="create-meeting-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalAccent} aria-hidden />
            <div className={styles.modalHead}>
              <div>
                <h2 id="create-meeting-title" className={styles.modalTitle}>
                  Create meeting
                </h2>
                <p className={styles.modalCopy}>
                  Schedule a meeting for Admin or a HOD.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                aria-label="Close"
                onClick={closeCreate}
              >
                <X size={16} />
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                <label className={styles.modalField}>
                  <span>
                    Title <em>*</em>
                  </span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Weekly leadership sync"
                    required
                  />
                </label>

                <div className={styles.modalPair}>
                  <label className={styles.modalField}>
                    <span>For</span>
                    <select
                      name="for"
                      value={form.for}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          for: event.target.value,
                        }))
                      }
                    >
                      <option value="Admin">Admin</option>
                      <option value="HOD">HOD</option>
                    </select>
                  </label>
                  <label className={styles.modalField}>
                    <span>Organiser</span>
                    <input
                      name="organiser"
                      value={form.organiser}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          organiser: event.target.value,
                        }))
                      }
                      placeholder="David Okoye (Admin)"
                    />
                  </label>
                </div>

                <div className={styles.modalTriple}>
                  <label className={styles.modalField}>
                    <span>
                      Date <em>*</em>
                    </span>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          date: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className={styles.modalField}>
                    <span>Time</span>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          time: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className={styles.modalField}>
                    <span>Mins</span>
                    <input
                      type="number"
                      name="mins"
                      min={15}
                      step={15}
                      value={form.mins}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          mins: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <label className={styles.modalField}>
                  <span className={styles.fieldLabel}>
                    <MapPin size={14} />
                    Location
                  </span>
                  <input
                    name="location"
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    placeholder="e.g. Boardroom A"
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.fieldLabel}>
                    <Link2 size={14} />
                    Virtual link
                  </span>
                  <input
                    type="url"
                    name="virtualLink"
                    value={form.virtualLink}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        virtualLink: event.target.value,
                      }))
                    }
                    placeholder="https://meet.afresh.co/..."
                  />
                </label>

                <label className={styles.modalField}>
                  <span className={styles.fieldLabel}>
                    <Bell size={14} />
                    Reminder (minutes before)
                  </span>
                  <select
                    name="reminder"
                    value={form.reminder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        reminder: event.target.value,
                      }))
                    }
                  >
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                    <option value="60">60</option>
                  </select>
                </label>

                <div className={styles.modalField}>
                  <span className={styles.fieldLabel}>
                    <Users size={14} />
                    Attendees
                  </span>
                  <div className={styles.addRow}>
                    <input
                      name="attendeeDraft"
                      value={form.attendeeDraft}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          attendeeDraft: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addAttendee();
                        }
                      }}
                      placeholder="Add a name and press Enter"
                    />
                    <button
                      type="button"
                      className={styles.addButton}
                      aria-label="Add attendee"
                      onClick={addAttendee}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {attendees.length > 0 ? (
                    <div className={styles.chipList}>
                      {attendees.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className={styles.chip}
                          onClick={() =>
                            setAttendees((current) =>
                              current.filter((item) => item !== name),
                            )
                          }
                        >
                          {name}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={styles.modalField}>
                  <span className={styles.fieldLabel}>
                    <List size={14} />
                    Agenda items
                  </span>
                  <div className={styles.addRow}>
                    <input
                      name="agendaDraft"
                      value={form.agendaDraft}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          agendaDraft: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addAgendaItem();
                        }
                      }}
                      placeholder="Add an agenda item and press Enter"
                    />
                    <button
                      type="button"
                      className={styles.addButton}
                      aria-label="Add agenda item"
                      onClick={addAgendaItem}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {agenda.length > 0 ? (
                    <div className={styles.chipList}>
                      {agenda.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={styles.chip}
                          onClick={() =>
                            setAgenda((current) =>
                              current.filter((entry) => entry !== item),
                            )
                          }
                        >
                          {item}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
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
                  <CalendarDays size={15} />
                  Schedule meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
