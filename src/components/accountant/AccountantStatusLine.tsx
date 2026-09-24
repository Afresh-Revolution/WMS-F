import styles from "./AccountantStatusLine.module.css";

export function AccountantStatusLine({
  loading,
  error,
  resource,
}: {
  loading: boolean;
  error: string | null;
  resource: string;
}) {
  if (!loading && !error) return null;
  return (
    <p className={styles.line} role={error ? "alert" : undefined}>
      {loading ? `Loading ${resource}…` : `Could not load ${resource} — ${error}`}
    </p>
  );
}
