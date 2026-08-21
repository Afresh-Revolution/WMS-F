"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Heart,
  Pin,
  Plus,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  announcements,
  announcementStats,
  type AnnouncementCategory,
  type AnnouncementFilter,
  type AnnouncementTagTone,
} from "@/data/announcements";
import styles from "./AnnouncementsPage.module.css";

const filters: AnnouncementFilter[] = ["All", "Unread", "Pinned"];

const categories: {
  id: AnnouncementCategory;
  label: string;
  icon?: typeof Heart;
}[] = [
  { id: "All", label: "All" },
  { id: "HR", label: "HR", icon: Heart },
  { id: "Finance", label: "Finance", icon: Briefcase },
  { id: "General", label: "General", icon: Bell },
  { id: "Urgent", label: "Urgent", icon: AlertTriangle },
];

const tagClass: Record<AnnouncementTagTone, string> = {
  finance: styles.tagFinance,
  urgent: styles.tagUrgent,
  hr: styles.tagHr,
  general: styles.tagGeneral,
  pinned: styles.tagPinned,
};

function TagIcon({ tone }: { tone: AnnouncementTagTone }) {
  if (tone === "finance") return <Briefcase size={11} strokeWidth={2} />;
  if (tone === "hr") return <Heart size={11} strokeWidth={2} />;
  if (tone === "general") return <Bell size={11} strokeWidth={2} />;
  if (tone === "urgent") return <AlertTriangle size={11} strokeWidth={2} />;
  if (tone === "pinned") return <Pin size={11} strokeWidth={2} />;
  return null;
}

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
            <p className={styles.eyebrow}>Announcements</p>
            <h1 className={styles.title}>The company, speaking clearly</h1>
            <p className={styles.subtitle}>
              Company-wide communications, policy updates, and important notices —
              all in one place.
            </p>
          </div>
          <button type="button" className={styles.newButton}>
            <Plus size={16} strokeWidth={2.5} />
            New announcement
          </button>
        </div>

        <div className={styles.stats}>
          {announcementStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span
                  className={`${styles.badge} ${
                    stat.badge === "New"
                      ? styles.badgeNew
                      : stat.badge === "Active"
                        ? styles.badgeActive
                        : styles.badgeMuted
                  }`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
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

          <div className={styles.categoryFilters}>
            {categories.map((category) => {
              const Icon = category.icon;
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`${styles.categoryButton} ${
                    active ? styles.categoryButtonActive : ""
                  }`}
                >
                  {Icon && <Icon size={13} strokeWidth={2} />}
                  {category.label}
                </button>
              );
            })}
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
                      <h2
                        className={`${styles.cardTitle} ${
                          item.unread ? styles.cardTitleUnread : ""
                        }`}
                      >
                        {item.title}
                      </h2>
                      {item.unread && (
                        <span className={styles.unreadDot} aria-label="Unread" />
                      )}
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag.label}`}
                          className={`${styles.tag} ${tagClass[tag.tone]}`}
                        >
                          <TagIcon tone={tag.tone} />
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <p className={styles.meta}>
                      {item.source}
                      <span className={styles.dot}>·</span>
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
                    {item.pinned && (
                      <div className={styles.cardFooter}>
                        <button type="button" className={styles.unpinButton}>
                          <Pin size={14} strokeWidth={2} />
                          Unpin
                        </button>
                      </div>
                    )}
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
