"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, FileText, Search } from "lucide-react";
import {
  documentTemplates as fallbackTemplates,
  type DocumentTemplateStatus,
} from "@/data/documentTemplates";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { documentsApi } from "@/lib/api";
import { listFrom, mapDocumentTemplate, str } from "@/lib/api/mappers";
import styles from "./DocumentTemplatesPage.module.css";

const statusClass: Record<DocumentTemplateStatus, string> = {
  Active: styles.statusActive,
  Inactive: styles.statusInactive,
};

export function DocumentTemplatesPage() {
  const { runAction } = usePageActions();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(
    null,
  );

  const { data, loading, error, refetch } = useAsyncData(
    () => documentsApi.list(),
    [],
  );

  const templates = useMemo(() => {
    const records = listFrom(data ?? undefined);
    return records.length > 0
      ? records.map((record) => mapDocumentTemplate(record))
      : fallbackTemplates;
  }, [data]);

  const toggleStatus = useCallback(
    async (id: string, current: DocumentTemplateStatus, name: string) => {
      await runAction(
        `${current === "Active" ? "Deactivate" : "Activate"} ${name}`,
        async () => {
          await documentsApi.patch(id, {
            status: current === "Active" ? "inactive" : "active",
          });
          refetch();
        },
      );
    },
    [refetch, runAction],
  );

  async function openPreview(id: string, name: string) {
    setPreviewId(id);
    await runAction(`Preview ${name}`, async () => {
      const record = await documentsApi.get(id);
      setPreviewData(record as Record<string, unknown>);
    }).catch(() => {
      setPreviewData({ name, id, message: "Preview unavailable offline." });
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
        <div className={styles.topActions}>
          <label className={styles.topSearch}>
            <Search size={15} className={styles.topSearchIcon} />
            <input
              placeholder="Search"
              className={styles.topSearchInput}
              readOnly
              aria-label="Search"
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <p className={styles.eyebrow}>System · Documents</p>
        <h1 className={styles.title}>Document templates</h1>
        <p className={styles.subtitle}>
          Manage the PDF templates the platform generates for payslips, letters
          and notices.
        </p>
        {loading ? <p className={styles.subtitle}>Loading templates…</p> : null}
        {error ? (
          <p className={styles.subtitle} role="alert">
            Showing cached templates — {error}
          </p>
        ) : null}
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>PDF templates</h2>
          <p className={styles.cardDescription}>
            Only active templates are used when generating documents.
          </p>
        </div>

        <div className={styles.templateList}>
          {templates.map((template) => (
            <div key={template.id} className={styles.templateRow}>
              <div className={styles.templateMain}>
                <span className={styles.templateIcon} aria-hidden>
                  <FileText size={18} strokeWidth={2} />
                </span>
                <div className={styles.templateCopy}>
                  <div className={styles.templateTitleRow}>
                    <h3 className={styles.templateName}>{template.name}</h3>
                    <span
                      className={`${styles.statusBadge} ${statusClass[template.status]}`}
                    >
                      <span className={styles.statusDot} aria-hidden />
                      {template.status}
                    </span>
                  </div>
                  <p className={styles.templateMeta}>
                    PDF · updated {template.updatedAt}
                  </p>
                </div>
              </div>

              <div className={styles.templateActions}>
                <button
                  type="button"
                  className={styles.previewButton}
                  onClick={() => void openPreview(template.id, template.name)}
                >
                  <Eye size={14} strokeWidth={2.25} />
                  Preview
                </button>
                <button
                  type="button"
                  className={styles.toggleButton}
                  onClick={() =>
                    void toggleStatus(template.id, template.status, template.name)
                  }
                >
                  {template.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SimpleModal
        open={Boolean(previewId)}
        title={str(previewData?.name, "Document preview")}
        description={str(previewData?.message ?? previewData?.description, "Template details from the documents API.")}
        fields={[
          {
            name: "id",
            label: "Template ID",
            defaultValue: previewId ?? "",
          },
          {
            name: "type",
            label: "Type",
            defaultValue: str(previewData?.type ?? previewData?.format, "PDF"),
          },
        ]}
        submitLabel="Close"
        onClose={() => {
          setPreviewId(null);
          setPreviewData(null);
        }}
        onSubmit={async () => {
          setPreviewId(null);
          setPreviewData(null);
        }}
      />
    </div>
  );
}
