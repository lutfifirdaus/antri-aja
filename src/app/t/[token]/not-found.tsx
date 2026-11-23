import styles from "./participant.module.css";

export default function TicketNotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className="wordmark">
          Antri<span>Aja</span>
        </p>
      </header>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="nf-title">
          <h1 id="nf-title" className={styles.stateTitle}>
            Tiket tidak ditemukan
          </h1>
          <p>Periksa kembali tautan dari pendaftaran, atau tanyakan ke petugas di pintu masuk.</p>
        </section>
      </main>
    </div>
  );
}
