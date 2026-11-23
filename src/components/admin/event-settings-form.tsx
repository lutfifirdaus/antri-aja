"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, sendJson } from "@/lib/admin-client";
import { EventFields } from "./event-fields";
import { toEventPayload, validateEvent, type EventErrors, type EventValues } from "./event-form-model";

export function EventSettingsForm({ eventId, initial }: { eventId: string; initial: EventValues }) {
  const router = useRouter();
  const [values, setValues] = useState<EventValues>(initial);
  const [errors, setErrors] = useState<EventErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateEvent(values);
    setErrors(found);
    setFormError(null);
    setSaved(false);
    if (Object.keys(found).length > 0) return;
    setPending(true);
    const res = await sendJson("PATCH", `/api/admin/events/${eventId}`, toEventPayload(values));
    setPending(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else if (res.status === 409) {
      setErrors({ slug: "Slug ini sudah dipakai acara lain. Ganti slug." });
    } else {
      setFormError(errorMessage(res.status));
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <EventFields
        idPrefix="event"
        values={values}
        errors={errors}
        disabled={pending}
        onChange={(next) => {
          setSaved(false);
          setValues(next);
        }}
      />
      {formError && (
        <p className="notice error" role="alert">
          {formError}
        </p>
      )}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
      <p role="status" className="status-text">
        {saved ? "Perubahan tersimpan." : ""}
      </p>
    </form>
  );
}
