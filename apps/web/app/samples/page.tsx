import { SeatingPlayground } from "../../components/seating-playground";
import type { Metadata } from "next";
import Link from "next/link";
import { listEventsForPage } from "../../server-events";
import { formatLabels } from "../../booking";
import { money, shortDate } from "../../formatters";
export const metadata: Metadata = {
  title: "Booking samples",
  robots: { index: false, follow: false },
};
export default async function SamplesPage() {
  const samples = (await listEventsForPage()).filter((event) =>
    event.id.startsWith("evt_sample_"),
  );
  return (
    <div className="site-container py-10">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">EXPLORE THE POSSIBILITIES</p>
        <h1>More than a ticket to an event.</h1>
        <p className="text-text-muted">
          Try a bus journey, a cinema screening, and a festival with multiple
          ticket categories. These are fictional samples for exploring the
          booking experience.
        </p>
      </header>
      <div className="grid gap-5 lg:grid-cols-3">
        {samples.map((event) => (
          <article
            key={event.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-6"
          >
            <span className="text-sm font-semibold text-accent">
              {formatLabels[event.booking?.kind ?? "event"]}
            </span>
            <h2 className="m-0 text-2xl">{event.name}</h2>
            <p className="text-sm text-text-muted">{event.description}</p>
            <p className="text-sm">
              {shortDate.format(new Date(event.startsAt))} · {event.venue}
              {event.booking?.destination
                ? ` → ${event.booking.destination}`
                : ""}
            </p>
            <ul className="grid gap-2 text-sm">
              {event.ticketTypes?.map((type) => (
                <li className="flex justify-between gap-3" key={type.id}>
                  <span>{type.name}</span>
                  <strong>{money.format(type.priceCents / 100)}</strong>
                </li>
              ))}
            </ul>
            <p className="text-sm text-text-muted">
              {event.booking?.seating
                ? `${event.remainingCapacity} seats available · ${event.booking.seating.rows} rows · ${event.booking.seating.columns} seats per row`
                : "Open admission · No assigned seats"}
            </p>
            <Link
              className="button-primary mt-auto"
              href={`/event/${event.id}`}
            >
              Explore{" "}
              {event.booking?.kind === "bus"
                ? "journey"
                : event.booking?.kind === "cinema"
                  ? "screening"
                  : "tickets"}
            </Link>
          </article>
        ))}
      </div>
      {!samples.length && (
        <p className="rounded-xl border border-border p-6">
          Samples are not enabled in this environment.
        </p>
      )}
      <SeatingPlayground />
      <section className="mt-8 rounded-2xl border border-border bg-accent-soft p-6">
        <h2>Build your own</h2>
        <p>
          Choose a format in Create event, configure rows, aisles and blocked
          seats, then add ticket categories. Each departure or screening has its
          own seat inventory.
        </p>
        <Link className="button-secondary" href="/events/new">
          Create an event
        </Link>
      </section>
    </div>
  );
}
