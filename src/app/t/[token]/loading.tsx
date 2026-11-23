import styles from "./participant.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p role="status">Memuat tiket…</p>
      </main>
    </div>
  );
}
