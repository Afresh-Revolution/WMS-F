"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Check, Plus, Search, Send } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import {
  type EventFilter,
  type EventItem,
} from "@/data/events";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { listFrom, mapDepartment, mapEvent } from "@/lib/api/mappers";
import { portalHref } from "@/lib/portalPaths";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./EventsPage.module.css";

function countLabel(value: unknown, fallback: number, empty = String(fallback)): string {
  if (value === null || value === undefined || value === "") return empty;
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : empty;
}

const filters: EventFilter[] = ["All", "Upcoming", "Sponsorship", "Completed"];

const filterRoutes: Record<EventFilter, string> = {
  All: "/events",
  Upcoming: "/events/upcoming",
  Sponsorship: "/events/sponsorship",
  Completed: "/events/completed",
};

const tagClass = {
  internal: styles.tagInternal,
  external: styles.tagExternal,
  company: styles.tagCompany,
  upcoming: styles.tagUpcoming,
  completed: styles.tagCompleted,
  sponsorship: styles.tagSponsorship,
  draft: styles.tagDraft,
} as const;

const badgeClass = {
  confirmed: styles.badgeConfirmed,
  draft: styles.badgeDraft,
  meta: styles.badgeMeta,
} as const;

const eventTypeOptions = [
  { label: "Internal", value: "Internal" },
  { label: "External", value: "External" },
  { label: "Company-wide", value: "Company-wide" },
];

function eventTypeFromItem(event: EventItem): string {
  const tag = event.tags.find(
    (item) =>
      item.tone === "internal" ||
      item.tone === "external" ||
      item.tone === "company",
  );
  if (tag?.tone === "external") return "External";
  if (tag?.tone === "company") return "Company-wide";
  return "Internal";
}

function createdEventId(payload: unknown): string {
  const record = unwrapRecord(payload);
  return String(record.id ?? record._id ?? "");
}

type EventsPageProps = {
  initialFilter?: EventFilter;
};

