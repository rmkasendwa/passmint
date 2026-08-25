"use client";

import {
  CalendarDays,
  CircleDollarSign,
  Edit3,
  LogIn,
  MapPin,
  QrCode,
  Save,
  Ticket as TicketIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, Event } from "../api";
import { eventCategory, eventStatus } from "../event-utils";
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
  } = useAppContext();
  const [displayEvent, setDisplayEvent] = useState(event);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState("");
  const [draft, setDraft] = useState({
    name: event.name,
    description: event.description,
    venue: event.venue,
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
    <section className="mx-auto mt-6.5 grid w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] max-w-(--content-max) gap-5 text-text">
      <section className="event-detail-hero">
        <span className="event-detail-hero__media" aria-hidden="true">
          <EventImage
            src={displayEvent.thumbnailUrl}
            name={displayEvent.name}
            fallbackClassName=""
          />
        </span>
        <div className="event-detail-hero__copy">
          <div className="flex flex-wrap gap-2">
            <span>{eventCategory(displayEvent)}</span>
            <span>{eventStatus(displayEvent)}</span>
          </div>
          <h1>{displayEvent.name}</h1>
          <p>{displayEvent.description}</p>
          <div className="event-detail-hero__meta">
            <span>
              <CalendarDays size={17} />
              {dateTime.format(new Date(displayEvent.startsAt))}
            </span>
            <span>
              <MapPin size={17} />
              {displayEvent.venue}
            </span>
            <span>
              <Users size={17} />
              {displayEvent.capacity.toLocaleString("en-UG")} spots
            </span>
            <strong>{money.format(displayEvent.priceCents / 100)}</strong>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-5 max-[1120px]:grid-cols-1">
        <div className="grid gap-5">
          <section className={panelPadded}>
            <div className="flex items-center gap-2.5 text-(color:--text) [&_svg]:text-(color:--accent)">
              <TicketIcon size={22} />
              <h2 className="mb-0 text-[1.55rem]">Event details</h2>
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
              <p className="mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--accent)">
                {session ? "Signed in checkout" : "Guest checkout"}
              </p>
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
            <div className="flex items-center gap-2.5 text-(color:--text) [&_svg]:text-(color:--accent)">
              <CircleDollarSign size={22} />
              <h2 className="mb-0 text-[1.55rem]">Checkout</h2>
            </div>
            <div className="grid gap-1 rounded-lg bg-(color:--surface-muted) p-3">
              <strong className="text-(color:--text)">{checkoutEvent.name}</strong>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {dateTime.format(new Date(checkoutEvent.startsAt))}
              </span>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {checkoutEvent.venue}
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
                <input
                  min={1}
                  max={10}
                  type="number"
                  value={quantity}
                  onChange={(input) => setQuantity(Number(input.target.value))}
                  required
                />
              </label>
              {checkoutEvent.priceCents > 0 && (
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
              )}
              <button className={primaryAction} type="submit">
                <CircleDollarSign size={18} />
                {checkoutEvent.priceCents === 0
                  ? "Get ticket"
                  : "Pay with mobile money"}
              </button>
            </form>
            {purchaseState && (
              <p className="mb-0 rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent)">
                {purchaseState}
              </p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
