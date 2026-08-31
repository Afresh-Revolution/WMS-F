"use client";

import { useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { helpApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./HelpPage.module.css";

export function HelpPage() {
  const { data, loading, error } = useAsyncData(() => helpApi.list(), []);

  const articles = useMemo(() => {
    return listFrom(data ?? undefined);
  }, [data]);

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Support</p>
      <h1 className={styles.title}>Help center</h1>
      <p className={styles.subtitle}>
        Find guides, FAQs, and support for using Afresh WMS.
      </p>
      {loading ? <p>Loading help articles…</p> : null}
      {error ? <p role="alert">Using cached help — {error}</p> : null}

      <div className={styles.list}>
        {articles.length === 0 ? (
          <p className={styles.empty}>
            No help articles yet. Browse the sidebar for platform features.
          </p>
        ) : (
          articles.map((article, index) => (
            <article key={str(article.id, String(index))} className={styles.card}>
              <h2>{str(article.title ?? article.name)}</h2>
              <p>{str(article.summary ?? article.description ?? article.body)}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
