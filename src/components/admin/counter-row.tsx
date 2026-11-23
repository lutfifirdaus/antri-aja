"use client";

import { useId, useState } from "react";
import { errorMessage, sendJson } from "@/lib/admin-client";
import { PinPanel } from "./pin-panel";

export type CounterStatus = "open" | "paused" | "closed";

export const STATUS_LABEL: Record<CounterStatus, string> = {
  open: "Buka",
  paused: "Istirahat",
  closed: "Tutup",
};

const STATUSES: CounterStatus[] = ["open", "paused", "closed"];

type Props = { id: string; code: string; name: string; status: CounterStatus; hasPin: boolean };

export function CounterRow({ id, code, name, status: initial, hasPin }: Props) {
  const group = useId();
  // `saved` is what the server holds; `shown` is what the radios display while a save is in flight.
  const [saved, setSaved] = useState<CounterStatus>(initial);
  const [shown, setShown] = useState<CounterStatus>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: CounterStatus) {
    if (next === shown || pending) return;
    setShown(next);
    setPending(true);
    setError(null);
    const res = await sendJson("PATCH", `/api/admin/counters/${id}`, { status: next });
    setPending(false);
    if (res.ok) {
      setSaved(next);
    } else {
      setShown(saved);
      setError(errorMessage(res.status));
    }
  }

  return (
    <li className="counter-row">
      <div className="counter-head">
        <span className="code-mark" aria-hidden="true">
          {code}
        </span>
        <div>
          <h3>{name}</h3>
          <p className="meta">Kode {code}</p>
        </div>
      </div>
      <div className="counter-controls">
        <fieldset className="choices" aria-busy={pending}>
          <legend>Status loket</legend>
          {STATUSES.map((s) => (
            <label key={s} className="choice">
              <input
                type="radio"
                name={`${group}-status`}
                checked={shown === s}
                onChange={() => change(s)}
              />
              {STATUS_LABEL[s]}
            </label>
          ))}
        </fieldset>
        <p role="status" className="status-text">
          {pending ? "Menyimpan status…" : ""}
        </p>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div>
          <h4 className="sr-only">PIN {name}</h4>
          <PinPanel subject={name} endpoint={`/api/admin/counters/${id}/pin`} hasPin={hasPin} />
        </div>
      </div>
    </li>
  );
}
