"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  announcements,
  announcementStats,
  type AnnouncementCategory,
  type AnnouncementFilter,
} from "@/data/announcements";
import styles from "./AnnouncementsPage.module.css";

const filters: AnnouncementFilter[] = ["All", "Unread", "Pinned"];
const categories: AnnouncementCategory[] = ["All", "Finance", "General", "Urgent"];

const tagClass = {
  finance: styles.tagFinance,
  urgent: styles.tagUrgent,
  hr: styles.tagHr,
  general: styles.tagGeneral,
  pinned: styles.tagPinned,
} as const;

export function AnnouncementsPage() {
  const [activeFilter, setActiveFilter] = useState<AnnouncementFilter>("All");
  const [activeCategory, setActiveCategory] = useState<AnnouncementCategory>("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState("1");

  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Unread" && item.unread) ||
        (activeFilter === "Pinned" && item.pinned);
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const haystack = `${item.title} ${item.source} ${item.body}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesCategory && matchesQuery;
    });
  }, [activeFilter, activeCategory, query]);

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Sunday, Aug 01</p>
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
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.iconButton}>
              <UserRound size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Announcement</p>
          <h1 className={styles.title}>The company, speaking clearly</h1>
          <p className={styles.subtitle}>
            Company-wide communications, policy updates, and important notices —
            all in one place.
          </p>
        </div>

        <div className={styles.stats}>
          {announcementStats.map((stat) => (
            <div key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span
                  className={`${styles.badge} ${
                    stat.badge === "New"
                      ? styles.badgeNew
                      : stat.badge === "All time"
                        ? styles.badgeMuted
                        : ""
                  }`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {filters.map((filter) => (
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

          <div className={styles.toolbarActions}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`${styles.categoryButton} ${
                  activeCategory === category ? styles.categoryButtonActive : ""
                }`}
              >
                {category}
              </button>
            ))}
            <button type="button" className={styles.createButton}>
              <Plus size={15} strokeWidth={2.5} />
              Create
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {filtered.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <article key={item.id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardHeader}
                  onClick={() => setExpandedId(expanded ? "" : item.id)}
                >
                  <div className={styles.avatar}>{item.initials}</div>
                  <div className={styles.cardMain}>
                    <div className={styles.titleRow}>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag.label}`}
                          className={`${styles.tag} ${tagClass[tag.tone]}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <p className={styles.meta}>
                      {item.source}
                      <span className={styles.dot}>•</span>
                      {item.date}
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronDown size={18} className={styles.chevron} />
                  ) : (
                    <ChevronRight size={18} className={styles.chevron} />
                  )}
                </button>

                {expanded && (
                  <>
                    <p className={styles.body}>{item.body}</p>
                    <div className={styles.cardFooter}>
                      <button type="button" className={styles.loginLink}>
                        Log in →
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className={styles.empty}>No announcements in this view.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
