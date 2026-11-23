"use client";

import { useState } from "react";
import { errorMessage, sendJson } from "@/lib/admin-client";

type Phase = "idle" | "confirm" | "pending" | "shown";

type Props = {
  /** Who the PIN is for, e.g. "Loket A" or "Pintu masuk". */
  subject: string;
  endpoint: string;
  hasPin: boolean;
};

export function PinPanel({ subject, endpoint, hasPin: initialHasPin }: Props) {
  const [hasPin, setHasPin] = useState(initialHasPin);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);

  async function issue() {
    setPhase("pending");
    setError(null);
    const res = await sendJson<{ pin: string }>("POST", endpoint);
    if (res.ok && res.data?.pin) {
      setPin(res.data.pin);
      setHasPin(true);
      setCopied(null);
      setPhase("shown");
      return;
    }
    setError(errorMessage(res.status));
    setPhase(hasPin ? "confirm" : "idle");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(pin ?? "");
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  function dismiss() {
    setPin(null);
    setCopied(null);
    setPhase("idle");
  }

  return (
    <div className="pin-panel">
      {phase === "shown" && pin ? (
        <>
          <p className="notice warn pin-warning" role="alert">
            PIN {subject} hanya ditampilkan sekali. Catat sekarang. Setelah ditutup, PIN tidak bisa dilihat lagi.
          </p>
          <p className="pin-value" aria-label={`PIN ${subject}: ${pin.split("").join(" ")}`}>
            {pin}
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-quiet" onClick={copy}>
              Salin PIN
            </button>
            <button type="button" className="btn" onClick={dismiss}>
              Sudah dicatat
            </button>
          </div>
          <p role="status" className="status-text">
            {copied === "ok" && "PIN tersalin."}
            {copied === "fail" && "Tidak bisa menyalin otomatis. Catat PIN secara manual."}
          </p>
        </>
      ) : (
        <>
          <p className="status-text">
            {hasPin
              ? "PIN sudah dibuat. PIN tidak bisa dilihat lagi. Ganti PIN jika lupa."
              : "Belum ada PIN. Buat PIN agar petugas bisa masuk."}
          </p>
          {phase === "confirm" ? (
            <>
              <p className="notice warn pin-warning">
                Ganti PIN {subject}? PIN yang lama langsung tidak berlaku, dan petugas harus memakai PIN baru.
              </p>
              <div className="btn-row">
                <button type="button" className="btn" onClick={issue}>
                  Ya, ganti PIN
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setPhase("idle")}>
                  Batal
                </button>
              </div>
            </>
          ) : (
            <div className="btn-row">
              <button
                type="button"
                className={hasPin ? "btn btn-quiet" : "btn"}
                disabled={phase === "pending"}
                onClick={() => (hasPin ? setPhase("confirm") : issue())}
              >
                {phase === "pending" ? "Membuat PIN…" : hasPin ? `Ganti PIN ${subject}` : `Buat PIN ${subject}`}
              </button>
            </div>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
