"use client";

import {
  CalendarDays,
  CircleDollarSign,
  Clock,
  Edit3,
  ExternalLink,
  LogIn,
  MapPin,
  Minus,
  Navigation,
  Plus,
  QrCode,
  Save,
  Ticket as TicketIcon,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Event } from "../api";
import { eventCategory, eventStatus, eventTone } from "../event-utils";
import { dateTime, money } from "../formatters";
import { useAppContext } from "./app-provider";
import { EventImage } from "./event-image";

const panel =
  "rounded-lg border border-(color:--border) bg-(color:--surface-raised) shadow-[0_18px_52px_rgb(0_0_0/14%)]";
const panelPadded = `${panel} grid gap-4 p-[18px]`;
const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(color:--button-bg) px-4 font-(weight:--weight-bold) text-(color:--button-text) hover:bg-(color:--accent)";
const secondaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-(color:--border) bg-(color:--surface-muted) px-4 font-(weight:--weight-bold) text-(color:--text)";
const formGrid =
  "grid gap-3 [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[0.82rem] [&_label]:font-(weight:--weight-semibold) [&_label]:text-(color:--text-muted) [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-(color:--border) [&_input]:bg-(color:--surface-elevated) [&_input]:px-3 [&_input]:text-(color:--text) [&_input]:focus:border-(color:--accent) [&_input]:focus:outline-[3px_solid_rgb(255_122_69/18%)] [&_textarea]:min-h-[112px] [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-(color:--border) [&_textarea]:bg-(color:--surface-elevated) [&_textarea]:px-3 [&_textarea]:py-[11px] [&_textarea]:text-(color:--text) [&_textarea]:focus:border-(color:--accent) [&_textarea]:focus:outline-[3px_solid_rgb(255_122_69/18%)]";
const sectionHeading =
  "mb-0 text-[clamp(1.45rem,2vw,2rem)] font-(weight:--weight-bold) leading-tight text-(color:--text)";
const kicker =
  "mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--accent)";

const eventDay = new Intl.DateTimeFormat("en-UG", {
  day: "2-digit",
});
const eventMonth = new Intl.DateTimeFormat("en-UG", {
  month: "short",
});
const eventTime = new Intl.DateTimeFormat("en-UG", {
  hour: "2-digit",
  minute: "2-digit",
});
const quantityFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toLocalInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function ownerId(event: Event) {
  if (!event.owner) return null;
  return typeof event.owner === "string" ? event.owner : event.owner.id;
}

function ownerName(event: Event) {
  if (!event.owner || typeof event.owner === "string") return "Passmint organizer";
  return event.owner.name;
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(10, Math.max(1, Math.trunc(value)));
}

