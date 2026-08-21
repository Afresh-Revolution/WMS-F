import Image from "next/image";
import styles from "./AfreshLogo.module.css";

export function AfreshLogo() {
  return (
    <div className={styles.logo} aria-label="AfrESH">
      <Image
        src="/afresh-mark.png"
        alt=""
        width={258}
        height={258}
        priority
        className={styles.mark}
      />
      <span className={styles.wordmark}>
        A<span className={styles.wordmarkLower}>fr</span>
        <span className={styles.wordmarkUpper}>ESH</span>
      </span>
    </div>
  );
}
