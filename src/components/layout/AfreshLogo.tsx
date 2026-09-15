import styles from "./AfreshLogo.module.css";

export function AfreshLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public lockup
    <img className={styles.logo} src="/afresh-logo.png" alt="AfrESH" />
  );
}
