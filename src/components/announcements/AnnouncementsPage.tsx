"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Download,
  Heart,
  Pin,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  type AnnouncementCategory,
  type AnnouncementFilter,
  type AnnouncementTagTone,
} from "@/data/announcements";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  listCompanyAnnouncements,
  publishCompanyAnnouncement,
  getAdminAnnouncementDashboard,
  publishAdminAnnouncement,
  pinAdminAnnouncement,
  unpinAdminAnnouncement,
  departmentsApi,
  lookupsApi,
} from "@/lib/api";
import { listFrom, mapAnnouncement, str, unwrapRecord } from "@/lib/api/mappers";
import styles from "./AnnouncementsPage.module.css";

const filters: AnnouncementFilter[] = ["All", "Drafts", "Pinned"];

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
  const [expandedId, setExpandedId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => listCompanyAnnouncements(),
    [],
  );
  const { data: dashboardData } = useAsyncData(
    () => getAdminAnnouncementDashboard().catch(() => null),
    [],
  );
  const { data: departmentData } = useAsyncData(async () => {
    const settled = await Promise.allSettled([
      lookupsApi.departments(),
      departmentsApi.list(),
    ]);
    for (const result of settled) {
      if (result.status === "fulfilled") return result.value;
    }
    return null;
  }, []);

  const announcements = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapAnnouncement(record));
  }, [data]);

  const departments = useMemo(
    () =>
      listFrom(departmentData ?? undefined)
        .map((record) => ({
          id: str(record.id ?? record._id),
          name: str(record.name ?? record.title ?? record.label),
        }))
        .filter((item) => item.id && item.name),
    [departmentData],
  );

  const announcementStats = useMemo(() => {
    const dash = unwrapRecord(dashboardData);
    const pinned = announcements.filter((item) => item.pinned).length;
    const drafts = announcements.filter(
      (item) => item.status === "draft" || item.status === "scheduled",
    ).length;
    return [
      {
        id: "unread",
        label: "Drafts",
        value: str(dash.drafts ?? dash.draftCount, String(drafts)),
        badge: "Open",
      },
      {
        id: "pinned",
        label: "Pinned",
        value: str(dash.pinned ?? dash.pinnedCount, String(pinned)),
        badge: "Active",
      },
      {
        id: "month",
        label: "Published",
        value: str(
          dash.published ?? dash.publishedCount ?? dash.total,
          String(announcements.filter((item) => item.status === "published").length || announcements.length),
        ),
        badge: "Live",
      },
      {
        id: "recipients",
        label: "Recipients",
        value: str(
          dash.recipients ?? dash.recipientCount ?? dash.totalRecipients,
          "—",
        ),
        badge: "All staff",
      },
    ];
  }, [announcements, dashboardData]);

  const createFields = useMemo(
    () => [
      { name: "title", label: "Title", required: true, fullWidth: true },
      {
        name: "message",
        label: "Message",
        type: "textarea" as const,
        required: true,
        fullWidth: true,
      },
      {
        name: "category",
        label: "Category",
        type: "select" as const,
        defaultValue: "General",
        options: [
          { label: "General", value: "General" },
          { label: "HR", value: "HR" },
          { label: "Finance", value: "Finance" },
          { label: "Events", value: "Events" },
          { label: "Security", value: "Security" },
        ],
      },
      {
        name: "priority",
        label: "Priority",
        type: "select" as const,
        defaultValue: "normal",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Important", value: "important" },
          { label: "Urgent", value: "urgent" },
        ],
      },
      {
        name: "audienceType",
        label: "Audience",
        type: "select" as const,
        defaultValue: "all_staff",
        options: [
          { label: "All staff", value: "all_staff" },
          { label: "One department", value: "department" },
        ],
      },
      {
        name: "departmentId",
        label: "Department",
        type: "select" as const,
        defaultValue: "",
        options: [
          { label: "Select department", value: "" },
          ...departments.map((department) => ({
            label: department.name,
            value: department.id,
          })),
        ],
      },
      {
        name: "isPinned",
        label: "Pin to top",
        type: "select" as const,
        defaultValue: "false",
        options: [
          { label: "No", value: "false" },
          { label: "Yes", value: "true" },
        ],
      },
      {
        name: "expiresAt",
        label: "Expires (optional)",
        type: "date" as const,
      },
      {
        name: "status",
        label: "When to send",
        type: "select" as const,
        defaultValue: "published",
        options: [
          { label: "Publish now", value: "published" },
          { label: "Save as draft", value: "draft" },
        ],
      },
    ],
    [departments],
  );

  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Drafts" &&
          (item.status === "draft" || item.status === "scheduled")) ||
        (activeFilter === "Pinned" && item.pinned) ||
        (activeFilter === "Unread" && item.unread);
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;
      const haystack = `${item.title} ${item.source} ${item.body}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesCategory && matchesQuery;
    });
  }, [activeFilter, activeCategory, query, announcements]);

  async function handleCreate(values: Record<string, string>) {
    await runAction(
      values.status === "draft" ? "Save draft" : "Publish announcement",
      async () => {
        await publishCompanyAnnouncement(values);
        refetch();
      },
    );
  }

  async function unpinAnnouncement(id: string) {
    await runAction("Unpin announcement", async () => {
      await unpinAdminAnnouncement(id);
      refetch();
    }).catch(() => undefined);
  }

  async function pinAnnouncement(id: string) {
    await runAction("Pin announcement", async () => {
      await pinAdminAnnouncement(id);
      refetch();
    }).catch(() => undefined);
  }

  async function publishDraft(id: string) {
    await runAction("Publish announcement", async () => {
      await publishAdminAnnouncement(id, true);
      refetch();
    }).catch(() => undefined);
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filtered.map((item) => ({
        title: item.title,
        source: item.source,
        date: item.date,
        category: item.category,
        pinned: item.pinned,
        unread: item.unread,
      })),
      "announcements.csv",
    );
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          {loading ? <p className={styles.dateLabel}>Loading announcements…</p> : null}
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
            <p className={styles.eyebrow}>Announcements</p>
            <h1 className={styles.title}>The company, speaking clearly</h1>
            <p className={styles.subtitle}>
              Company-wide communications, policy updates, and important notices —
              all in one place.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.exportButton} onClick={handleExport}>
              <Download size={15} />
              Export
            </button>
            <button
              type="button"
              className={styles.newButton}
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              New announcement
            </button>
          </div>
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
                    <div className={styles.cardFooter}>
                      {item.status === "draft" || item.status === "scheduled" ? (
                        <button
                          type="button"
                          className={styles.unpinButton}
                          onClick={() => void publishDraft(item.id)}
                        >
                          Publish
                        </button>
                      ) : null}
                      {item.pinned ? (
                        <button
                          type="button"
                          className={styles.unpinButton}
                          onClick={() => void unpinAnnouncement(item.id)}
                        >
                          <Pin size={14} strokeWidth={2} />
                          Unpin
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.unpinButton}
                          onClick={() => void pinAnnouncement(item.id)}
                        >
                          <Pin size={14} strokeWidth={2} />
                          Pin
                        </button>
                      )}
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

      <SimpleModal
        open={createOpen}
        title="New announcement"
        description="Publishing sends this to the staff feed. Drafts stay hidden until you publish."
        fields={createFields}
        submitLabel="Save"
        wide
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
