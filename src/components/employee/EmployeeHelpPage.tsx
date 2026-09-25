"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  ExternalLink,
  FileText,
  Fingerprint,
  Lightbulb,
  Mail,
  MessageCircle,
  PlayCircle,
  Search,
  Settings,
  Star,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  ApiError,
  asRecord,
  employeeApi,
  helpApi,
  unwrapRecord,
} from "@/lib/api";
import { listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import styles from "./EmployeeHelpPage.module.css";

type TopicStyle = {
  icon: LucideIcon;
  tone: string;
};

type HelpArticle = {
  id: string;
  title: string;
  category: string;
  body: string;
  minutes: number;
  views: number;
  href: string;
  kind: "article" | "faq" | "guide";
  popular: boolean;
};

type HelpTopic = {
  id: string;
  name: string;
  description: string;
  count: number;
  style: TopicStyle;
};

const topicStyles: Array<{ test: RegExp; style: TopicStyle }> = [
  { test: /attend/, style: { icon: Fingerprint, tone: "orange" } },
  { test: /leave|time.?off/, style: { icon: CalendarDays, tone: "blue" } },
  { test: /payroll|finance|expense|pay/, style: { icon: FileText, tone: "green" } },
  { test: /hr|record|people|onboard/, style: { icon: UserRound, tone: "purple" } },
  { test: /commun|announce|meeting|email/, style: { icon: Mail, tone: "peach" } },
  { test: /system|admin|role|permission/, style: { icon: Settings, tone: "red" } },
];

function topicStyle(name: string): TopicStyle {
  const haystack = name.toLowerCase();
  return (
    topicStyles.find((item) => item.test.test(haystack))?.style ?? {
      icon: CircleHelp,
      tone: "gray",
    }
  );
}

const catalogTopics: HelpTopic[] = [
  {
    id: "attendance",
    name: "Attendance",
    description: "Clock-in/out, corrections, exceptions & reports",
    count: 12,
    style: topicStyle("Attendance"),
  },
  {
    id: "leave",
    name: "Leave & Time Off",
    description: "Requests, balances, approvals & policies",
    count: 8,
    style: topicStyle("Leave & Time Off"),
  },
  {
    id: "payroll",
    name: "Payroll & Finance",
    description: "Payslips, expenses, reimbursements & vendors",
    count: 15,
    style: topicStyle("Payroll & Finance"),
  },
  {
    id: "hr",
    name: "HR & Records",
    description: "Onboarding, documents, promotions & exits",
    count: 10,
    style: topicStyle("HR & Records"),
  },
  {
    id: "communication",
    name: "Communication",
    description: "Announcements, meetings & company email",
    count: 6,
    style: topicStyle("Communication"),
  },
  {
    id: "system",
    name: "System & Admin",
    description: "Roles, permissions, integrations & backups",
    count: 9,
    style: topicStyle("System & Admin"),
  },
];

const catalogArticles: HelpArticle[] = [
  {
    id: "clock-in-out",
    title: "How to clock in and out",
    category: "Attendance",
    body: "Use the clock card on Home to clock in and out. The time shown is your actual clock-in from attendance.",
    minutes: 2,
    views: 1400,
    href: "/employee/attendance",
    kind: "article",
    popular: true,
  },
  {
    id: "leave-absence",
    title: "Requesting a leave of absence",
    category: "Leave & Time Off",
    body: "Open My Leave, choose Annual, Sick, Personal or Compassionate, then submit the dates. Your HOD reviews it before HR.",
    minutes: 3,
    views: 980,
    href: "/employee/leave",
    kind: "article",
    popular: true,
  },
  {
    id: "expense-claim",
    title: "Submitting an expense claim",
    category: "Payroll & Finance",
    body: "Add the expense from My Expenses, then submit a reimbursement claim with the receipt attached.",
    minutes: 2,
    views: 762,
    href: "/employee/reimbursements",
    kind: "article",
    popular: true,
  },
  {
    id: "attendance-correction",
    title: "Requesting an attendance correction",
    category: "Attendance",
    body: "Open Attendance, choose the day, and submit a correction. Your HOD reviews the request.",
    minutes: 3,
    views: 651,
    href: "/employee/attendance",
    kind: "article",
    popular: true,
  },
  {
    id: "payslip-deductions",
    title: "Viewing your payslip & deductions",
    category: "Payroll & Finance",
    body: "Payslips and deductions are issued by Finance. Ask HR if a published slip is missing from your records.",
    minutes: 1,
    views: 589,
    href: "/employee/records",
    kind: "article",
    popular: true,
  },
  {
    id: "leave-approval-chain",
    title: "How the leave approval chain works",
    category: "Leave & Time Off",
    body: "Leave goes to your HOD first, then HR. You cannot approve your own request.",
    minutes: 4,
    views: 504,
    href: "/employee/leave",
    kind: "article",
    popular: true,
  },
  {
    id: "getting-started",
    title: "Getting started with Afresh",
    category: "Onboarding",
    body: "Start from Home, then set your profile, clock in, and learn leave, expenses, and records from this help center.",
    minutes: 8,
    views: 0,
    href: "/employee",
    kind: "guide",
    popular: false,
  },
  {
    id: "understanding-payslip",
    title: "Understanding your payslip",
    category: "Payroll",
    body: "A payslip lists gross pay, deductions, and net pay for that period. Contact HR if a figure looks wrong.",
    minutes: 5,
    views: 0,
    href: "/employee/records",
    kind: "guide",
    popular: false,
  },
  {
    id: "team-attendance",
    title: "Managing your team's attendance",
    category: "HOD Guide",
    body: "HODs review clock-ins, exceptions, and correction requests for their team from attendance.",
    minutes: 6,
    views: 0,
    href: "/employee/attendance",
    kind: "guide",
    popular: false,
  },
  {
    id: "hr-approval-workflow",
    title: "The HR approval workflow",
    category: "HR Guide",
    body: "HR signs off after the HOD. Employees cannot approve their own leave, expenses, or record changes.",
    minutes: 10,
    views: 0,
    href: "/employee/leave",
    kind: "guide",
    popular: false,
  },
  {
    id: "faq-correction",
    title: "How do I request an attendance correction?",
    category: "Attendance",
    body: "Open Attendance, choose the affected day, and submit a correction. Your HOD reviews it.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-leave-approver",
    title: "Who approves my leave request?",
    category: "Leave & Time Off",
    body: "Your HOD approves first, then HR. You cannot approve your own leave.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-payroll",
    title: "When is payroll processed?",
    category: "Payroll & Finance",
    body: "Finance runs payroll on the scheduled pay cycle. Ask HR or Finance if you need the next pay date.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-clock-out",
    title: "What happens if I forget to clock out?",
    category: "Attendance",
    body: "Submit an attendance correction for that day so the record can be updated.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-personal-details",
    title: "How do I update my personal details?",
    category: "HR & Records",
    body: "Use Account Settings → Edit details for phone, personal email, and location. Full name, work email, job title, department, and role are managed by HR.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-documents",
    title: "How do I access documents HR shared with me?",
    category: "HR & Records",
    body: "Open My Records to see documents, promotions, salary increments, and disciplinary files shared with you.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-self-approve",
    title: "Can I approve my own request?",
    category: "System & Admin",
    body: "No. Leave, expenses, and employment-record changes need HOD or HR approval.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
  {
    id: "faq-notifications",
    title: "How do I change my notification settings?",
    category: "Communication",
    body: "Open Settings → Notifications to choose email and in-app alerts.",
    minutes: 0,
    views: 0,
    href: "",
    kind: "faq",
    popular: false,
  },
];

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = nestedStr(value, ["name", "title", "label", "email"]);
      if (nested && nested !== "[object Object]") return nested;
      continue;
    }
    const text = str(value).trim();
    if (text && text !== "[object Object]") return text;
  }
  return "";
}

