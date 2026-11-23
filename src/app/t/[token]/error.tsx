"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./participant.module.css";

export default function TicketError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.card} aria-labelledby="err-title">
          <h1 id="err-title" className={styles.stateTitle}>
            Tiket belum bisa dimuat
          </h1>
          <p>Koneksi ke server terputus. Periksa sinyal Anda, lalu coba lagi.</p>
          <button type="button" className={styles.retry} onClick={retry}>
            Coba lagi
          </button>
        </section>
      </main>
    </div>
  );
}
