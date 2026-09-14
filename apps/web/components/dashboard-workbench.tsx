"use client";
import { CreateEventForm } from "./create-event-form";
import { PageSkeleton } from "./page-skeleton";
import { useState } from "react";
import type { Event, SalesSummary } from "../api";
import Link from "next/link";

import {
  Plus,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ScanLine,
  ShieldCheck,
  Ticket as TicketIcon,
  XCircle,
} from "lucide-react";
import { dateTime } from "../formatters";
import { eventCategory, eventStatus, eventTone } from "../event-utils";
import { useAppContext } from "./app-provider";
import { EventThumbnail } from "./event-thumbnail";
import {
  emptyHostedEventFilters,
  filterHostedEvents,
  hostedEventStatus,
  HostedEventStatus,
} from "../hosted-event-filters";
import { useHostedEvents } from "./use-hosted-events";
import { SalesOverview } from "./sales-overview";

const sectionKicker =
  "mb-2 text-[0.78rem] font-(--weight-semibold) uppercase tracking-[0.08em] text-accent";
const panel = "rounded-xl border border-border bg-surface-raised";
const panelHeading =
  "mb-3 flex items-center gap-2.5 text-text [&_h2]:mb-0 [&_h2]:text-[1.55rem] [&_svg]:text-accent";
const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(--button-bg) px-4 font-(--weight-bold) text-(--button-text) hover:bg-accent";
const secondaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface-muted px-4 font-(--weight-bold) text-text";
const helperLine = "mb-0 text-[0.88rem] leading-normal text-text-soft";
const stateLine =
  "mb-0 rounded-lg bg-accent-soft p-3 text-[0.92rem] font-(--weight-medium) text-accent";
const statCard =
  "grid min-h-31.5 content-end gap-2.5 rounded-lg border border-border bg-[linear-gradient(180deg,rgb(255_255_255/6%),transparent_58%),var(--surface-raised)] p-4.5 shadow-[0_18px_50px_rgb(0_0_0/16%)] [&_small]:text-[0.78rem] [&_small]:font-(--weight-semibold) [&_small]:uppercase [&_small]:tracking-[0.08em] [&_small]:text-text-soft [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:text-[clamp(1.8rem,3vw,2.75rem)] [&_strong]:font-(--weight-bold) [&_strong]:leading-[0.95] [&_strong]:text-text";
const compactBadge =
  "inline-flex min-h-7 items-center rounded-full border border-border bg-surface-muted px-2.75 text-[0.74rem] font-(--weight-semibold) uppercase text-text";

