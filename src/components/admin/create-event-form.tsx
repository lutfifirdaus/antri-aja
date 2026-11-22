"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, sendJson } from "@/lib/admin-client";
import { EventFields } from "./event-fields";
import { toEventPayload, validateEvent, type EventErrors, type EventValues } from "./event-form-model";

const EMPTY: EventValues = { name: "", slug: "", maxParticipants: "", registrationOpen: false };

export function CreateEventForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<EventValues>(EMPTY);
  const [errors, setErrors] = useState<EventErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateEvent(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0] === "maxParticipants" ? "cap" : Object.keys(found)[0];
      formRef.current?.querySelector<HTMLInputElement>(`#new-event-${first}`)?.focus();
      return;
    }
    setPending(true);
    const res = await sendJson<{ id: string }>("POST", "/api/admin/events", toEventPayload(values));
    if (res.ok && res.data) {
      router.push(`/admin/events/${res.data.id}`);
      return;
    }
    if (res.status === 409) setErrors({ slug: "Slug ini sudah dipakai acara lain. Ganti slug." });
    else setFormError(errorMessage(res.status));
    setPending(false);
  }

  return (
    <form ref={formRef} className="form" onSubmit={submit} noValidate>
      <EventFields
        idPrefix="new-event"
        values={values}
        errors={errors}
        disabled={pending}
        followName={!slugEdited}
        onChange={setValues}
        onSlugEdited={() => setSlugEdited(true)}
      />
      {formError && (
        <p className="notice error" role="alert">
          {formError}
        </p>
      )}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Membuat acara…" : "Buat acara"}
        </button>
      </div>
    </form>
  );
}
