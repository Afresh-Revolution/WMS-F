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
import { AppShell } from "@/components/layout/AppShell";
import {
  meetingFilters,
  meetingStats,
  type MeetingFilter,
  type MeetingTag,
} from "@/data/meetings";
import { useManagerMeetings } from "@/lib/hooks/useManagerApi";
import styles from "./MeetingsPage.module.css";

const tagClass: Record<MeetingTag, string> = {
  Upcoming: styles.tagUpcoming,
  "Company-wide": styles.tagCompany,
  Completed: styles.tagCompleted,
};

export function MeetingsPage() {
  const [activeFilter, setActiveFilter] = useState<MeetingFilter>("Upcoming");
  const { items: meetings } = useManagerMeetings();

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Upcoming") {
        return meeting.tags.includes("Upcoming");
      }
      if (activeFilter === "Completed") {
        return meeting.tags.includes("Completed");
      }
      return meeting.tags.includes("Company-wide") || meeting.category === "Company-wide";
    });
  }, [activeFilter, meetings]);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <button type="button" aria-label="Filters" className={styles.iconButton}>
              <SlidersHorizontal size={16} />
            </button>
            <button type="button" aria-label="Share" className={styles.iconButton}>
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
          <button type="button" className={styles.createButton}>
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
                  <button type="button" className={styles.actionLink}>
                    Details
                  </button>
                  <button type="button" className={styles.actionLink}>
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
      </div>
    </AppShell>
  );
}