function isDummy(record: Record<string, unknown>, title: string) {
  if (
    record.isSample === true ||
    record.sample === true ||
    record.dummy === true ||
    record.isDummy === true ||
    record.prototype === true ||
    record.isPrototype === true ||
    record.seed === true ||
    record.mock === true
  ) {
    return true;
  }
  const source = str(
    record.source ?? record.origin ?? record.kind ?? record.tag,
  ).toLowerCase();
  return /(sample|dummy|prototype|seed|demo|mock)/.test(source) ||
    /(sample|dummy|prototype|seed|demo|mock)/.test(title.toLowerCase());
}

function keyedRows(payload: unknown, keys: string[]) {
  const root = unwrapRecord(payload);
  const nested = asRecord(root.data);
  for (const key of keys) {
    const rows = listFrom((nested[key] ?? root[key] ?? []) as never);
    if (rows.length) return rows;
  }
  return [];
}

function rowsFrom(payload: unknown, keys: string[]) {
  const keyed = keyedRows(payload, keys);
  return keyed.length ? keyed : listFrom(payload ?? undefined);
}

function articleKind(record: Record<string, unknown>, title: string): HelpArticle["kind"] {
  const type = `${record.type ?? ""} ${record.kind ?? ""} ${record.section ?? ""} ${title}`.toLowerCase();
  if (
    type.includes("faq") ||
    type.includes("question") ||
    record.answer ||
    record.question ||
    title.trim().endsWith("?")
  ) {
    return "faq";
  }
  if (type.includes("guide") || type.includes("quick") || type.includes("onboard")) {
    return "guide";
  }
  return "article";
}

