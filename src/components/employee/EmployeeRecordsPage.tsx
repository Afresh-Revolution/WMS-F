"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, FileText, Search, Upload, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi, getAccessToken } from "@/lib/api";
import { num, str } from "@/lib/api/mappers";
import styles from "./EmployeeRecordsPage.module.css";

const categories = ["All", "Policy", "HR", "Finance", "Reports", "Compliance"] as const;
const uploadCategories = ["Policy", "HR", "Finance", "Reports", "Compliance"] as const;
const accessLevels = ["All staff", "Managers", "HR only", "Restricted"] as const;
type CategoryFilter = (typeof categories)[number];
type SectionTab = "Library" | "Recent" | "My uploads";

type DocumentRow = {
  id: string;
  name: string;
  category: string;
  kind: string;
  updated: string;
  sizeValue: string;
  sizeUnit: string;
  access: string;
  downloads: number;
  fileUrl: string;
  local: boolean;
  uploadedById: string;
  updatedAt: string;
};

const emptyUpload = {
  name: "",
  category: "Policy",
  access: "All staff",
  file: null as File | null,
};

function splitSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    const value = mb >= 10 ? String(Math.round(mb)) : mb.toFixed(1).replace(/\.0$/, "");
    return { value, unit: "MB" };
  }
  if (bytes >= 1024) {
    return { value: String(Math.max(1, Math.round(bytes / 1024))), unit: "KB" };
  }
  if (bytes > 0) return { value: String(bytes), unit: "B" };
  return { value: "—", unit: "" };
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mapDocument(record: Record<string, unknown>, index: number): DocumentRow | null {
  const name = str(record.name ?? record.title ?? record.documentName ?? record.fileName);
  if (!name) return null;
  const size = splitSize(num(record.size ?? record.fileSize));
  const updatedAt = str(record.updatedAt ?? record.updated_at ?? record.createdAt);
  return {
    id: str(record.id ?? record._id, `DOC-${index + 1}`),
    name,
    category: str(record.category, "Policy"),
    kind: str(record.fileType ?? record.kind, "File"),
    updated: formatUpdated(updatedAt),
    sizeValue: size.value,
    sizeUnit: size.unit,
    access: str(record.access, "All staff"),
    downloads: num(record.downloads ?? record.downloadCount),
    fileUrl: str(record.fileUrl ?? record.file_url ?? record.url),
    local: record.local === true || str(record.id).startsWith("doc-"),
    uploadedById: str(record.uploadedById ?? record.ownerId ?? record.createdBy),
    updatedAt,
  };
}

