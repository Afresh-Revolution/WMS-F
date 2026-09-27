"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  ChevronRight,
  Heart,
  Megaphone,
  Pin,
  Plus,
  Search,
  Triangle,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  announcements as seedAnnouncements,
  announcementStats as seedStats,
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementFilter,
  type AnnouncementTagTone,
} from "@/data/announcements";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  getStaffUnreadCount,
  listStaffAnnouncements,
  markStaffAnnouncementRead,
  publishStaffAnnouncement,
  staffUnreadCountFrom,
} from "@/lib/api";
import { listFrom, mapAnnouncement, str } from "@/lib/api/mappers";
import shared from "../announcements/AnnouncementsPage.module.css";
import styles from "./EmployeeAnnouncementsPage.module.css";

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
  finance: shared.tagFinance,
  urgent: shared.tagUrgent,
  hr: shared.tagHr,
  general: shared.tagGeneral,
  pinned: shared.tagPinned,
};

function TagIcon({ tone }: { tone: AnnouncementTagTone }) {
  if (tone === "finance") return <Briefcase size={11} strokeWidth={2} />;
  if (tone === "hr") return <Heart size={11} strokeWidth={2} />;
  if (tone === "general") return <Bell size={11} strokeWidth={2} />;
  if (tone === "urgent") return <AlertTriangle size={11} strokeWidth={2} />;
  if (tone === "pinned") return <Pin size={11} strokeWidth={2} />;
  return null;
}

function currentMonthLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function isInCurrentMonth(value?: string) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  return (
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear()
  );
}

const createFields = [
  {
    name: "title",
    label: "Title",
    required: true,
    fullWidth: true,
    placeholder: "Announcement title",
  },
  {
    name: "category",
    label: "Category",
    type: "select" as const,
    required: true,
    fullWidth: true,
    defaultValue: "General",
    options: [
      { label: "General", value: "General" },
      { label: "HR", value: "HR" },
      { label: "Finance", value: "Finance" },
      { label: "Urgent", value: "Urgent" },
    ],
  },
  {
    name: "audienceType",
    label: "Audience",
    type: "select" as const,
    required: true,
    fullWidth: true,
    defaultValue: "all_staff",
    options: [{ label: "All staff", value: "all_staff" }],
  },
  {
    name: "message",
    type: "textarea" as const,
    required: true,
    fullWidth: true,
    rows: 4,
    placeholder: "Write your announcement...",
  },
  {
    name: "isPinned",
    label: "Pin this announcement",
    type: "checkbox" as const,
    defaultValue: "false",
  },
];

