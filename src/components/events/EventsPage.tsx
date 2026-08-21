"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays, Check, Plus, Search, Send } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  events,
  statsByFilter,
  type EventFilter,
} from "@/data/events";
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

type EventsPageProps = {
  initialFilter?: EventFilter;
};

export function EventsPage({ initialFilter = "All" }: EventsPageProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<EventFilter>(initialFilter);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const currentStats = statsByFilter[activeFilter];

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        activeFilter === "All" || event.category === activeFilter;
      const haystack =
        `${event.title} ${event.audience} ${event.description}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  function handleFilterChange(filter: EventFilter) {
    setActiveFilter(filter);
    router.push(filterRoutes[filter]);
  }

  return (
    <AppShell>
      <div className={styles.page}>
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
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </label>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
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
          <button type="button" className={styles.createButton}>
            <Plus size={16} strokeWidth={2.5} />
            Create event
          </button>
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
                  <button type="button" className={styles.sentButton}>
                    <Check size={14} strokeWidth={2.5} />
                    Sent to HODs
                  </button>
                )}
                {event.action === "send-now" && (
                  <button type="button" className={styles.sendNowButton}>
                    <Send size={14} />
                    Send now
                  </button>
                )}
                <button type="button" className={styles.editButton}>
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
    </AppShell>
  );
}
