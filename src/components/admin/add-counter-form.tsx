"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, sendJson } from "@/lib/admin-client";
import { STATUS_LABEL, type CounterStatus } from "./counter-row";

const CODE = /^[A-Za-z0-9]{1,8}$/;
const STATUSES: CounterStatus[] = ["open", "paused", "closed"];

export function AddCounterForm({ eventId, suggestedCode }: { eventId: string; suggestedCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(suggestedCode);
  const [name, setName] = useState(suggestedCode ? `Loket ${suggestedCode}` : "");
  const [status, setStatus] = useState<CounterStatus>("open");
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (!CODE.test(code)) found.code = "Kode 1 sampai 8 huruf atau angka, tanpa spasi.";
    if (!name.trim()) found.name = "Isi nama loket.";
    setErrors(found);
    setFormError(null);
    if (found.code || found.name) return;
    setPending(true);
    const res = await sendJson("POST", "/api/admin/counters", { eventId, code, name: name.trim(), status });
    if (res.ok) {
      router.refresh();
      setPending(false);
      return;
    }
    if (res.status === 409) setErrors({ code: `Kode ${code} sudah dipakai loket lain di acara ini.` });
    else setFormError(errorMessage(res.status));
    setPending(false);
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="fields two">
        <div className="field">
          <label htmlFor="counter-code">Kode loket</label>
          <input
            id="counter-code"
            type="text"
            value={code}
            disabled={pending}
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={8}
            aria-invalid={errors.code ? true : undefined}
            aria-describedby={errors.code ? "counter-code-error" : "counter-code-hint"}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <p id="counter-code-hint" className="hint">
            Dipakai di depan nomor antrean, misalnya A12.
          </p>
          {errors.code && (
            <p id="counter-code-error" className="field-error">
              {errors.code}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="counter-name">Nama loket</label>
          <input
            id="counter-name"
            type="text"
            value={name}
            disabled={pending}
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "counter-name-error" : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <p id="counter-name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>
      </div>
      <fieldset className="choices">
        <legend>Status awal</legend>
        {STATUSES.map((s) => (
          <label key={s} className="choice">
            <input type="radio" name="counter-new-status" checked={status === s} disabled={pending} onChange={() => setStatus(s)} />
            {STATUS_LABEL[s]}
          </label>
        ))}
      </fieldset>
      {formError && (
        <p className="notice error" role="alert">
          {formError}
        </p>
      )}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Menambah loket…" : "Tambah loket"}
        </button>
      </div>
    </form>
  );
}