async function openFile(row: DocumentRow, download: boolean) {
  const external = /^https?:\/\//i.test(row.fileUrl) && !row.local;
  if (external) {
    window.open(row.fileUrl, "_blank", "noopener,noreferrer");
    return;
  }
  const token = getAccessToken();
  const response = await fetch(
    `/api/v1/employee/documents/${encodeURIComponent(row.id)}/file${download ? "?download=1" : ""}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!response.ok) {
    throw new Error(download ? "Could not download this document." : "Could not open this document.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const filename =
    response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ||
    row.name;
  if (download) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  } else {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function EmployeeRecordsPage() {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [section, setSection] = useState<SectionTab>("Library");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyUpload);
  const { data, loading, error, refetch } = useAsyncData(
    () => employeeApi.documents.list(),
    [],
  );

  const documents = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    return rows
      .map((record, index) => mapDocument(record, index))
      .filter((item): item is DocumentRow => Boolean(item))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [data]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return documents.filter((item) => {
      if (section === "My uploads" && item.uploadedById !== (user?.id ?? "")) return false;
      if (section === "Recent") {
        const time = new Date(item.updatedAt).getTime();
        if (!Number.isFinite(time) || time < recentCutoff) return false;
      }
      if (category !== "All" && item.category !== category) return false;
      if (!needle) return true;
      return `${item.name} ${item.category} ${item.kind} ${item.access}`
        .toLowerCase()
        .includes(needle);
    });
  }, [category, documents, query, section, user?.id]);

  const categoryCount = new Set(documents.map((item) => item.category).filter(Boolean)).size;
  const restrictedCount = documents.filter((item) => item.access !== "All staff").length;
  const downloadTotal = documents.reduce((sum, item) => sum + item.downloads, 0);

  function closeUpload() {
    setUploadOpen(false);
    setForm(emptyUpload);
  }

  useEffect(() => {
    if (!uploadOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeUpload();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [uploadOpen]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await runAction(
        "Upload document",
        async () => {
          if (!form.name.trim()) throw new Error("Enter a document name.");
          if (!form.file) throw new Error("Choose a file to upload.");
          const body = new FormData();
          body.set("name", form.name.trim());
          body.set("category", form.category);
          body.set("access", form.access);
          body.set("file", form.file);
          await employeeApi.documents.create(body);
          await refetch();
        },
        "Document uploaded",
      );
      closeUpload();
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpen(row: DocumentRow, download: boolean) {
    await runAction(download ? `Download ${row.name}` : `Open ${row.name}`, async () => {
      if (download) {
        await employeeApi.documents.download(row.id).catch(() => null);
      }
      await openFile(row, download);
      if (download) await refetch();
    });
  }

  const sections: SectionTab[] = ["Library", "Recent", "My uploads"];
  const countLabel = `${visible.length} document${visible.length === 1 ? "" : "s"}`;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.statusLine}>Loading documents…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input
              aria-label="Search"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Documents</p>
          <h1 className={styles.title}>Every document, always at hand</h1>
          <p className={styles.subtitle}>
            Policies, reports, contracts, and compliance files — organised,
            searchable, and access-controlled.
          </p>
        </div>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      <div className={styles.stats}>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Total documents</p>
            <span>In library</span>
          </div>
          <strong>{documents.length}</strong>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Categories</p>
            <span>Organised</span>
          </div>
          <strong>{categoryCount}</strong>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Access-restricted</p>
            <span>Protected</span>
          </div>
          <strong>{restrictedCount}</strong>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Total downloads</p>
            <span>All time</span>
          </div>
          <strong>{downloadTotal.toLocaleString("en-US")}</strong>
        </article>
      </div>

      <div className={styles.sections}>
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            className={section === item ? styles.sectionActive : ""}
            onClick={() => setSection(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.docSearch}>
          <Search size={15} />
          <input
            aria-label="Search documents"
            placeholder="Search documents..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.chips}>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? styles.chipActive : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className={styles.tableCard}>
        <div className={styles.tableHead}>
          <h2>{countLabel}</h2>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Updated</th>
                <th>Size</th>
                <th>Access</th>
                <th>Downloads</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    No documents in this view.
                  </td>
                </tr>
              ) : (
                visible.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <span className={styles.fileIcon} aria-hidden>
                          <FileText size={16} />
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.kind}</small>
                        </span>
                      </div>
                    </td>
                    <td className={styles.muted}>{item.category}</td>
                    <td className={styles.muted}>{item.updated}</td>
                    <td className={styles.sizeCell}>
                      <span>{item.sizeValue}</span>
                      {item.sizeUnit ? <span>{item.sizeUnit}</span> : null}
                    </td>
                    <td>
                      <span className={styles.access}>{item.access}</span>
                    </td>
                    <td className={styles.downloads}>
                      {item.downloads.toLocaleString("en-US")}
                    </td>
                    <td className={styles.actions}>
                      <button
                        type="button"
                        aria-label={`View ${item.name}`}
                        onClick={() => void handleOpen(item, false)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Download ${item.name}`}
                        onClick={() => void handleOpen(item, true)}
                      >
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {uploadOpen && typeof document !== "undefined"
        ? createPortal(
            <div className={styles.modalBackdrop} role="presentation" onClick={closeUpload}>
              <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-document-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.modalClose}
                  aria-label="Close"
                  onClick={closeUpload}
                >
                  <X size={17} />
                </button>
                <h2 id="upload-document-title">Upload document</h2>
                <p>Add a file to the library. Access controls who can open it.</p>
                <form className={styles.form} onSubmit={handleUpload}>
                  <label className={styles.formField}>
                    <span>Name</span>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Employee Handbook 2026"
                      required
                    />
                  </label>
                  <div className={styles.formPair}>
                    <label className={styles.formField}>
                      <span>Category</span>
                      <select
                        value={form.category}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, category: event.target.value }))
                        }
                      >
                        {uploadCategories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.formField}>
                      <span>Access</span>
                      <select
                        value={form.access}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, access: event.target.value }))
                        }
                      >
                        {accessLevels.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className={styles.uploadField}>
                    <span>File</span>
                    <div className={styles.dropZone}>
                      <span className={styles.uploadIcon}>
                        <Upload size={18} />
                      </span>
                      <strong>{form.file ? form.file.name : "Drop a file or click to upload"}</strong>
                      <small>PDF, DOCX, JPG or PNG · up to 15 MB</small>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
                        required
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            file: event.target.files?.[0] ?? null,
                            name:
                              current.name ||
                              (event.target.files?.[0]?.name.replace(/\.[^.]+$/, "") ?? ""),
                          }))
                        }
                      />
                    </div>
                  </label>
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.modalCancel} onClick={closeUpload}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.modalSubmit} disabled={submitting}>
                      <Upload size={15} />
                      {submitting ? "Uploading…" : "Upload"}
                    </button>
                  </div>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