export function DashboardWorkbench({
  view = "events",
  initialEvents,
  initialSales,
}: {
  view?: "events" | "reports" | "scan" | "create";
  initialEvents?: Event[];
  initialSales?: SalesSummary;
}) {
  const {
    cameraEnabled,
    canVerifyTickets,
    dashboardEvents: cachedHostedEvents,
    gateCode,
    gateResult,
    scan,
    scanState,
    session,
    setCameraEnabled,
    setGateCode,
    videoRef,
  } = useAppContext();
  const hosted = useHostedEvents(
    session?.token,
    cachedHostedEvents,
    initialEvents,
  );
  const dashboardEvents = hosted.events;
  const [eventFilters, setEventFilters] = useState(emptyHostedEventFilters);
  const now = Date.now();
  const matchingEvents = filterHostedEvents(dashboardEvents, eventFilters, now);
  const dashboardUpcomingCount = dashboardEvents.filter(
    (event) => hostedEventStatus(event, now) === "upcoming",
  ).length;
  const invalidDateRange = Boolean(
    eventFilters.from && eventFilters.to && eventFilters.from > eventFilters.to,
  );

  if (!session) return <PageSkeleton view={view} />;

  return (
    <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className={sectionKicker}>Organizer workspace</p>
          <h1 className="mb-2 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight text-text">
            {view === "events"
              ? "Your events"
              : view === "reports"
                ? "Reports"
                : view === "scan"
                  ? "Check-in"
                  : "Create an event"}
          </h1>
          <p className="m-0 text-text-muted">
            {view === "events"
              ? "Plan, publish, and manage your events in one place."
              : view === "reports"
                ? "Keep track of ticket activity across your events."
                : view === "scan"
                  ? "Welcome your guests. Scan a ticket to check them in."
                  : "Set the details and save a draft, or publish when you�re ready."}
          </p>
        </div>
        {view !== "create" && (
          <Link className={primaryAction} href="/events/new">
            <Plus size={18} /> Create event
          </Link>
        )}
      </header>

      {view === "events" && dashboardEvents.length > 0 && (
        <section
          className="mb-4.5 grid grid-cols-3 gap-3 max-[600px]:grid-cols-1"
          aria-label="Dashboard summary"
        >
          <article className={statCard}>
            <small>Upcoming</small>
            <strong>{hosted.loading ? "—" : dashboardUpcomingCount}</strong>
          </article>
          <article className={statCard}>
            <small>Tickets issued</small>
            <strong>
              {hosted.loading
                ? "—"
                : dashboardEvents
                    .reduce(
                      (total, event) => total + (event.ticketsSold ?? 0),
                      0,
                    )
                    .toLocaleString("en-UG")}
            </strong>
          </article>
          <article className={statCard}>
            <small>Drafts</small>
            <strong>
              {hosted.loading
                ? "—"
                : dashboardEvents.filter((event) => event.status === "draft")
                    .length}
            </strong>
          </article>
        </section>
      )}
      {view === "reports" && (
        <SalesOverview
          key={session.user.id}
          token={session.token}
          initialData={initialSales}
        />
      )}
      <div className="grid gap-5">
        {view === "create" && <CreateEventForm />}

        <div className="grid min-w-0 gap-4.5">
          {view === "events" && (
            <section className={`${panel} grid gap-5 p-6`}>
              <div className={panelHeading}>
                <CalendarDays size={22} />
                <h2>Your events</h2>
              </div>
              {dashboardEvents.length > 0 && (
                <details className="rounded-lg border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium text-text-muted">
                    Search & filter events
                    {eventFilters.search ||
                    eventFilters.status !== "all" ||
                    eventFilters.from ||
                    eventFilters.to
                      ? " � Filters active"
                      : ""}
                  </summary>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm text-text">
                      Search events
                      <input
                        className="min-h-11 rounded-lg border border-border bg-surface-muted px-3"
                        type="search"
                        value={eventFilters.search}
                        onChange={(event) =>
                          setEventFilters((current) => ({
                            ...current,
                            search: event.target.value,
                          }))
                        }
                        placeholder="Name, venue or description"
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-text">
                      Status
                      <select
                        className="min-h-11 rounded-lg border border-border bg-surface-muted px-3"
                        value={eventFilters.status}
                        onChange={(event) =>
                          setEventFilters((current) => ({
                            ...current,
                            status: event.target.value as HostedEventStatus,
                          }))
                        }
                      >
                        <option value="all">All events</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past start dates</option>
                        <option value="draft">Drafts</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm text-text">
                      From (local date)
                      <input
                        className="min-h-11 rounded-lg border border-border bg-surface-muted px-3"
                        type="date"
                        value={eventFilters.from}
                        onChange={(event) =>
                          setEventFilters((current) => ({
                            ...current,
                            from: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-text">
                      Through (local date)
                      <input
                        className="min-h-11 rounded-lg border border-border bg-surface-muted px-3"
                        type="date"
                        value={eventFilters.to}
                        min={eventFilters.from || undefined}
                        onChange={(event) =>
                          setEventFilters((current) => ({
                            ...current,
                            to: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-text">
                      Sort
                      <select
                        className="min-h-11 rounded-lg border border-border bg-surface-muted px-3"
                        value={eventFilters.sort}
                        onChange={(event) =>
                          setEventFilters((current) => ({
                            ...current,
                            sort: event.target.value as "soonest" | "latest",
                          }))
                        }
                      >
                        <option value="soonest">Earliest first</option>
                        <option value="latest">Latest first</option>
                      </select>
                    </label>
                    <div className="flex flex-wrap items-end gap-2">
                      <button
                        className={secondaryAction}
                        type="button"
                        onClick={() => setEventFilters(emptyHostedEventFilters)}
                      >
                        Clear filters
                      </button>
                      <button
                        className={secondaryAction}
                        type="button"
                        disabled={hosted.refreshing}
                        onClick={hosted.refresh}
                      >
                        {hosted.refreshing ? "Refreshing…" : "Refresh"}
                      </button>
                    </div>
                  </div>
                </details>
              )}
              {hosted.error && (
                <div role="alert" className={stateLine}>
                  {hosted.error}
                  <button
                    type="button"
                    className="ml-3 underline"
                    disabled={hosted.refreshing}
                    onClick={hosted.refresh}
                  >
                    Try again
                  </button>
                </div>
              )}
              {invalidDateRange && (
                <p role="alert" className={stateLine}>
                  The end date must be on or after the start date.
                </p>
              )}
              {!hosted.loading && (
                <p role="status" className={helperLine}>
                  {matchingEvents.length} of {dashboardEvents.length} events ·
                  Refreshes every 30 seconds while visible.
                </p>
              )}
              {hosted.loading ? (
                <p role="status" className={helperLine}>
                  Loading your events…
                </p>
              ) : hosted.error &&
                dashboardEvents.length === 0 ? null : dashboardEvents.length ===
                0 ? (
                <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl bg-surface-muted px-6 py-12 text-center text-text-muted">
                  <span className="grid size-16 place-items-center rounded-2xl border border-border bg-surface-raised text-accent">
                    <TicketIcon size={28} />
                  </span>
                  <div>
                    <h3 className="mb-2 text-2xl font-semibold text-text">
                      Make your first event happen.
                    </h3>
                    <p className="m-0 max-w-100 text-sm leading-relaxed">
                      Bring people together. Set up your event, add tickets, and
                      get ready to welcome your guests.
                    </p>
                  </div>
                  <Link className={primaryAction} href="/events/new">
                    Create your first event <ArrowRight size={17} />
                  </Link>
                  <span className="text-xs text-text-soft">
                    Start with a draft. Publish when you�re ready.
                  </span>
                </div>
              ) : matchingEvents.length === 0 ? (
                <p className={helperLine}>No events match these filters.</p>
              ) : (
                <div className="grid gap-3">
                  {matchingEvents.map((event, index) => (
                    <article
                      className="grid min-w-0 grid-cols-[190px_minmax(0,1fr)] gap-4 rounded-4.5 border border-border bg-surface-muted p-3 max-[820px]:grid-cols-1"
                      key={event.id}
                    >
                      <EventThumbnail
                        event={event}
                        tone={eventTone(index)}
                        variant="preview"
                      />
                      <div>
                        <span className="flex flex-wrap gap-2">
                          <span className={compactBadge}>
                            {eventStatus(event)}
                          </span>
                          <span className={compactBadge}>
                            {eventCategory(event)}
                          </span>
                        </span>
                        <h3 className="my-3 line-clamp-2 text-[1.45rem] font-(--weight-bold) leading-[1.05] text-text">
                          {event.name || "Untitled draft"}
                        </h3>
                        <p className="mb-3 line-clamp-2 leading-[1.45] text-text-muted">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-2 [&_span]:inline-flex [&_span]:min-h-8 [&_span]:items-center [&_span]:gap-1.75 [&_span]:rounded-full [&_span]:bg-surface-raised [&_span]:px-2.5 [&_span]:text-[0.82rem] [&_span]:font-(--weight-medium) [&_span]:text-text-muted [&_svg]:text-accent">
                          <span>
                            <CalendarDays size={15} />
                            {new Date(event.startsAt).getTime() === 0
                              ? "Start date not set"
                              : dateTime.format(new Date(event.startsAt))}
                          </span>
                          <span>
                            <MapPin size={15} />
                            {event.venue}
                          </span>
                          <strong className="inline-flex min-h-8 items-center gap-1.75 rounded-full bg-surface-raised px-2.5 text-[0.82rem] font-(--weight-medium) text-price">
                            {event.capacity?.toLocaleString("en-UG") ??
                              "Unlimited"}{" "}
                            spots
                          </strong>
                        </div>
                        <p className="my-3 text-sm text-text-muted">
                          {event.ticketsSold ?? 0} tickets (not cancelled) ·{" "}
                          {event.status === "draft"
                            ? "Sales not open"
                            : event.status === "cancelled"
                              ? "Sales closed; history retained"
                              : event.soldOut
                                ? "Sold out"
                                : event.remainingCapacity == null
                                  ? "Unlimited event capacity"
                                  : `${event.remainingCapacity} remaining at event level`}
                        </p>
                        <a
                          className={secondaryAction}
                          href={`/events/${event.id}`}
                        >
                          Manage event
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {view === "scan" && (
            <section className="grid max-w-340 grid-cols-[0.7fr_1fr] items-center gap-4 rounded-lg border border-border bg-[#101010] p-5.5 text-white shadow-[0_18px_44px_rgb(18_24_31/6%)] max-[1120px]:grid-cols-1">
              <div>
                <div className="mb-3 flex items-center gap-2.5 text-white [&_h2]:mb-0 [&_h2]:text-[1.55rem]">
                  <ScanLine size={22} />
                  <h2>Ticket scanning</h2>
                </div>
                <p className="mb-0 text-white/72">
                  Scan QR tickets for events you created. Accepted tickets are
                  marked entered and cannot be reused.
                </p>
                <div className="mt-4 inline-flex min-h-9.5 items-center gap-2 rounded-lg bg-[#dff7e8] px-2.75 font-(--weight-semibold) text-[#14532d]">
                  <ShieldCheck size={18} />
                  {session.user.name} can scan owned-event tickets.
                </div>
              </div>
              <div className="grid min-h-57.5 place-items-center overflow-hidden rounded-lg border border-white/16 bg-[#191919] [&_video]:h-57.5 [&_video]:w-full [&_video]:object-cover">
                {cameraEnabled ? (
                  <video ref={videoRef} muted playsInline />
                ) : (
                  <div className="grid h-57.5 w-full place-items-center gap-2.5 text-[#8ddbd3] [&_span]:font-(--weight-medium) [&_span]:text-white/78">
                    <ShieldCheck size={54} />
                    <span>Ready to scan</span>
                  </div>
                )}
              </div>
              <div className="col-start-2 grid grid-cols-[auto_1fr_auto] gap-2.5 max-[1120px]:col-auto max-[820px]:grid-cols-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-surface-elevated [&_input]:px-3 [&_input]:text-text">
                <button
                  type="button"
                  className={secondaryAction}
                  onClick={() => setCameraEnabled((value) => !value)}
                  disabled={!canVerifyTickets}
                >
                  <ScanLine size={18} />
                  {cameraEnabled ? "Stop camera" : "Start camera"}
                </button>
                <input
                  aria-label="Ticket code"
                  placeholder="Paste or type ticket code"
                  value={gateCode}
                  onChange={(event) => setGateCode(event.target.value)}
                />
                <button
                  type="button"
                  className={primaryAction}
                  onClick={() => void scan()}
                  disabled={!canVerifyTickets}
                >
                  Validate
                </button>
              </div>
              {scanState && <p className={stateLine}>{scanState}</p>}
              {gateResult && (
                <div
                  className={`col-start-2 flex items-center gap-3 rounded-lg p-3.5 max-[1120px]:col-auto ${
                    gateResult.result === "accepted"
                      ? "bg-[#dff7e8] text-[#14532d]"
                      : "bg-[#ffe8df] text-[#8d2718]"
                  }`}
                >
                  {gateResult.result === "accepted" ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <XCircle size={28} />
                  )}
                  <div>
                    <strong className="block capitalize">
                      {gateResult.result.replace("_", " ")}
                    </strong>
                    <span className="wrap-break-word">
                      {gateResult.ticket?.buyerName ?? gateResult.message}
                      {gateResult.ticket?.ticketTypeName &&
                        ` · ${gateResult.ticket.ticketTypeName}`}
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
