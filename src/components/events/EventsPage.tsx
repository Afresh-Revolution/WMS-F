"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Check, Plus, RefreshCw, Search, Send } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal, type ModalField } from "@/components/ui/SimpleModal";
import {
  type EventFilter,
  type EventItem,
} from "@/data/events";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi } from "@/lib/api";
import { listFrom, mapEvent } from "@/lib/api/mappers";
import { portalHref } from "@/lib/portalPaths";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./EventsPage.module.css";

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

const createFields: ModalField[] = [
  { name: "title", label: "Event title", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "audience", label: "Audience", required: true },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "category",
    label: "Category",
    type: "select",
    defaultValue: "Upcoming",
    options: [
      { label: "Upcoming", value: "Upcoming" },
      { label: "Sponsorship", value: "Sponsorship" },
      { label: "Completed", value: "Completed" },
    ],
  },
];

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
  const { runAction, exportRows } = usePageActions();
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

  const events = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapEvent(record));
  }, [data]);

  const currentStats = useMemo(() => {
    const filtered =
      activeFilter === "All"
        ? events
        : events.filter((event) => event.category === activeFilter);
    const sent = filtered.filter((event) => event.action === "sent").length;
    return [
      {
        id: "total",
        label: "Events",
        value: String(filtered.length),
        badge: activeFilter === "All" ? "All" : activeFilter,
        badgeTone: "meta" as const,
      },
      {
        id: "upcoming",
        label: "Upcoming",
        value: String(
          filtered.filter((event) => event.category === "Upcoming").length,
        ),
        badge: "Scheduled",
        badgeTone: "confirmed" as const,
      },
      {
        id: "sent",
        label: "Sent to HODs",
        value: String(sent),
        badge: "Delivered",
        badgeTone: "confirmed" as const,
      },
      {
        id: "draft",
        label: "Draft",
        value: String(
          filtered.filter((event) =>
            event.tags.some((tag) => tag.label.toLowerCase() === "draft"),
          ).length,
        ),
        badge: "Pending",
        badgeTone: "draft" as const,
      },
    ];
  }, [activeFilter, events]);

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

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredEvents.map((event) => ({
        title: event.title,
        date: event.date,
        audience: event.audience,
        category: event.category,
        description: event.description,
      })),
      "events.csv",
    );
  }

  async function handleSave(values: Record<string, string>) {
    if (editingEvent) {
      await runAction("Update event", async () => {
        await (manager
          ? managerApi.updateEvent(editingEvent.id, values)
          : superAdminApi.events.patch(editingEvent.id, values));
        refetch();
      });
    } else {
      await runAction("Create event", async () => {
        await (manager
          ? managerApi.createEvent(values)
          : superAdminApi.events.create(values));
        refetch();
      });
    }
  }

  async function sendEvent(event: EventItem) {
    await runAction("Send event", async () => {
      await superAdminApi.events.action(event.id, "send");
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

  const modalFields: ModalField[] = editingEvent
    ? createFields.map((field) => ({
        ...field,
        defaultValue:
          field.name === "category"
            ? editingEvent.category
            : field.name === "title"
              ? editingEvent.title
              : field.name === "date"
                ? editingEvent.date
                : field.name === "audience"
                  ? editingEvent.audience
                  : field.name === "description"
                    ? editingEvent.description
                    : field.defaultValue,
      }))
    : createFields;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
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
            <button
              type="button"
              aria-label="Refresh"
              className={styles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
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
            <button type="button" className={styles.exportButton} onClick={handleExport}>
              Export
            </button>
            <button type="button" className={styles.createButton} onClick={openCreate}>
              <Plus size={16} strokeWidth={2.5} />
              Create event
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          {currentStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span
                  className={`${styles.badge} ${
                    stat.badgeTone === "meta"
                      ? styles.badgeMetaPill
                      : badgeClass[stat.badgeTone]
                  }`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
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
                      className={`${styles.tag} ${tagClass[tag.tone]}`}
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
        description="Broadcast an event to HODs and departments."
        fields={modalFields}
        submitLabel={editingEvent ? "Save changes" : "Create event"}
        onClose={closeModal}
        onSubmit={handleSave}
      />
    </>
  );
}