function mapArticle(record: Record<string, unknown>, index: number): HelpArticle | null {
  const title = firstText(
    record.question,
    record.title,
    record.name,
    record.heading,
    record.subject,
  );
  if (!title || isDummy(record, title)) return null;
  return {
    id: firstText(record.id, record.slug, record.code) || `help-${index + 1}`,
    title,
    category: firstText(
      record.category,
      record.topic,
      record.section,
      record.group,
      asRecord(record.category).name,
    ),
    body: firstText(
      record.answer,
      record.body,
      record.content,
      record.summary,
      record.description,
    ),
    minutes: num(record.readTime ?? record.read_time ?? record.minutes ?? record.duration),
    views: num(record.views ?? record.viewCount ?? record.view_count ?? record.hits),
    href: firstText(record.href, record.url, record.link, record.route),
    kind: articleKind(record, title),
    popular: record.popular === true || record.featured === true || record.isPopular === true,
  };
}

function formatMinutes(value: number) {
  if (!value) return "";
  return `${value} min`;
}

function formatViews(value: number) {
  if (!value) return "";
  if (value >= 1000) {
    const compact = value / 1000;
    return `${compact >= 10 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, "")}k views`;
  }
  return `${value} views`;
}

function optionalHelp<T>(request: Promise<T>) {
  return request.catch((error) => {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 405 || error.status === 403)
    ) {
      return null;
    }
    throw error;
  });
}

const toneClass: Record<string, string> = {
  orange: styles.orange,
  peach: styles.peach,
  blue: styles.blue,
  green: styles.green,
  purple: styles.purple,
  red: styles.red,
  gray: styles.gray,
};

function matchesQuery(article: HelpArticle, query: string) {
  if (!query) return true;
  const haystack = `${article.title} ${article.category} ${article.body}`.toLowerCase();
  return haystack.includes(query);
}

