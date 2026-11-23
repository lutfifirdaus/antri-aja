"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ParticipantView } from "@/lib/participant-view";
import styles from "./participant.module.css";

const POLL_MS = 5000;

const noopSubscribe = () => () => {};

type Props = { token: string; initialView: ParticipantView; qrSvg: string };

export function ParticipantTicket({ token, initialView, qrSvg }: Props) {
  const [view, setView] = useState(initialView);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  // Times render only after hydration: server and phone clocks/time zones differ.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [disconnected, setDisconnected] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const done = deleted || view.ticket?.status === "served";

  useEffect(() => {
    if (done) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    async function poll() {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`/api/t/${encodeURIComponent(token)}`, { cache: "no-store" });
          if (cancelled) return;
          if (res.status === 404) {
            setDeleted(true);
            return;
          }
          if (!res.ok) throw new Error(String(res.status));
          setView((await res.json()) as ParticipantView);
          setLastUpdated(new Date());
          setDisconnected(false);
        } catch {
          if (!cancelled) setDisconnected(true);
        }
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }

    // Refresh at once when the person comes back to the tab instead of waiting for the next tick.
    function onVisible() {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        poll();
      }
    }

    timer = setTimeout(poll, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, done]);

  const ticket = view.ticket;
  const called = ticket?.status === "called" && !deleted;

  useEffect(() => {
    if (deleted) document.title = "Tiket tidak ditemukan | AntriAja";
    else if (called && ticket) document.title = `Giliran Anda – ${ticket.number}`;
    else if (ticket) document.title = `Nomor ${ticket.number} | AntriAja`;
    else document.title = "Tiket antrean | AntriAja";
  }, [deleted, called, ticket]);

  const time = hydrated && lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className={called ? `${styles.page} ${styles.called}` : styles.page}>
      <header className={styles.header}>
        <p className="wordmark">
          Antri<span>Aja</span>
        </p>
      </header>

      <main className={styles.main}>
        <h1 className={styles.event}>{view.eventName}</h1>

        {disconnected && !deleted && (
          <p className={`${styles.banner} ${styles.bannerWarning}`} role="status">
            Terputus. Mencoba lagi…{time && ` Terakhir diperbarui pukul ${time}.`}
          </p>
        )}

        <div aria-live="polite">
          {deleted ? <DeletedTicket /> : ticket ? <Ticket ticket={ticket} /> : <BeforeCheckIn view={view} qrSvg={qrSvg} />}
        </div>
      </main>

      {!deleted && (
        <footer className={styles.footer}>
          <p>
            {done ? "Halaman ini tidak lagi diperbarui." : "Halaman ini diperbarui otomatis setiap 5 detik."}
            {time && !disconnected && ` Terakhir pukul ${time}.`}
          </p>
        </footer>
      )}
    </div>
  );
}

function BeforeCheckIn({ view, qrSvg }: { view: ParticipantView; qrSvg: string }) {
  return (
    <>
      <section className={styles.card} aria-labelledby="qr-title">
        <h2 id="qr-title" className={styles.label}>
          Tiket atas nama
        </h2>
        <p className={styles.name}>{view.participantName}</p>
        <div className={styles.qr} role="img" aria-label="Kode QR tiket Anda" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p className={styles.instruction}>Tunjukkan QR ini ke petugas di pintu masuk.</p>
      </section>
      <p className={`${styles.banner} ${styles.bannerInfo}`}>
        Simpan halaman ini (screenshot atau bookmark) untuk ditunjukkan di pintu masuk.
      </p>
    </>
  );
}

function Ticket({ ticket }: { ticket: NonNullable<ParticipantView["ticket"]> }) {
  const counterName = ticket.counter.name;
  const waiting = ticket.status === "waiting";

  return (
    <>
      {waiting && ticket.counter.status === "paused" && (
        <p className={`${styles.banner} ${styles.bannerWarning}`}>
          {counterName} sedang istirahat. Nomor Anda tetap {ticket.number}.
        </p>
      )}
      {waiting && ticket.counter.status === "closed" && (
        <p className={`${styles.banner} ${styles.bannerDanger}`}>
          {counterName} ditutup. Hubungi petugas, Anda akan dipindahkan.
        </p>
      )}

      <section className={styles.card} aria-labelledby="ticket-status">
        <h2 id="ticket-status" className={ticket.status === "called" ? styles.calledHeading : styles.label}>
          {statusHeading(ticket.status)}
        </h2>
        <p className={styles.number}>
          <span className="visually-hidden">Nomor </span>
          {ticket.number}
        </p>
        {ticket.previousNumber && <p className={styles.previous}>Sebelumnya {ticket.previousNumber}</p>}
        <p className={styles.counter}>{counterName}</p>
        <StatusDetail ticket={ticket} />
      </section>
    </>
  );
}

function statusHeading(status: NonNullable<ParticipantView["ticket"]>["status"]): string {
  switch (status) {
    case "waiting":
      return "Nomor antrean Anda";
    case "called":
      return "Giliran Anda";
    case "served":
      return "Selesai";
    case "skipped":
      return "Nomor Anda dilewati";
  }
}

function StatusDetail({ ticket }: { ticket: NonNullable<ParticipantView["ticket"]> }) {
  const counterName = ticket.counter.name;
  switch (ticket.status) {
    case "waiting":
      // A paused or closed counter already has its banner; "you're next" would contradict it.
      if (ticket.ahead === 0 && ticket.counter.status !== "open") return null;
      return ticket.ahead === 0 ? (
        <p className={styles.ahead}>Anda berikutnya. Mohon bersiap di dekat {counterName}.</p>
      ) : (
        <p className={styles.ahead}>
          <strong>{ticket.ahead}</strong> orang di depan Anda
        </p>
      );
    case "called":
      return <p className={styles.ahead}>Silakan menuju {counterName} sekarang.</p>;
    case "served":
      return <p className={styles.ahead}>Terima kasih, Anda sudah dilayani.</p>;
    case "skipped":
      return <p className={styles.ahead}>Hubungi petugas di {counterName}.</p>;
  }
}

function DeletedTicket() {
  return (
    <section className={styles.card} aria-labelledby="deleted-title">
      <h2 id="deleted-title" className={styles.stateTitle}>
        Tiket tidak ditemukan
      </h2>
      <p>Data tiket ini sudah tidak ada. Tanyakan ke petugas di pintu masuk.</p>
    </section>
  );
}