export function EventsPage({ initialFilter = "All" }: EventsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeFilter, setActiveFilter] = useState<EventFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const { runAction } = usePageActions();
  const manager = useManagerPortal();

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const filterParam =
    activeFilter === "All" ? undefined : activeFilter.toLowerCase();

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      manager
        ? managerApi.listEvents(
            filterParam ? { category: filterParam } : undefined,
          )
        : superAdminApi.events.list(
            filterParam ? { category: filterParam } : undefined,
          ),
    [filterParam, manager],
  );
  const { data: departmentData } = useAsyncData(
    () =>
      manager
        ? managerApi.listDepartments({ limit: 200 })
        : superAdminApi.departments.list({ limit: 200 }),
    [manager],
  );

  const events = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapEvent(record));
  }, [data]);

  const audienceOptions = useMemo(() => {
    const departments = listFrom(departmentData ?? undefined)
      .map(mapDepartment)
      .filter((item) => item.name)
      .map((item) => ({ label: item.name, value: item.name }));
    const options = [
      { label: "All departments", value: "All departments" },
      ...departments.filter((item) => item.value !== "All departments"),
    ];
    if (
      editingEvent?.audience &&
      !options.some((item) => item.value === editingEvent.audience)
    ) {
      options.push({
        label: editingEvent.audience,
        value: editingEvent.audience,
      });
    }
    return options;
  }, [departmentData, editingEvent]);

  const currentStats = useMemo(() => {
    const summary = unwrapRecord(data);
    const upcoming = events.filter(
      (event) =>
        event.category === "Upcoming" ||
        event.tags.some((tag) => tag.tone === "upcoming"),
    ).length;
    const draft = events.filter((event) =>
      event.tags.some((tag) => tag.tone === "draft" || tag.label.toLowerCase() === "draft"),
    ).length;
    const notified = events.reduce(
      (sum, event) => sum + Number(event.notifiedStaff || 0),
      0,
    );
    return [
      {
        id: "upcoming",
        label: "Upcoming Events",
        value: countLabel(summary.upcomingEvents ?? summary.upcomingCount, upcoming),
        badge: "Confirmed",
        badgeTone: "confirmed" as const,
      },
      {
        id: "draft",
        label: "Draft Events",
        value: countLabel(summary.draftEvents ?? summary.drafts, draft),
        badge: "Not sent",
        badgeTone: "draft" as const,
      },
      {
        id: "notified",
        label: "Total Notified Staff",
        value: countLabel(
          summary.notifiedStaff ?? summary.totalNotified ?? summary.staffNotified,
          notified,
          notified ? String(notified) : "—",
        ),
        badge: "This month",
        badgeTone: "meta" as const,
      },
    ];
  }, [data, events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        activeFilter === "All" || event.category === activeFilter;
      const haystack =
        `${event.title} ${event.audience} ${event.description}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query, events]);

  function handleFilterChange(filter: EventFilter) {
    setActiveFilter(filter);
    router.push(portalHref(pathname, filterRoutes[filter]));
  }

  async function persistEvent(values: Record<string, string>, publish: boolean) {
    const title = values.title.trim();
    if (!title) {
      throw new Error("Enter an event title.");
    }
    const body = {
      title,
      type: values.type,
      eventType: values.type,
      date: values.date,
      audience: values.audience,
      targetAudience: values.audience,
      description: values.description.trim(),
      status: publish ? "published" : "draft",
      isDraft: !publish,
      notify: publish,
      sendNotification: publish,
      category: "Upcoming",
    };
    if (editingEvent) {
      await runAction(publish ? "Publish event" : "Update event", async () => {
        await (manager
          ? managerApi.updateEvent(editingEvent.id, body)
          : superAdminApi.events.patch(editingEvent.id, body));
        if (publish) {
          await (manager
            ? managerApi.sendEvent(editingEvent.id)
            : superAdminApi.events.action(editingEvent.id, "send"));
        }
        refetch();
      });
      return;
    }
    await runAction(publish ? "Publish & notify" : "Save draft", async () => {
      const created = await (manager
        ? managerApi.createEvent(body)
        : superAdminApi.events.create(body));
      if (publish) {
        const id = createdEventId(created);
        if (id) {
          try {
            await (manager
              ? managerApi.sendEvent(id)
              : superAdminApi.events.action(id, "send"));
          } catch {
            /* create already requested notify */
          }
        }
      }
      refetch();
    });
  }

  async function handleSave(values: Record<string, string>) {
    await persistEvent(values, !editingEvent);
  }

  async function handleSaveDraft(values: Record<string, string>) {
    await persistEvent(values, false);
  }

  async function sendEvent(event: EventItem) {
    await runAction("Send event", async () => {
      await (manager
        ? managerApi.sendEvent(event.id)
        : superAdminApi.events.action(event.id, "send"));
      refetch();
    });
  }

  function openCreate() {
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEdit(event: EventItem) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEvent(null);
  }

  const modalFields: ModalField[] = useMemo(
    () => [
      {
        name: "title",
        label: "Event title",
        required: true,
        fullWidth: true,
        defaultValue: editingEvent?.title ?? "",
      },
      {
        name: "type",
        label: "Type",
        type: "select",
        pair: "meta",
        defaultValue: editingEvent
          ? eventTypeFromItem(editingEvent)
          : "Internal",
        options: eventTypeOptions,
      },
      {
        name: "date",
        label: "Date",
        type: "date",
        required: true,
        pair: "meta",
        placeholder: "mm/dd/yyyy",
        defaultValue: editingEvent?.date ?? "",
      },
      {
        name: "audience",
        label: "Target audience",
        type: "select",
        required: true,
        fullWidth: true,
        defaultValue: editingEvent?.audience || "All departments",
        options: audienceOptions,
      },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        fullWidth: true,
        rows: 3,
        defaultValue: editingEvent?.description ?? "",
      },
    ],
    [audienceOptions, editingEvent],
  );

  return (
    <>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
          {loading ? <p className={styles.dateLabel}>Loading events…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </label>
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Events &amp; Sponsorships</p>
            <h1 className={styles.title}>Company events, shared clearly</h1>
            <p className={styles.subtitle}>
              Create and broadcast events to HODs and departments. Track
              notification delivery and engagement.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.createButton} onClick={openCreate}>
              <Plus size={16} strokeWidth={2.5} />
              Create event
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          {currentStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statCopy}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
              <span className={`${styles.badge} ${badgeClass[stat.badgeTone]}`}>
                {stat.badge}
              </span>
            </article>
          ))}
        </div>

        <div className={styles.filters}>
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className={styles.list}>
          {filteredEvents.map((event) => (
            <article key={event.id} className={styles.card}>
              <div className={styles.cardIcon}>
                <CalendarDays size={18} strokeWidth={2} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                  <h2 className={styles.cardTitle}>{event.title}</h2>
                  {event.tags.map((tag) => (
                    <span
                      key={`${event.id}-${tag.label}`}
                      className={`${styles.tag} ${tagClass[tag.tone] ?? styles.tagUpcoming}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
                <p className={styles.cardMeta}>
                  {event.date}
                  <span className={styles.dot}>·</span>
                  Audience: {event.audience}
                </p>
                <p className={styles.cardDescription}>{event.description}</p>
              </div>

              <div className={styles.cardActions}>
                {event.action === "sent" && (
                  <button type="button" className={styles.sentButton} disabled>
                    <Check size={14} strokeWidth={2.5} />
                    Sent to HODs
                  </button>
                )}
                {event.action === "send-now" && (
                  <button
                    type="button"
                    className={styles.sendNowButton}
                    onClick={() => void sendEvent(event)}
                  >
                    <Send size={14} />
                    Send now
                  </button>
                )}
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => openEdit(event)}
                >
                  Edit
                </button>
              </div>
            </article>
          ))}

          {filteredEvents.length === 0 && (
            <div className={styles.empty}>No events match this view.</div>
          )}
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingEvent ? "Edit event" : "Create event"}
        fields={modalFields}
        submitLabel={editingEvent ? "Save changes" : "Publish & notify"}
        submitIcon={
          editingEvent ? false : <Send size={15} strokeWidth={2.25} />
        }
        secondaryLabel={editingEvent ? undefined : "Save draft"}
        hideCancel={!editingEvent}
        showClose
        appearance="soft"
        onClose={closeModal}
        onSubmit={handleSave}
        onSecondary={editingEvent ? undefined : handleSaveDraft}
      />
    </>
  );
}
