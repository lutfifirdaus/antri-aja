import { slugify, type EventErrors, type EventValues } from "./event-form-model";

type Props = {
  idPrefix: string;
  values: EventValues;
  errors: EventErrors;
  disabled: boolean;
  /** Create form only: the slug follows the name until the admin edits it. */
  followName?: boolean;
  onChange: (next: EventValues) => void;
  onSlugEdited?: () => void;
};

export function EventFields({ idPrefix, values, errors, disabled, followName, onChange, onSlugEdited }: Props) {
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <>
      <div className="fields two">
        <div className="field">
          <label htmlFor={id("name")}>Nama acara</label>
          <input
            id={id("name")}
            type="text"
            value={values.name}
            disabled={disabled}
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? id("name-error") : undefined}
            onChange={(e) =>
              onChange({ ...values, name: e.target.value, ...(followName ? { slug: slugify(e.target.value) } : {}) })
            }
          />
          {errors.name && (
            <p id={id("name-error")} className="field-error">
              {errors.name}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor={id("slug")}>Slug</label>
          <input
            id={id("slug")}
            type="text"
            value={values.slug}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.slug ? true : undefined}
            aria-describedby={`${id("slug-hint")}${errors.slug ? ` ${id("slug-error")}` : ""}`}
            onChange={(e) => {
              onSlugEdited?.();
              onChange({ ...values, slug: e.target.value });
            }}
          />
          <p id={id("slug-hint")} className="hint">
            Dipakai sebagai alamat acara. Huruf kecil, angka, dan tanda hubung.
          </p>
          {errors.slug && (
            <p id={id("slug-error")} className="field-error">
              {errors.slug}
            </p>
          )}
        </div>
      </div>
      <div className="fields two">
        <div className="field">
          <label htmlFor={id("cap")}>Batas peserta</label>
          <input
            id={id("cap")}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.maxParticipants}
            disabled={disabled}
            aria-invalid={errors.maxParticipants ? true : undefined}
            aria-describedby={`${id("cap-hint")}${errors.maxParticipants ? ` ${id("cap-error")}` : ""}`}
            onChange={(e) => onChange({ ...values, maxParticipants: e.target.value })}
          />
          <p id={id("cap-hint")} className="hint">
            Kosongkan jika tanpa batas.
          </p>
          {errors.maxParticipants && (
            <p id={id("cap-error")} className="field-error">
              {errors.maxParticipants}
            </p>
          )}
        </div>
        <div className="field">
          <span className="label">Pendaftaran</span>
          <label className="check">
            <input
              type="checkbox"
              checked={values.registrationOpen}
              disabled={disabled}
              onChange={(e) => onChange({ ...values, registrationOpen: e.target.checked })}
            />
            Pendaftaran dibuka
          </label>
        </div>
      </div>
    </>
  );
}