export function EventDetail({ event }: { event: Event }) {
  const {
    buyerEmail,
    buyerName,
    buyTickets,
    chooseEvent,
    dashboardEvents,
    mobileMoneyNumber,
    openAuth,
    purchaseState,
    quantity,
    session,
    setBuyerEmail,
    setBuyerName,
    setMobileMoneyNumber,
    setQuantity,
    ticketHistory,
    tickets,
    visibleEvents,
  } = useAppContext();
  const [displayEvent, setDisplayEvent] = useState(event);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<"airtel" | "mtn">(
    "mtn",
  );
  const formattedQuantity = quantityFormat.format(quantity);
  const [draft, setDraft] = useState({
    name: event.name,
    description: event.description,
    venue: event.venue,
    mapLocation: event.mapLocation ?? "",
    startsAt: toLocalInputValue(event.startsAt),
    capacity: event.capacity,
    priceCents: event.priceCents,
    thumbnailUrl: event.thumbnailUrl ?? "",
  });

  useEffect(() => {
    chooseEvent(event.id);
  }, [event.id]);

  const ownedBySession =
    Boolean(session && ownerId(displayEvent) === session.user.id) ||
    dashboardEvents.some((ownedEvent) => ownedEvent.id === displayEvent.id);
  const relevantIssuedTickets = tickets.filter(
    (ticket) => ticket.event.id === displayEvent.id,
  );
  const savedTicketsForEvent = useMemo(
    () =>
      ticketHistory.filter((ticket) => ticket.event.id === displayEvent.id),
    [displayEvent.id, ticketHistory],
  );
  const ticketsForEvent = useMemo(() => {
    const byId = new Map(
      [...relevantIssuedTickets, ...savedTicketsForEvent].map((ticket) => [
        ticket.id,
        ticket,
      ]),
    );

    return [...byId.values()];
  }, [relevantIssuedTickets, savedTicketsForEvent]);
  const checkoutEvent = displayEvent;
  const ticketTotalCents = checkoutEvent.priceCents * quantity;
  const startsAt = new Date(displayEvent.startsAt);
  const mapQuery = displayEvent.mapLocation || displayEvent.venue;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapEmbedUrl = displayEvent.mapLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(displayEvent.mapLocation)}&output=embed`
    : "";
  const eventIndex = visibleEvents.findIndex(
    (listedEvent) => listedEvent.id === displayEvent.id,
  );
  const detailMood = eventIndex === 0 ? "gold" : "green";
  const detailTone = eventTone(Math.max(eventIndex, 0));
  function updateQuantityFromText(value: string) {
    const digits = value.replace(/\D/g, "");
    setQuantity(normalizeQuantity(Number(digits || "1")));
  }

  function stepQuantity(direction: 1 | -1) {
    setQuantity(normalizeQuantity(quantity + direction));
  }

  async function saveEvent(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!session) {
      setEditState("Sign in to edit this event.");
      return;
    }

    setEditState("Saving event...");

    try {
      const updated = await api.updateEvent(
        displayEvent.id,
        {
          name: draft.name,
          description: draft.description,
          venue: draft.venue,
          mapLocation: draft.mapLocation,
          startsAt: new Date(draft.startsAt).toISOString(),
          capacity: Number(draft.capacity),
          priceCents: Number(draft.priceCents),
          ...(draft.thumbnailUrl ? { thumbnailUrl: draft.thumbnailUrl } : {}),
        },
        session.token,
      );
      setDisplayEvent(updated);
      setDraft({
        name: updated.name,
        description: updated.description,
        venue: updated.venue,
        mapLocation: updated.mapLocation ?? "",
        startsAt: toLocalInputValue(updated.startsAt),
        capacity: updated.capacity,
        priceCents: updated.priceCents,
        thumbnailUrl: updated.thumbnailUrl ?? "",
      });
      setIsEditing(false);
      setEditState("Event updated.");
    } catch (error) {
      const fallback = error as { message?: string };
      setEditState(fallback.message ?? "Event could not be updated.");
    }
  }

  return (
    <section
      className={`event-detail-page event-detail-page--${detailMood} mx-auto mt-5 grid w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] max-w-(--content-max) gap-5 text-text`}
    >
      <section className="event-detail-showcase">
        <span className="event-detail-showcase__sheen" aria-hidden="true" />
        <span className="event-detail-showcase__orb" aria-hidden="true" />
        <span className="event-detail-showcase__arc" aria-hidden="true" />
        <div className="event-detail-poster">
          <EventImage
            src={displayEvent.thumbnailUrl}
            name={displayEvent.name}
            fallbackClassName={`event-detail-poster__fallback ${detailTone}`}
          />
        </div>
        <div className="event-detail-showcase__body">
          <div className="flex flex-wrap gap-2">
            <span className="event-detail-chip">
              {eventCategory(displayEvent)}
            </span>
            <span className="event-detail-chip">
              {eventStatus(displayEvent)}
            </span>
          </div>
          <div>
            <h1 className="mb-4 text-[clamp(2.7rem,6vw,6.4rem)] font-(weight:--weight-bold) leading-[0.94] text-white">
              {displayEvent.name}
            </h1>
            <p className="mb-0 max-w-[720px] text-[1.08rem] leading-[1.6] text-white/76">
              {displayEvent.description}
            </p>
          </div>
          <div className="event-detail-showcase__facts">
            <span>
              <CalendarDays size={17} />
              {dateTime.format(startsAt)}
            </span>
            <span>
              <MapPin size={17} />
              {displayEvent.venue}
            </span>
            <strong>{money.format(displayEvent.priceCents / 100)}</strong>
          </div>
        </div>
      </section>

      <section className="event-detail-summary grid grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-(color:--border) bg-(color:--surface-raised) p-4 shadow-[0_18px_52px_rgb(0_0_0/12%)] max-[820px]:grid-cols-1">
        <div className="grid min-h-[118px] place-items-center rounded-lg border border-(color:--border) bg-(color:--surface-muted) text-center">
          <span className="text-[0.84rem] font-(weight:--weight-semibold) uppercase tracking-[0.12em] text-(color:--accent)">
            {eventMonth.format(startsAt)}
          </span>
          <strong className="text-[3rem] font-(weight:--weight-bold) leading-none text-(color:--text)">
            {eventDay.format(startsAt)}
          </strong>
          <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-(weight:--weight-semibold) text-(color:--text-muted)">
            <Clock size={14} />
            {eventTime.format(startsAt)}
          </span>
        </div>
        <div className="grid gap-3">
          <div>
            <p className={kicker}>Organized by</p>
            <h2 className="mb-0 text-[1.35rem] font-(weight:--weight-bold) text-(color:--text)">
              {ownerName(displayEvent)}
            </h2>
          </div>
          <div className="grid gap-2 text-[0.98rem] text-(color:--text-muted) [&_span]:inline-flex [&_span]:items-start [&_span]:gap-2 [&_svg]:mt-[3px] [&_svg]:shrink-0 [&_svg]:text-(color:--accent)">
            <span>
              <MapPin size={16} />
              {displayEvent.mapLocation || displayEvent.venue}
            </span>
            <span>
              <Users size={16} />
              {displayEvent.capacity.toLocaleString("en-UG")} total spots
            </span>
          </div>
        </div>
        <a
          className={secondaryAction}
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation size={17} />
          View map
        </a>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-5 max-[1120px]:grid-cols-1">
        <div className="grid gap-5">
          <section className={panelPadded}>
            <div className="flex items-center justify-between gap-3 max-[700px]:grid">
              <div>
                <p className={kicker}>About this event</p>
                <h2 className={sectionHeading}>Event details</h2>
              </div>
              <span className="inline-flex min-h-9 w-fit items-center rounded-full border border-(color:--border) bg-(color:--surface-muted) px-3 text-[0.84rem] font-(weight:--weight-semibold) text-(color:--text-muted)">
                {eventStatus(displayEvent)}
              </span>
            </div>
            <p className="mb-0 text-[1.02rem] leading-[1.65] text-(color:--text-muted)">
              {displayEvent.description}
            </p>
            {ownedBySession && (
              <button
                className={secondaryAction}
                type="button"
                onClick={() => setIsEditing((value) => !value)}
              >
                <Edit3 size={17} />
                {isEditing ? "Close editor" : "Edit event"}
              </button>
            )}
          </section>

          <section className={panelPadded}>
            <div>
              <p className={kicker}>Location</p>
              <h2 className={sectionHeading}>{displayEvent.venue}</h2>
            </div>
            <div className="event-detail-map grid min-h-[220px] place-items-center overflow-hidden rounded-lg border border-(color:--border) bg-[linear-gradient(135deg,color-mix(in_srgb,var(--event-detail-accent)_14%,var(--surface-muted)),var(--surface-elevated))] text-center">
              {mapEmbedUrl ? (
                <iframe
                  className="h-[320px] w-full border-0 max-[700px]:h-[260px]"
                  src={mapEmbedUrl}
                  title={`Map for ${displayEvent.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="grid max-w-[520px] place-items-center gap-3 p-5">
                  <span className="grid size-12 place-items-center rounded-full bg-(color:--accent-soft) text-(color:--accent)">
                    <MapPin size={24} />
                  </span>
                  <p className="mb-0 text-(color:--text-muted)">
                    The host has not added an exact map location yet. You can
                    still search for the venue in Google Maps.
                  </p>
                  <a
                    className={secondaryAction}
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={17} />
                    View on Google Maps
                  </a>
                </div>
              )}
            </div>
            {mapEmbedUrl && (
              <a
                className={`${secondaryAction} w-fit`}
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={17} />
                Open in Google Maps
              </a>
            )}
          </section>

          <section className={panelPadded}>
            <div>
              <p className={kicker}>Plan your visit</p>
              <h2 className={sectionHeading}>Before you go</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
              {[
                ["Bring your ticket QR", "Your purchased QR code appears here immediately after checkout."],
                ["Arrive on time", `Doors are based around the ${eventTime.format(startsAt)} start time.`],
                ["Check the venue", "Use the map link before leaving so your route is clear."],
              ].map(([title, copy]) => (
                <article
                  className="rounded-lg border border-(color:--border) bg-(color:--surface-muted) p-4"
                  key={title}
                >
                  <h3 className="mb-2 text-[1rem] text-(color:--text)">
                    {title}
                  </h3>
                  <p className="mb-0 text-[0.92rem] leading-[1.5] text-(color:--text-muted)">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {ownedBySession && isEditing && (
            <section className={panelPadded}>
              <div className="flex items-center gap-2.5 text-(color:--text) [&_svg]:text-(color:--accent)">
                <Edit3 size={22} />
                <h2 className="mb-0 text-[1.55rem]">Edit event</h2>
              </div>
              <form className={formGrid} onSubmit={saveEvent}>
                <label>
                  Event name
                  <input
                    value={draft.name}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        name: input.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={draft.description}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        description: input.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Venue
                  <input
                    value={draft.venue}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        venue: input.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Map location
                  <input
                    value={draft.mapLocation}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        mapLocation: input.target.value,
                      }))
                    }
                    placeholder="Optional address, map place, or coordinates"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2.5 max-[820px]:grid-cols-1">
                  <label>
                    Starts
                    <input
                      type="datetime-local"
                      value={draft.startsAt}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          startsAt: input.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Capacity
                    <input
                      min={1}
                      type="number"
                      value={draft.capacity}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          capacity: Number(input.target.value),
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Price in UGX
                    <input
                      min={0}
                      type="number"
                      value={draft.priceCents / 100}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          priceCents: Number(input.target.value) * 100,
                        }))
                      }
                      required
                    />
                  </label>
                </div>
                <label>
                  Artwork URL
                  <input
                    value={draft.thumbnailUrl}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        thumbnailUrl: input.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <button className={primaryAction} type="submit">
                  <Save size={17} />
                  Save event
                </button>
              </form>
              {editState && (
                <p className="mb-0 rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent)">
                  {editState}
                </p>
              )}
            </section>
          )}

          <section className={panelPadded}>
            <div className="flex items-center gap-2.5 text-(color:--text) [&_svg]:text-(color:--accent)">
              <QrCode size={22} />
              <h2 className="mb-0 text-[1.55rem]">Your tickets for this event</h2>
            </div>
            {ticketsForEvent.length === 0 ? (
              <p className="mb-0 text-(color:--text-muted)">
                Tickets you buy for this event will appear here.
              </p>
            ) : (
              <div className="grid gap-3">
                {ticketsForEvent.map(
                  (ticket) => (
                    <article
                      className="grid grid-cols-[92px_1fr] items-center gap-3 rounded-lg border border-(color:--border) bg-(color:--surface-muted) p-3 max-[600px]:grid-cols-1"
                      key={ticket.id}
                    >
                      <img
                        className="size-[92px] rounded-lg bg-white p-1 max-[600px]:size-[132px]"
                        src={ticket.qrCodeDataUrl}
                        alt={`QR code for ${ticket.buyerName}`}
                      />
                      <div className="min-w-0">
                        <h3 className="mb-1 truncate text-(color:--text)">
                          {ticket.buyerName}
                        </h3>
                        <p className="mb-2 text-(color:--text-muted)">
                          {ticket.status.replace("_", " ")}
                        </p>
                        <code className="rounded-md bg-(color:--surface-elevated) px-2 py-1 text-[0.78rem] text-(color:--accent)">
                          {ticket.code}
                        </code>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="sticky top-[94px] grid gap-5 max-[1120px]:static">
          <section className={panelPadded}>
            <div>
              <p className={kicker}>{session ? "Signed in checkout" : "Guest checkout"}</p>
              <h2 className="mb-0 text-[1.55rem]">
                {session ? `Buying as ${session.user.name}` : "Reserve your spot"}
              </h2>
            </div>
            {!session && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={secondaryAction}
                  onClick={() => openAuth("login")}
                >
                  <LogIn size={17} />
                  Sign in
                </button>
                <button
                  type="button"
                  className={primaryAction}
                  onClick={() => openAuth("register")}
                >
                  <UserPlus size={17} />
                  Register
                </button>
              </div>
            )}
          </section>

          <section className={panelPadded}>
            <div className="select-ticket-heading">
              <span className="select-ticket-heading__icon">
                <TicketIcon size={22} />
              </span>
              <div>
                <p className={kicker}>Select tickets</p>
                <h2 className="mb-0 text-[1.55rem]">1 ticket category available</h2>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border border-(color:--border) bg-(color:--surface-muted) p-3">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-(color:--text)">General admission</strong>
                <strong className="text-(color:--price)">
                  {money.format(checkoutEvent.priceCents / 100)}
                </strong>
              </div>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {dateTime.format(new Date(checkoutEvent.startsAt))}
              </span>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {checkoutEvent.venue}
              </span>
              <span className="text-[0.86rem] font-(weight:--weight-semibold) text-(color:--text-soft)">
                Displayed price
              </span>
            </div>
            <button
              className={primaryAction}
              type="button"
              onClick={() => setCheckoutOpen(true)}
            >
              <CircleDollarSign size={18} />
              {checkoutEvent.priceCents === 0 ? "Get ticket" : "Pay now"}
            </button>
            {purchaseState && (
              <p className="mb-0 rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent)">
                {purchaseState}
              </p>
            )}
          </section>
        </aside>
      </div>
      {checkoutOpen && (
        <div
          className="checkout-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-dialog-title"
        >
          <button
            className="checkout-dialog__backdrop"
            type="button"
            aria-label="Close checkout"
            onClick={() => setCheckoutOpen(false)}
          />
          <section className="checkout-dialog__panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={kicker}>Checkout</p>
                <h2
                  className="mb-0 text-[clamp(1.6rem,3vw,2.35rem)] leading-tight text-(color:--text)"
                  id="checkout-dialog-title"
                >
                  {checkoutEvent.priceCents === 0
                    ? "Get your ticket"
                    : "Complete payment"}
                </h2>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-(color:--border) bg-(color:--surface-muted) text-(color:--text)"
                type="button"
                aria-label="Close checkout"
                onClick={() => setCheckoutOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 rounded-lg border border-(color:--border) bg-(color:--surface-muted) p-3">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-(color:--text)">General admission</strong>
                <strong className="text-(color:--price)">
                  {money.format(ticketTotalCents / 100)}
                </strong>
              </div>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {quantity.toLocaleString("en-UG")} x{" "}
                {money.format(checkoutEvent.priceCents / 100)}
              </span>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {dateTime.format(new Date(checkoutEvent.startsAt))}
              </span>
            </div>

            <form onSubmit={buyTickets} className={formGrid}>
              <label>
                Buyer name
                <input
                  value={buyerName}
                  onChange={(input) => setBuyerName(input.target.value)}
                  placeholder={session?.user.name ?? "Anonymous buyer name"}
                  required
                />
              </label>
              <label>
                Buyer email
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(input) => setBuyerEmail(input.target.value)}
                  placeholder={session?.user.email ?? "Email for ticket delivery"}
                  required
                />
              </label>
              <label>
                Quantity
                <span
                  className="quantity-stepper"
                  onWheel={(event) => {
                    event.preventDefault();
                    stepQuantity(event.deltaY < 0 ? 1 : -1);
                  }}
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => stepQuantity(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    inputMode="numeric"
                    pattern="[0-9,]*"
                    value={formattedQuantity}
                    onChange={(input) =>
                      updateQuantityFromText(input.target.value)
                    }
                    onKeyDown={(event) => {
                      if (["e", "E", "+", "-", "."].includes(event.key)) {
                        event.preventDefault();
                      }
                    }}
                    required
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => stepQuantity(1)}
                    disabled={quantity >= 10}
                  >
                    <Plus size={16} />
                  </button>
                </span>
              </label>

              {checkoutEvent.priceCents > 0 && (
                <>
                  <div>
                    <p className={kicker}>Payment method</p>
                    <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
                      {[
                        {
                          value: "mtn",
                          label: "MTN MoMo",
                          logo: "/payment/mtn-momo.svg",
                        },
                        {
                          value: "airtel",
                          label: "Airtel Money",
                          logo: "/payment/airtel-money.svg",
                        },
                      ].map((option) => (
                        <button
                          className={`payment-option payment-option--${option.value}`}
                          data-selected={paymentProvider === option.value}
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setPaymentProvider(
                              option.value as "airtel" | "mtn",
                            )
                          }
                        >
                          <span className="payment-option__poster">
                            <img src={option.logo} alt="" />
                          </span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    Mobile money number
                    <input
                      value={mobileMoneyNumber}
                      onChange={(input) =>
                        setMobileMoneyNumber(input.target.value)
                      }
                      placeholder="256..."
                      required
                    />
                  </label>
                </>
              )}

              <button className={primaryAction} type="submit">
                <CircleDollarSign size={18} />
                {checkoutEvent.priceCents === 0
                  ? "Get ticket"
                  : `Pay with ${
                      paymentProvider === "mtn" ? "MTN MoMo" : "Airtel Money"
                    }`}
              </button>
            </form>
            {purchaseState && (
              <p className="mb-0 rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent)">
                {purchaseState}
              </p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
