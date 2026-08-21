import styles from "./AfreshLogo.module.css";

export function AfreshLogo() {
  return (
    <div className={styles.logo} aria-label="AfrESH">
      <div className={styles.markWrap} aria-hidden />
      <span className={styles.wordmark}>
        A<span className={styles.wordmarkLower}>fr</span>
        <span className={styles.wordmarkUpper}>ESH</span>
      </span>
    </div>
  );
}