export function EmployeeHelpPage() {
  const { user } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState("");
  const [openFaq, setOpenFaq] = useState("");

  const { data, error } = useAsyncData(async () => {
    const [center, catalog] = await Promise.all([
      optionalHelp(employeeApi.help.get()),
      optionalHelp(helpApi.list()),
    ]);
    return { center, catalog };
  }, []);

  const { topics, popular, guides, faqs, support } = useMemo(() => {
    const center = unwrapRecord(data?.center);
    const liveRows = [
      ...rowsFrom(data?.center, ["articles", "items", "records"]),
      ...rowsFrom(data?.catalog, ["articles", "items", "records"]),
      ...keyedRows(data?.center, ["faqs", "questions", "guides", "popular"]),
    ];

    const liveArticles = liveRows
      .map((row, index) => mapArticle(row, index))
      .filter((item): item is HelpArticle => Boolean(item));

    const byTitle = new Map(liveArticles.map((item) => [item.title.toLowerCase(), item]));
    const articles = catalogArticles.map((item) => {
      const live = byTitle.get(item.title.toLowerCase());
      if (!live) return item;
      return {
        ...item,
        body: live.body || item.body,
        href: live.href || item.href,
        minutes: live.minutes || item.minutes,
        views: live.views || item.views,
      };
    });

    const liveTopics = keyedRows(data?.center, ["topics", "categories"])
      .map((row, index) => {
        const name = firstText(row.name, row.title, row.label, row.category);
        if (!name || isDummy(row, name)) return null;
        return {
          id: firstText(row.id, row.slug) || `topic-${index + 1}`,
          name,
          description: firstText(row.description, row.summary, row.body, row.blurb),
          count: num(row.articleCount ?? row.count ?? row.articles),
          style: topicStyle(name),
        } satisfies HelpTopic;
      })
      .filter((item): item is HelpTopic => Boolean(item));

    const topics = catalogTopics.map((topic) => {
      const live = liveTopics.find(
        (item) => item.name.toLowerCase() === topic.name.toLowerCase(),
      );
      if (!live) return topic;
      return {
        ...topic,
        description: live.description || topic.description,
        count: live.count || topic.count,
      };
    });

    const selectedTopic = topics.find((item) => item.id === topicId);
    const topicName = selectedTopic?.name ?? "";
    const visible = articles.filter((article) => {
      if (!matchesQuery(article, query.trim().toLowerCase())) return false;
      if (!topicName) return true;
      return (
        article.category.toLowerCase() === topicName.toLowerCase() ||
        (topicName.startsWith("Leave") && article.category.toLowerCase().includes("leave")) ||
        (topicName.startsWith("Payroll") &&
          /payroll|finance|expense|pay/.test(article.category.toLowerCase())) ||
        (topicName.startsWith("HR") &&
          /hr|record|onboard/.test(article.category.toLowerCase()))
      );
    });

    const supportRoot = unwrapRecord(
      center.support ?? center.contacts ?? center.channels,
    );

    return {
      topics,
      popular: visible.filter((item) => item.popular).slice(0, 6),
      guides: visible.filter((item) => item.kind === "guide").slice(0, 4),
      faqs: visible.filter((item) => item.kind === "faq"),
      support: {
        chatUrl: firstText(
          supportRoot.chatUrl,
          supportRoot.chat,
          supportRoot.liveChat,
          center.chatUrl,
        ),
        email: firstText(
          supportRoot.email,
          supportRoot.supportEmail,
          center.supportEmail,
        ),
        docsUrl: firstText(
          supportRoot.docsUrl,
          supportRoot.docs,
          supportRoot.documentation,
          center.docsUrl,
        ),
      },
    };
  }, [data, query, topicId]);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <p>Help center</p>
        <h1>How can we help?</h1>
        <span>Guides, references and answers for every part of Afresh.</span>
      </div>

      <label className={styles.heroSearch}>
        <Search size={16} />
        <input
          id="help-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles, guides and FAQs."
        />
      </label>

      {error ? (
        <p className={styles.empty} role="alert">
          {error}
        </p>
      ) : null}

      <section className={styles.section}>
        <h2>Browse by topic</h2>
        <div className={styles.topicGrid}>
          {topics.map((topic) => {
            const Icon = topic.style.icon;
            const active = topicId === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                className={`${styles.topicCard} ${active ? styles.topicActive : ""}`}
                onClick={() => setTopicId(active ? "" : topic.id)}
              >
                <span
                  className={`${styles.topicIcon} ${toneClass[topic.style.tone]}`}
                >
                  <Icon size={16} />
                </span>
                <div>
                  <strong>{topic.name}</strong>
                  <p>{topic.description}</p>
                  <span className={styles.topicCount}>
                    {topic.count} articles
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className={styles.split}>
        <section className={styles.section}>
          <h2>
            <Star size={14} />
            Most popular
          </h2>
          <ol className={styles.popularList}>
            {popular.map((item, index) => (
              <li key={item.id}>
                <ArticleRow article={item} index={index + 1} />
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section}>
          <h2>
            <PlayCircle size={14} />
            Quick-start guides
          </h2>
          <div className={styles.guideList}>
            {guides.map((item) => (
              <ArticleRow key={item.id} article={item} play />
            ))}
          </div>
          <p className={styles.tip}>
            <Lightbulb size={14} />
            Pro tip: press ? anywhere in Afresh to jump back here instantly.
          </p>
        </section>
      </div>

      <section className={styles.section}>
        <h2>Frequently asked questions</h2>
        <div className={styles.faqList}>
          {faqs.map((item) => {
            const open = openFaq === item.id;
            return (
              <article key={item.id} className={styles.faq}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? "" : item.id)}
                >
                  <span>{item.title}</span>
                  <ChevronDown
                    size={16}
                    className={open ? styles.faqOpen : ""}
                  />
                </button>
                {open && item.body ? <p>{item.body}</p> : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Still need help?</h2>
        <div className={styles.supportGrid}>
          <article className={`${styles.supportCard} ${styles.supportPeach}`}>
            <span className={`${styles.topicIcon} ${styles.orange}`}>
              <MessageCircle size={16} />
            </span>
            <strong>Chat with support</strong>
            <p>Get a response within a few minutes during business hours.</p>
            {support.chatUrl ? (
              <a href={support.chatUrl} target="_blank" rel="noreferrer">
                Start chat <ExternalLink size={12} />
              </a>
            ) : (
              <span>Start chat</span>
            )}
          </article>
          <article className={styles.supportCard}>
            <span className={`${styles.topicIcon} ${styles.gray}`}>
              <Mail size={16} />
            </span>
            <strong>Email support</strong>
            <p>Send a detailed request and we’ll respond within one business day.</p>
            {support.email ? (
              <a href={`mailto:${support.email}`}>
                Send email <ExternalLink size={12} />
              </a>
            ) : (
              <span>Send email</span>
            )}
          </article>
          <article className={styles.supportCard}>
            <span className={`${styles.topicIcon} ${styles.gray}`}>
              <BookOpen size={16} />
            </span>
            <strong>Full documentation</strong>
            <p>Browse the complete Afresh administrator and user manuals.</p>
            {support.docsUrl ? (
              <a href={support.docsUrl} target="_blank" rel="noreferrer">
                Open docs <ExternalLink size={12} />
              </a>
            ) : (
              <span>Open docs</span>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

function ArticleRow({
  article,
  index,
  play,
}: {
  article: HelpArticle;
  index?: number;
  play?: boolean;
}) {
  const meta = [formatMinutes(article.minutes), formatViews(article.views)]
    .filter(Boolean)
    .join("  ");
  const inner = (
    <>
      {index ? <span className={styles.index}>{index}</span> : null}
      {play ? (
        <span className={`${styles.topicIcon} ${styles.gray}`}>
          <PlayCircle size={14} />
        </span>
      ) : null}
      <div className={styles.rowText}>
        <strong>{article.title}</strong>
        {article.category ? <p>{article.category}</p> : null}
      </div>
      {meta ? (
        <span className={styles.rowMeta}>
          {article.minutes ? <Clock size={12} /> : null}
          {meta}
        </span>
      ) : null}
      {index ? <ChevronRight size={14} className={styles.rowChevron} /> : null}
    </>
  );

  if (article.href) {
    const external = /^https?:/i.test(article.href);
    return (
      <a
        className={styles.row}
        href={article.href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  return <div className={styles.row}>{inner}</div>;
}
