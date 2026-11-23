import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-page";
import { getPrisma } from "@/lib/db";
import { DeniedView, SignInView } from "@/components/admin/access-views";
import { AddCounterForm } from "@/components/admin/add-counter-form";
import { CounterRow } from "@/components/admin/counter-row";
import { EventSettingsForm } from "@/components/admin/event-settings-form";
import { PinPanel } from "@/components/admin/pin-panel";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The event name goes in the title only for an admin; anyone else gets the neutral title.
export async function generateMetadata({ params }: PageProps<"/admin/events/[id]">): Promise<Metadata> {
  const { id } = await params;
  if ((await getAdminAccess()).state !== "admin" || !UUID.test(id)) return { title: "Admin" };
  const event = await getPrisma().event.findUnique({ where: { id }, select: { name: true } });
  return { title: event?.name ?? "Acara tidak ditemukan" };
}

function nextCode(used: string[]): string {
  for (let i = 0; i < 26; i++) {
    const code = String.fromCharCode(65 + i);
    if (!used.includes(code)) return code;
  }
  return "";
}

export default async function EventPage({ params }: PageProps<"/admin/events/[id]">) {
  const access = await getAdminAccess();
  if (access.state === "denied") return <DeniedView email={access.email} />;
  if (access.state === "anonymous") return <SignInView failed={null} />;

  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const event = await getPrisma().event.findUnique({
    where: { id },
    include: { counters: { orderBy: { code: "asc" } } },
  });
  if (!event) notFound();

  const suggestedCode = nextCode(event.counters.map((c) => c.code));

  return (
    <>
      <div className="page-head">
        <Link href="/admin" className="crumb">
          Semua acara
        </Link>
        <h1>{event.name}</h1>
        <p className="meta">{event.slug}</p>
      </div>

      <section className="block" aria-labelledby="settings-title">
        <h2 id="settings-title">Pengaturan acara</h2>
        <EventSettingsForm
          eventId={event.id}
          initial={{
            name: event.name,
            slug: event.slug,
            maxParticipants: event.maxParticipants === null ? "" : String(event.maxParticipants),
            registrationOpen: event.registrationOpen,
          }}
        />
      </section>

      <section className="block" aria-labelledby="gate-title">
        <h2 id="gate-title">Pintu masuk</h2>
        <p className="lead">PIN untuk petugas pintu masuk. Satu PIN berlaku untuk seluruh acara.</p>
        <PinPanel subject="pintu masuk" endpoint={`/api/admin/events/${event.id}/gate-pin`} hasPin={event.gatePinHash !== null} />
      </section>

      <section className="block" aria-labelledby="counters-title">
        <h2 id="counters-title">Loket</h2>
        {event.counters.length === 0 ? (
          <p className="notice">Belum ada loket. Tambahkan loket pertama di bawah.</p>
        ) : (
          <ul className="rows">
            {event.counters.map((counter) => (
              <CounterRow
                key={counter.id}
                id={counter.id}
                code={counter.code}
                name={counter.name}
                status={counter.status}
                hasPin={counter.pinHash !== null}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="block" aria-labelledby="add-counter-title">
        <h2 id="add-counter-title">Tambah loket</h2>
        <AddCounterForm key={suggestedCode} eventId={event.id} suggestedCode={suggestedCode} />
      </section>
    </>
  );
}
