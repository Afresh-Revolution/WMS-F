"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import {
  ApiError,
  apiRequest,
  asRecord,
  employeeApi,
  unwrapList,
} from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import type {
  EmployeeRecordCategory,
  EmployeeRecordItem,
} from "@/data/employeeHome";
import styles from "./EmployeeRecordsPage.module.css";

const filters: EmployeeRecordCategory[] = [
  "Documents",
  "Promotions",
  "Salary Increments",
  "Disciplinary",
];

const DUMMY_TITLES = new Set([
  "offer letter",
  "employment contract",
  "staff id card",
  "employee handbook",
]);

function isDummyRow(record: Record<string, unknown>, title: string) {
  if (
    record.isSample === true ||
    record.sample === true ||
    record.dummy === true ||
    record.isDummy === true ||
    record.prototype === true ||
    record.isPrototype === true ||
    record.seed === true
  ) {
    return true;
  }
  const source = str(
    record.source ?? record.origin ?? record.kind ?? record.tag,
  ).toLowerCase();
  if (/(sample|dummy|prototype|seed|demo|mock)/.test(source)) return true;
  return DUMMY_TITLES.has(title.trim().toLowerCase());
}

async function optionalList(path: string) {
  try {
    return unwrapList<Record<string, unknown>>(await apiRequest(path));
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 405 || error.status === 403)
    ) {
      return [];
    }
    return [];
  }
}

function rowsFrom(payload: unknown, keys: string[]) {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  for (const key of keys) {
    const rows = listFrom((data[key] ?? root[key]) as never);
    if (rows.length) return rows;
  }
  return [];
}

function formatDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fileKind(record: Record<string, unknown>) {
  const raw = str(
    record.fileType ??
      record.mimeType ??
      record.contentType ??
      record.type ??
      record.extension ??
      record.fileName ??
      record.url ??
      record.fileUrl,
  ).toLowerCase();
  if (raw.includes("pdf") || raw.endsWith(".pdf")) return "PDF";
  if (
    raw.includes("image") ||
    raw.includes("png") ||
    raw.includes("jpg") ||
    raw.includes("jpeg") ||
    raw.includes("webp")
  ) {
    return "Image";
  }
  if (raw.includes("doc")) return "DOCX";
  if (raw.includes("letter") || raw.includes("notice")) return "Letter";
  return raw.includes("/") ? "File" : str(record.kind ?? record.format, "File");
}

function mapCategory(value: unknown): EmployeeRecordCategory {
  const raw = str(value).toLowerCase();
  if (raw.includes("promot")) return "Promotions";
  if (raw.includes("salary") || raw.includes("increment")) {
    return "Salary Increments";
  }
  if (raw.includes("disciplin") || raw.includes("warning") || raw.includes("query")) {
    return "Disciplinary";
  }
  return "Documents";
}

function mapRecord(
  record: Record<string, unknown>,
  index: number,
  fallbackCategory: EmployeeRecordCategory,
): EmployeeRecordItem | null {
  const title = str(
    record.title ??
      record.documentName ??
      record.document_name ??
      record.name ??
      record.letterTitle ??
      record.position ??
      record.caseTitle,
  );
  if (!title || isDummyRow(record, title)) return null;
  const available = !["pending", "processing", "draft"].includes(
    str(record.status).toLowerCase(),
  );
  const fileUrl = str(
    record.fileUrl ??
      record.file_url ??
      record.url ??
      record.documentUrl ??
      record.downloadUrl ??
      record.href,
  );
  return {
    id: str(record.id ?? record.reference ?? record._id, `REC-${index + 1}`),
    title,
    category: mapCategory(
      record.category ??
        record.documentType ??
        record.document_type ??
        record.type ??
        fallbackCategory,
    ),
    kind: fileKind(record),
    date: formatDate(
      record.date ??
        record.issuedAt ??
        record.issued_at ??
        record.effectiveDate ??
        record.createdAt ??
        record.created_at,
    ),
    fileUrl,
    status: available && fileUrl ? "Available" : available ? "Available" : "Pending",
  };
}

function mergeRows(
  buckets: Array<[EmployeeRecordCategory, Record<string, unknown>[]]>,
) {
  const seen = new Set<string>();
  const items: EmployeeRecordItem[] = [];
  buckets.forEach(([category, rows], bucketIndex) => {
    rows.forEach((row, index) => {
      const item = mapRecord(row, bucketIndex * 100 + index, category);
      if (!item) return;
      const key = `${item.category}:${item.id}:${item.title}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ ...item, category });
    });
  });
  return items;
}

async function loadRecordLibrary() {
  const bundle = await employeeApi.records().catch(() => null);
  const promotions = rowsFrom(bundle, ["promotions", "promotionLetters"]);
  const salary = rowsFrom(bundle, [
    "salaryIncrements",
    "salary_increments",
    "increments",
  ]);
  const discipline = rowsFrom(bundle, [
    "disciplinary",
    "discipline",
    "cases",
    "warnings",
  ]);
  const documents = rowsFrom(bundle, ["documents", "files"]);

  const extras = await Promise.all([
    documents.length ? Promise.resolve([]) : optionalList("/employee/documents"),
    documents.length
      ? Promise.resolve([])
      : optionalList("/employee/employment-record/documents"),
    promotions.length ? Promise.resolve([]) : optionalList("/employee/promotions"),
    salary.length
      ? Promise.resolve([])
      : optionalList("/employee/salary-increments"),
    discipline.length ? Promise.resolve([]) : optionalList("/employee/discipline"),
  ]);

  return mergeRows([
    ["Documents", [...documents, ...extras[0], ...extras[1]]],
    ["Promotions", [...promotions, ...extras[2]]],
    ["Salary Increments", [...salary, ...extras[3]]],
    ["Disciplinary", [...discipline, ...extras[4]]],
  ]);
}

export function EmployeeRecordsPage() {
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState<EmployeeRecordCategory>("Documents");
  const { showToast } = usePageActions();
  const { data, loading, error } = useAsyncData(() => loadRecordLibrary(), []);

  const records = data ?? [];
  const visible = useMemo(
    () => records.filter((item) => item.category === filter),
    [filter, records],
  );

  function handleDownload(item: EmployeeRecordItem) {
    if (!item.fileUrl) {
      showToast("This file is not available to download yet.", "info");
      return;
    }
    const link = document.createElement("a");
    link.href = item.fileUrl;
    link.download = item.title;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.append(link);
    link.click();
    link.remove();
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading records…</p> : null}
        {error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : null}
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
        <div>
          <p>My records</p>
          <h1>Your personal records</h1>
          <span>
            Documents and official notices that belong to you. Only your own
            records are shown.
          </span>
        </div>
      </div>

      <nav className={styles.filters} aria-label="Record filters">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            className={filter === item ? styles.filterActive : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <section className={styles.grid} aria-label={`${filter} records`}>
        {visible.length === 0 ? (
          <p className={styles.empty}>No {filter.toLowerCase()} in this view.</p>
        ) : (
          visible.map((item) => (
            <article key={`${item.category}-${item.id}`} className={styles.card}>
              <span className={styles.icon} aria-hidden>
                <FileText size={16} />
              </span>
              <div className={styles.body}>
                <h2 className={styles.title}>{item.title}</h2>
                <p className={styles.meta}>
                  {item.kind}
                  {item.date ? ` · ${item.date}` : ""}
                </p>
              </div>
              <button
                type="button"
                className={styles.download}
                aria-label={`Download ${item.title}`}
                disabled={!item.fileUrl}
                onClick={() => handleDownload(item)}
              >
                <Download size={16} />
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
