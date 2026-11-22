export type EventValues = {
  name: string;
  slug: string;
  maxParticipants: string;
  registrationOpen: boolean;
};

export type EventErrors = Partial<Record<"name" | "slug" | "maxParticipants", string>>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateEvent(v: EventValues): EventErrors {
  const errors: EventErrors = {};
  if (!v.name.trim()) errors.name = "Isi nama acara.";
  if (!v.slug) errors.slug = "Isi slug.";
  else if (!SLUG.test(v.slug)) errors.slug = "Slug hanya boleh huruf kecil, angka, dan tanda hubung. Contoh: qurban-2026.";
  if (v.maxParticipants.trim() !== "") {
    const n = Number(v.maxParticipants);
    if (!Number.isInteger(n) || n < 1) errors.maxParticipants = "Isi bilangan bulat lebih dari 0, atau kosongkan jika tanpa batas.";
  }
  return errors;
}

export function toEventPayload(v: EventValues) {
  return {
    name: v.name.trim(),
    slug: v.slug,
    maxParticipants: v.maxParticipants.trim() === "" ? null : Number(v.maxParticipants),
    registrationOpen: v.registrationOpen,
  };
}