export function EmployeeAnnouncementsPage() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [activeFilter, setActiveFilter] = useState<AnnouncementFilter>("All");
  const [activeCategory, setActiveCategory] = useState<AnnouncementCategory>("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [didAutoExpand, setDidAutoExpand] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());
  const [localPinned, setLocalPinned] = useState<Record<string, boolean>>({});

  const { data, loading, error, refetch } = useAsyncData(
    () => listStaffAnnouncements(),
    [],
  );
  const { data: unreadPayload } = useAsyncData(
    () => getStaffUnreadCount().catch(() => null),
    [],
  );

  const liveAnnouncements = useMemo((): Announcement[] => {
    return listFrom(data ?? undefined).map((record) => {
      const item = mapAnnouncement(record);
      return {
        ...item,
        unread: localRead.has(item.id) ? false : item.unread,
        pinned: localPinned[item.id] ?? item.pinned,
        tags:
          (localPinned[item.id] ?? item.pinned)
            ? item.tags.some((tag) => tag.tone === "pinned")
              ? item.tags
              : [...item.tags, { label: "Pinned", tone: "pinned" as const }]
            : item.tags.filter((tag) => tag.tone !== "pinned"),
      };
    });
  }, [data, localPinned, localRead]);

  const usingSeed = liveAnnouncements.length === 0 && !loading;
  const announcements = usingSeed
    ? seedAnnouncements.map((item) => ({
        ...item,
        unread: localRead.has(item.id) ? false : item.unread,
        pinned: localPinned[item.id] ?? item.pinned,
        tags:
          (localPinned[item.id] ?? item.pinned)
            ? item.tags.some((tag) => tag.tone === "pinned")
              ? item.tags
              : [...item.tags, { label: "Pinned", tone: "pinned" as const }]
            : item.tags.filter((tag) => tag.tone !== "pinned"),
      }))
    : liveAnnouncements;

  useEffect(() => {
    if (announcements.length === 0) return;
    if (!didAutoExpand) {
      setExpandedId(announcements[0].id);
      setDidAutoExpand(true);
      return;
    }
    if (expandedId && !announcements.some((item) => item.id === expandedId)) {
      setExpandedId("");
    }
  }, [announcements, didAutoExpand, expandedId]);

  const stats = useMemo(() => {
    if (usingSeed) return seedStats;
    const unread =
      staffUnreadCountFrom(unreadPayload) ||
      announcements.filter((item) => item.unread).length;
    const pinned = announcements.filter((item) => item.pinned).length;
    const thisMonth = announcements.filter((item) =>
      isInCurrentMonth(item.publishedAt || item.date),
    ).length;
    return [
      { id: "unread", label: "Unread", value: String(unread), badge: "New" },
      { id: "pinned", label: "Pinned", value: String(pinned), badge: "Active" },
      {
        id: "month",
        label: "Total This Month",
        value: String(thisMonth),
        badge: currentMonthLabel(),
      },
      {
        id: "recipients",
        label: "Recipients",
        value: "—",
        badge: "All staff",
      },
    ];
  }, [announcements, unreadPayload, usingSeed]);

  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Pinned" && item.pinned) ||
        (activeFilter === "Unread" && item.unread);
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const haystack = `${item.title} ${item.source} ${item.body}`.toLowerCase();
      return (
        matchesFilter &&
        matchesCategory &&
        haystack.includes(query.trim().toLowerCase())
      );
    });
  }, [activeCategory, activeFilter, announcements, query]);

  async function toggleCard(item: Announcement) {
    const next = expandedId === item.id ? "" : item.id;
    setExpandedId(next);
    if (next && item.unread) {
      try {
        await markStaffAnnouncementRead(item.id);
      } catch {
        /* keep the card usable if mark-read is unavailable */
      }
      setLocalRead((current) => new Set(current).add(item.id));
    }
  }

  function togglePin(item: Announcement) {
    setLocalPinned((current) => ({
      ...current,
      [item.id]: !(current[item.id] ?? item.pinned),
    }));
  }

  async function handleCreate(values: Record<string, string>) {
    await runAction("Publish announcement", async () => {
      await publishStaffAnnouncement({
        title: values.title.trim(),
        message: values.message.trim(),
        category: values.category,
        audienceType: values.audienceType || "all_staff",
        isPinned: values.isPinned,
        status: "published",
        author: user?.name ?? "",
        initials: user?.initials ?? "",
      });
      refetch();
    });
  }

  return (
    <>
      <div className={shared.page}>
        <header className={shared.topBar}>
          <PageDateLabel className={shared.dateLabel} />
          {loading ? <p className={shared.dateLabel}>Loading announcements…</p> : null}
          {error && !usingSeed ? (
            <p className={shared.dateLabel} role="alert">
              {error}
            </p>
          ) : null}
          <div className={shared.topActions}>
            <label className={shared.search}>
              <Search size={15} className={shared.searchIcon} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className={shared.searchInput}
                aria-label="Search"
              />
              <kbd className={shared.searchShortcut}>⌘K</kbd>
            </label>
            <NotificationsLink className={shared.iconButton} />
            <ProfileLink className={shared.avatarChip}>
              {user?.initials || "—"}
            </ProfileLink>
          </div>
        </header>

        <div className={shared.header}>
          <div>
            <p className={shared.eyebrow}>Announcements</p>
            <h1 className={shared.title}>The company, speaking clearly</h1>
            <p className={shared.subtitle}>
              Company-wide communications, policy updates, and important notices
              — all in one place.
            </p>
          </div>
          <div className={shared.headerActions}>
            <button
              type="button"
              className={shared.newButton}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              New announcement
            </button>
          </div>
        </div>

        <div className={shared.stats}>
          {stats.map((stat, index) => (
            <article
              key={stat.id}
              className={`${shared.statCard} ${
                index === 0 ? shared.statCardFeatured : ""
              }`}
            >
              <div className={shared.statTop}>
                <p className={shared.statLabel}>{stat.label}</p>
                <span
                  className={`${shared.badge} ${
                    stat.badge === "New" || stat.badge === "Active"
                      ? shared.badgeActive
                      : shared.badgeMuted
                  }`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className={shared.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={shared.toolbar}>
          <div className={shared.filters}>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${shared.filterChip} ${
                  activeFilter === filter ? shared.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className={shared.categoryFilters}>
            {categories.map((category) => {
              const Icon = category.icon;
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`${shared.categoryButton} ${
                    active ? shared.categoryButtonActive : ""
                  }`}
                >
                  {Icon ? <Icon size={13} strokeWidth={2} /> : null}
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={shared.list}>
          {filtered.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <article key={item.id} className={shared.card}>
                <button
                  type="button"
                  className={shared.cardHeader}
                  onClick={() => void toggleCard(item)}
                >
                  <div className={shared.avatar}>{item.initials}</div>
                  <div className={shared.cardMain}>
                    <div className={shared.titleRow}>
                      {item.unread ? (
                        <span
                          className={`${shared.unreadDot} ${styles.unreadDot}`}
                          aria-label="Unread"
                        />
                      ) : null}
                      <h2
                        className={`${shared.cardTitle} ${
                          item.unread ? shared.cardTitleUnread : ""
                        }`}
                      >
                        {item.title}
                      </h2>
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag.label}`}
                          className={`${shared.tag} ${tagClass[tag.tone]}`}
                        >
                          <TagIcon tone={tag.tone} />
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <p className={shared.meta}>
                      {item.source}
                      <span className={shared.dot}>·</span>
                      {item.date}
                    </p>
                  </div>
                  <ChevronRight size={18} className={shared.chevron} />
                </button>

                {expanded ? (
                  <>
                    <p className={shared.body}>{item.body}</p>
                    <div className={shared.cardFooter}>
                      <div className={shared.cardFooterActions}>
                        <button
                          type="button"
                          className={shared.unpinButton}
                          onClick={() => togglePin(item)}
                        >
                          <Pin size={14} strokeWidth={2} />
                          {item.pinned ? "Unpin" : "Pin"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </article>
            );
          })}

          {filtered.length === 0 ? (
            <div className={shared.empty}>
              {loading ? "Loading announcements…" : "No announcements in this view."}
            </div>
          ) : null}
        </div>

        <div className={styles.prototypeWrap}>
          <span className={styles.prototypeChip}>
            <Triangle size={11} fill="currentColor" />
            Prototype: Employee
          </span>
        </div>
      </div>

      <SimpleModal
        open={createOpen}
        title="New announcement"
        fields={createFields}
        submitLabel="Publish"
        submitIcon={<Megaphone size={15} strokeWidth={2.25} />}
        showClose
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
