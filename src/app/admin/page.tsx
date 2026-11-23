import type { Metadata } from "next";
import Link from "next/link";
import { getAdminAccess } from "@/lib/admin-page";
import { getPrisma } from "@/lib/db";
import { DeniedView, SignInView } from "@/components/admin/access-views";
import { CreateEventForm } from "@/components/admin/create-event-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const access = await getAdminAccess();
  if (access.state === "denied") return <DeniedView email={access.email} />;
  if (access.state === "anonymous") {
    const { error } = await searchParams;
    return <SignInView failed={error === "AccessDenied" ? "denied" : error ? "other" : null} />;
  }

  const events = await getPrisma().event.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, registrationOpen: true, _count: { select: { counters: true } } },
  });

  return (
    <>
      <div className="page-head">
        <h1>Acara</h1>
        <p className="lead">Pilih acara untuk mengatur loket dan PIN petugas, atau buat acara baru.</p>
      </div>

      <section className="block" aria-labelledby="events-title">
        <h2 id="events-title">Daftar acara</h2>
        {events.length === 0 ? (
          <p className="notice">Belum ada acara. Buat acara pertama di bawah.</p>
        ) : (
          <ul className="rows">
            {events.map((event) => (
              <li key={event.id} className="event-row">
                <Link href={`/admin/events/${event.id}`}>{event.name}</Link>
                <p className="meta">
                  {event.slug} · {event._count.counters} loket ·{" "}
                  {event.registrationOpen ? "Pendaftaran dibuka" : "Pendaftaran ditutup"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="block" aria-labelledby="new-event-title">
        <h2 id="new-event-title">Buat acara baru</h2>
        <CreateEventForm />
      </section>
    </>
  );
}
