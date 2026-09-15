"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { superAdminApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import styles from "./GlobalSearch.module.css";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const response = await superAdminApi.globalSearch(q);
      setResults(listFrom((response.results ?? response.data ?? response) as never));
      setOpen(true);
    } catch {
      const fallback = await superAdminApi.search(q).catch(() => null);
      const payload = (fallback ?? {}) as Record<string, unknown>;
      setResults(listFrom((payload.results ?? payload.data ?? payload) as never));
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function navigate(result: Record<string, unknown>) {
    const href = str(result.href ?? result.url ?? result.path);
    if (href.startsWith("/")) {
      router.push(href);
      setOpen(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workforce…"
          aria-label="Global search"
        />
        <button type="submit" disabled={loading}>
          {loading ? "…" : "Search"}
        </button>
      </form>
      {open && results.length > 0 ? (
        <div className={styles.results}>
          {results.map((result, index) => (
            <button
              key={str(result.id, String(index))}
              type="button"
              className={styles.result}
              onClick={() => navigate(result)}
            >
              <strong>{str(result.title ?? result.name ?? result.label)}</strong>
              <span>{str(result.type ?? result.module)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
