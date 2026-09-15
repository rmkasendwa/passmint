"use client";

import {
  CalendarDays,
  CheckCircle2,
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
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { api, Event } from "../api";
import { eventCategory, eventStatus, eventTone } from "../event-utils";
import { dateTime, money } from "../formatters";
import { useAppContext } from "./app-provider";
import { EventImage } from "./event-image";
import {
  FieldMessage,
  RequiredLabel,
  requiredField,
  requiredTextareaField,
  useInlineFormValidation,
} from "./form-validation";
import { PhoneNumberInput } from "./phone-number-input";
import { SeatMap } from "./seat-map";
import { BookingManager } from "./booking-manager";
import { formatLabels } from "../booking";
import { TicketTypeManager } from "./ticket-type-manager";
import { EventAttendees } from "./event-attendees";
import { EventScanMetrics } from "./scan-metrics";
import { EventDuplicate } from "./event-duplicate";
import { ticketSalesState, salesStateLabels } from "../ticket-sales";
import { useSalesClock } from "./use-sales-clock";
import { SalesOverview } from "./sales-overview";

const panel =
  "rounded-lg border border-border bg-surface-raised shadow-[0_18px_52px_rgb(0_0_0/14%)]";
const panelPadded = `${panel} grid gap-4 p-4.5`;
const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(--button-bg) px-4 font-(--weight-bold) text-(--button-text) hover:bg-accent";
const secondaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface-muted px-4 font-(--weight-bold) text-text";
const formGrid =
  "grid gap-3 [&_label]:grid [&_label]:gap-1.75 [&_label]:text-[0.82rem] [&_label]:font-(--weight-semibold) [&_label]:text-text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-surface-elevated [&_input]:px-3 [&_input]:text-text [&_input]:focus:border-accent [&_input]:focus:outline-[3px_solid_rgb(255_122_69/18%)] [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-surface-elevated [&_textarea]:px-3 [&_textarea]:py-2.75 [&_textarea]:text-text [&_textarea]:focus:border-accent [&_textarea]:focus:outline-[3px_solid_rgb(255_122_69/18%)]";
const sectionHeading =
  "mb-0 text-[clamp(1.45rem,2vw,2rem)] font-(--weight-bold) leading-tight text-text";
const kicker =
  "mb-2 text-[0.78rem] font-(--weight-semibold) uppercase tracking-[0.08em] text-accent";

const eventDay = new Intl.DateTimeFormat("en-UG", {
  timeZone: "Africa/Kampala",
  day: "2-digit",
});
const eventMonth = new Intl.DateTimeFormat("en-UG", {
  timeZone: "Africa/Kampala",
  month: "short",
});
const eventTime = new Intl.DateTimeFormat("en-UG", {
  timeZone: "Africa/Kampala",
  hour: "2-digit",
  minute: "2-digit",
});
const quantityFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toLocalInputValue(value: string) {
  const date = new Date(value);
  if (date.getTime() === 0) return "";
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
  if (!event.owner || typeof event.owner === "string")
    return "Passmint organizer";
  return event.owner.name;
}

function normalizeQuantity(value: number, maximum = 10) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(maximum, Math.max(1, Math.trunc(value)));
}

export function EventDetail({
  event,
  management = false,
  initialReports,
  initialNow,
  initialTickets = [],
}: {
  event: Event;
  management?: boolean;
  initialNow?: number;
  initialTickets?: import("../api").Ticket[];
  initialReports?: {
    sales: import("../api").SalesSummary;
    attendees: import("../api").AttendeePage;
    scans: import("../api").ScanMetrics;
  };
}) {
  const {
    buyerEmail,
    buyerName,
    buyTickets,
    chooseEvent,
    dashboardEvents,
    mobileMoneyNumber,
    openAuth,
    purchaseState,
    selectedSeats,
    setSelectedSeats,
    quantity,
    session,
    selectedTicketTypeId,
    setSelectedTicketTypeId,
    setBuyerEmail,
    setBuyerName,
    setMobileMoneyNumber,
    setQuantity,
    ticketHistory,
    ticketHistoryLoaded,
    tickets,
    visibleEvents,
  } = useAppContext();
  const [displayEvent, setDisplayEvent] = useState(event);
  useEffect(() => {
    document.title = `${management ? "Manage " : ""}${displayEvent.name} | Passmint`;
  }, [displayEvent.name, management]);
  const salesNow = useSalesClock(initialNow);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState("");
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const artworkInput = useRef<HTMLInputElement>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [publishAt, setPublishAt] = useState(
    event.publishAt ? toLocalInputValue(event.publishAt) : "",
  );
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
  const editValidation = useInlineFormValidation();
  const checkoutValidation = useInlineFormValidation();

  useEffect(() => {
    chooseEvent(event.id);
    setSelectedSeats([]);
  }, [event.id]);

  useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const latest = await api.getEvent(event.id, session?.token);
        if (active) setDisplayEvent(latest);
      } catch {
        /* Checkout still validates availability on the server. */
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [event.id, tickets, session?.token]);

  useEffect(() => {
    if (!checkoutOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [checkoutOpen]);

  const ownedBySession =
    session?.user.role === "admin" ||
    Boolean(session && ownerId(displayEvent) === session.user.id) ||
    dashboardEvents.some((ownedEvent) => ownedEvent.id === displayEvent.id);
  const relevantIssuedTickets = tickets.filter(
    (ticket) => ticket.event.id === displayEvent.id,
  );
  const savedTicketsForEvent = useMemo(
    () =>
      (ticketHistoryLoaded ? ticketHistory : initialTickets).filter(
        (ticket) => ticket.event.id === displayEvent.id,
      ),
    [displayEvent.id, ticketHistory, ticketHistoryLoaded, initialTickets],
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
  const selectedType = displayEvent.ticketTypes?.find(
    (type) => type.id === selectedTicketTypeId,
  );
  const unitPrice = selectedType?.priceCents ?? checkoutEvent.priceCents;
  const maximumQuantity = Math.max(
    1,
    Math.min(
      selectedType?.maxPerOrder ?? 10,
      selectedType?.remainingCapacity ?? 100,
      displayEvent.remainingCapacity ?? 100,
    ),
  );
  const selectedSalesState = ticketSalesState(
    displayEvent,
    selectedType,
    salesNow,
  );
  const categoryUnavailable = Boolean(
    displayEvent.ticketTypes?.length && selectedSalesState !== "available",
  );
  useEffect(() => {
    if (
      !displayEvent.ticketTypes?.some(
        (type) => type.id === selectedTicketTypeId,
      )
    )
      setSelectedTicketTypeId(
        displayEvent.ticketTypes?.find(
          (type) =>
            ticketSalesState(displayEvent, type, salesNow) === "available",
        )?.id ?? "",
      );
  }, [displayEvent, selectedTicketTypeId, salesNow]);
  const isDraft = displayEvent.status === "draft";
  const cancelled = displayEvent.status === "cancelled";
  const salesClosed = cancelled || isDraft;
  const ticketTotalCents = unitPrice * quantity;
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
  const editNameError = editValidation.fieldError({
    label: "Event name",
    required: true,
    value: draft.name,
  });
  const editDescriptionError = editValidation.fieldError({
    label: "Description",
    required: true,
    value: draft.description,
  });
  const editVenueError = editValidation.fieldError({
    label: "Venue",
    required: true,
    value: draft.venue,
  });
  const editStartsError = editValidation.fieldError({
    label: "Starts",
    required: true,
    value: draft.startsAt,
  });
  const editCapacityError = editValidation.fieldError({
    label: "Capacity",
    min: 1,
    required: false,
    value: draft.capacity ?? "",
  });
  const editPriceError = editValidation.fieldError({
    label: "Price in UGX",
    min: 0,
    required: true,
    value: draft.priceCents / 100,
  });
  const checkoutBuyerNameError = checkoutValidation.fieldError({
    label: "Buyer name",
    required: true,
    value: buyerName,
  });
  const checkoutBuyerEmailError = checkoutValidation.fieldError({
    label: "Buyer email",
    required: true,
    type: "email",
    value: buyerEmail,
  });
  const checkoutQuantityError = checkoutValidation.fieldError({
    label: "Quantity",
    max: maximumQuantity,
    min: 1,
    pattern: /^[0-9,]+$/,
    required: true,
    title: "Please enter a whole number.",
    value: formattedQuantity,
  });

  function updateQuantityFromText(value: string) {
    const digits = value.replace(/\D/g, "");
    setQuantity(normalizeQuantity(Number(digits || "1"), maximumQuantity));
  }

  function stepQuantity(direction: 1 | -1) {
    setQuantity(normalizeQuantity(quantity + direction, maximumQuantity));
  }

  async function saveEvent(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (savingEvent) return;
    if (!session) {
      setEditState("Sign in to edit this event.");
      return;
    }

    setEditState("Saving event...");
    setSavingEvent(true);

    try {
      let thumbnailUrl = draft.thumbnailUrl;
      if (artworkFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Unable to read artwork."));
          reader.readAsDataURL(artworkFile);
        });
        thumbnailUrl = (
          await api.uploadEventImage(
            {
              fileName: artworkFile.name,
              contentType: artworkFile.type,
              dataUrl,
            },
            session.token,
          )
        ).url;
      }
      const updated = await api.updateEvent(
        displayEvent.id,
        {
          name: draft.name,
          description: draft.description,
          venue: draft.venue,
          mapLocation: draft.mapLocation,
          ...(draft.startsAt
            ? { startsAt: new Date(draft.startsAt).toISOString() }
            : {}),
          capacity: draft.capacity,
          priceCents: Number(draft.priceCents),
          thumbnailUrl,
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
      setArtworkFile(null);
      setEditState("Event updated.");
    } catch (error) {
      const fallback = error as { message?: string };
      setEditState(fallback.message ?? "Event could not be updated.");
    } finally {
      setSavingEvent(false);
    }
  }

  async function cancelEvent() {
    if (
      !session ||
      !window.confirm(
        "Cancel this event? Ticket sales will stop and existing tickets will remain in purchase history.",
      )
    )
      return;
    try {
      setDisplayEvent(await api.cancelEvent(displayEvent.id, session.token));
      setCheckoutOpen(false);
      setIsEditing(false);
      setEditState("Event cancelled.");
    } catch (error) {
      setEditState(
        (error as { message?: string }).message ?? "Unable to cancel event.",
      );
    }
  }

  async function publishDraft() {
    if (!session) return;
    try {
      setDisplayEvent(
        await api.updateEvent(
          displayEvent.id,
          { status: "published" },
          session.token,
        ),
      );
      setEditState("Event published.");
    } catch (error) {
      setEditState(
        (error as { message?: string }).message ?? "Unable to publish.",
      );
    }
  }

  async function schedulePublication() {
    if (!session) return;
    try {
      const updated = await api.updateEvent(
        displayEvent.id,
        { publishAt: publishAt ? new Date(publishAt).toISOString() : null },
        session.token,
      );
      setDisplayEvent(updated);
      setEditState(
        updated.publishAt
          ? "Publication scheduled."
          : "Publication schedule removed.",
      );
    } catch (error) {
      setEditState(
        (error as { message?: string }).message ??
          "Unable to schedule publication.",
      );
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
            <h1 className="mb-4 text-[clamp(2.2rem,4vw,4.2rem)] font-(--weight-bold) leading-[1.06] text-text">
              {displayEvent.name}
            </h1>
            <p className="mb-0 max-w-180 text-[1.08rem] leading-[1.6] text-text-muted">
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

      <section className="event-detail-summary grid grid-cols-[150px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border bg-surface-raised p-4 shadow-[0_18px_52px_rgb(0_0_0/12%)] max-[820px]:grid-cols-1">
        <div className="grid min-h-29.5 place-items-center rounded-lg border border-border bg-surface-muted text-center">
          <span className="text-[0.84rem] font-(--weight-semibold) uppercase tracking-[0.12em] text-accent">
            {eventMonth.format(startsAt)}
          </span>
          <strong className="text-5xl font-(--weight-bold) leading-none text-text">
            {eventDay.format(startsAt)}
          </strong>
          <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-(--weight-semibold) text-text-muted">
            <Clock size={14} />
            {eventTime.format(startsAt)}
          </span>
        </div>
        <div className="grid gap-3">
          <div>
            <p className={kicker}>Organized by</p>
            <h2 className="mb-0 text-[1.35rem] font-(--weight-bold) text-text">
              {ownerName(displayEvent)}
            </h2>
          </div>
          <div className="grid gap-2 text-[0.98rem] text-text-muted [&_span]:inline-flex [&_span]:items-start [&_span]:gap-2 [&_svg]:mt-0.75 [&_svg]:shrink-0 [&_svg]:text-accent">
            <span>
              <MapPin size={16} />
              {displayEvent.mapLocation || displayEvent.venue}
            </span>
            <span>
              <Users size={16} />
              {displayEvent.capacity?.toLocaleString("en-UG") ??
                "Unlimited"}{" "}
              {displayEvent.booking?.seating ? "total seats" : "total spots"}
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
              <span className="inline-flex min-h-9 w-fit items-center rounded-full border border-border bg-surface-muted px-3 text-[0.84rem] font-(--weight-semibold) text-text-muted">
                {eventStatus(displayEvent)}
              </span>
            </div>
            <p className="mb-0 text-[1.02rem] leading-[1.65] text-text-muted">
              {displayEvent.description}
            </p>
            {cancelled && (
              <p
                role="status"
                className="rounded-lg bg-accent-soft p-3 text-text"
              >
                This event has been cancelled. Ticket sales are closed. Existing
                tickets remain in your purchase history.
              </p>
            )}
            {isDraft && (
              <p role="status">
                Private draft. Save your details, then publish when ready.
              </p>
            )}
            {ownedBySession && isDraft && (
              <button
                className={primaryAction}
                type="button"
                onClick={() => void publishDraft()}
              >
                Publish draft
              </button>
            )}
            {ownedBySession && isDraft && (
              <div className={formGrid}>
                <label>
                  Publish automatically at
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                  />
                </label>
                <button
                  className={secondaryAction}
                  type="button"
                  onClick={() => void schedulePublication()}
                >
                  {publishAt ? "Schedule publication" : "Remove schedule"}
                </button>
                {displayEvent.publishAt && (
                  <p>
                    Scheduled for{" "}
                    {dateTime.format(new Date(displayEvent.publishAt))}
                  </p>
                )}
              </div>
            )}
            {ownedBySession && !cancelled && (
              <button
                className={secondaryAction}
                type="button"
                onClick={() => setIsEditing((value) => !value)}
              >
                <Edit3 size={17} />
                {isEditing ? "Close editor" : "Edit event"}
              </button>
            )}
            {ownedBySession && !cancelled && (
              <button
                className={secondaryAction}
                type="button"
                onClick={() => void cancelEvent()}
              >
                Cancel event
              </button>
            )}
            {editState && !isEditing && <p role="status">{editState}</p>}
          </section>

          <section className={panelPadded}>
            <div>
              <p className={kicker}>Location</p>
              <h2 className={sectionHeading}>{displayEvent.venue}</h2>
            </div>
            <div className="event-detail-map grid min-h-55 place-items-center overflow-hidden rounded-lg border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--event-detail-accent)_14%,var(--surface-muted)),var(--surface-elevated))] text-center">
              {mapEmbedUrl ? (
                <iframe
                  className="h-80 w-full border-0 max-[700px]:h-65"
                  src={mapEmbedUrl}
                  title={`Map for ${displayEvent.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="grid max-w-130 place-items-center gap-3 p-5">
                  <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
                    <MapPin size={24} />
                  </span>
                  <p className="mb-0 text-text-muted">
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
                [
                  "Bring your ticket QR",
                  "Your purchased QR code appears here immediately after checkout.",
                ],
                [
                  "Arrive on time",
                  `{displayEvent.booking?.kind === "bus" ? "Departure is at" : displayEvent.booking?.kind === "cinema" ? "The screening starts at" : "Doors are based around the"} ${eventTime.format(startsAt)} start time.`,
                ],
                [
                  "Check the venue",
                  "Use the map link before leaving so your route is clear.",
                ],
              ].map(([title, copy]) => (
                <article
                  className="rounded-lg border border-border bg-surface-muted p-4"
                  key={title}
                >
                  <h3 className="mb-2 text-base text-text">{title}</h3>
                  <p className="mb-0 text-[0.92rem] leading-normal text-text-muted">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {ownedBySession && isEditing && (
            <section className={panelPadded}>
              <div className="flex items-center gap-2.5 text-text [&_svg]:text-accent">
                <Edit3 size={22} />
                <h2 className="mb-0 text-[1.55rem]">Edit event</h2>
              </div>
              <form
                className={formGrid}
                {...(isDraft
                  ? { noValidate: true, onSubmit: saveEvent }
                  : editValidation.formProps(saveEvent))}
              >
                <label>
                  <RequiredLabel>Event name</RequiredLabel>
                  <input
                    aria-describedby="edit-event-name-error"
                    aria-invalid={Boolean(editNameError) || undefined}
                    value={draft.name}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        name: input.target.value,
                      }))
                    }
                    {...requiredField("Event name")}
                  />
                  <FieldMessage
                    error={editNameError}
                    id="edit-event-name-error"
                  />
                </label>
                <label>
                  <RequiredLabel>Description</RequiredLabel>
                  <textarea
                    aria-describedby="edit-description-error"
                    aria-invalid={Boolean(editDescriptionError) || undefined}
                    value={draft.description}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        description: input.target.value,
                      }))
                    }
                    {...requiredTextareaField("Description")}
                  />
                  <FieldMessage
                    error={editDescriptionError}
                    id="edit-description-error"
                  />
                </label>
                <label>
                  <RequiredLabel>Venue</RequiredLabel>
                  <input
                    aria-describedby="edit-venue-error"
                    aria-invalid={Boolean(editVenueError) || undefined}
                    value={draft.venue}
                    onChange={(input) =>
                      setDraft((current) => ({
                        ...current,
                        venue: input.target.value,
                      }))
                    }
                    {...requiredField("Venue")}
                  />
                  <FieldMessage error={editVenueError} id="edit-venue-error" />
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
                    <RequiredLabel>Starts</RequiredLabel>
                    <input
                      aria-describedby="edit-starts-error"
                      aria-invalid={Boolean(editStartsError) || undefined}
                      type="datetime-local"
                      value={draft.startsAt}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          startsAt: input.target.value,
                        }))
                      }
                      {...requiredField("Starts")}
                    />
                    <FieldMessage
                      error={editStartsError}
                      id="edit-starts-error"
                    />
                  </label>
                  <label>
                    Capacity (leave blank for unlimited)
                    <input
                      aria-describedby="edit-capacity-error"
                      aria-invalid={Boolean(editCapacityError) || undefined}
                      min={1}
                      type="number"
                      value={draft.capacity ?? ""}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          capacity:
                            input.target.value === ""
                              ? null
                              : Number(input.target.value),
                        }))
                      }
                    />
                    <FieldMessage
                      error={editCapacityError}
                      id="edit-capacity-error"
                    />
                  </label>
                  <label>
                    <RequiredLabel>Price in UGX</RequiredLabel>
                    <input
                      aria-describedby="edit-price-error"
                      aria-invalid={Boolean(editPriceError) || undefined}
                      min={0}
                      type="number"
                      value={draft.priceCents / 100}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          priceCents: Number(input.target.value) * 100,
                        }))
                      }
                      {...requiredField("Price in UGX")}
                    />
                    <FieldMessage
                      error={editPriceError}
                      id="edit-price-error"
                    />
                  </label>
                </div>
                <label>
                  Artwork URL
                  <input
                    disabled={savingEvent}
                    value={draft.thumbnailUrl}
                    onChange={(input) => {
                      setArtworkFile(null);
                      if (artworkInput.current) artworkInput.current.value = "";
                      setDraft((current) => ({
                        ...current,
                        thumbnailUrl: input.target.value,
                      }));
                    }}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Upload replacement artwork
                  <input
                    ref={artworkInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={savingEvent}
                    onChange={(input) => {
                      const file = input.target.files?.[0] ?? null;
                      if (
                        file &&
                        (![
                          "image/jpeg",
                          "image/png",
                          "image/webp",
                          "image/gif",
                        ].includes(file.type) ||
                          file.size > 5 * 1024 * 1024)
                      ) {
                        setEditState(
                          "Choose a JPEG, PNG, WebP or GIF image up to 5 MB.",
                        );
                        input.target.value = "";
                        setArtworkFile(null);
                        return;
                      }
                      setArtworkFile(file);
                      setEditState("");
                    }}
                  />
                  <span>
                    Up to 5 MB. Uploads become static banners; animated images
                    use the first frame.
                  </span>
                </label>
                {artworkFile && (
                  <p role="status">
                    {artworkFile.name} will replace the artwork when saved.
                  </p>
                )}
                <button
                  className={secondaryAction}
                  type="button"
                  disabled={savingEvent}
                  onClick={() => {
                    setArtworkFile(null);
                    if (artworkInput.current) artworkInput.current.value = "";
                    setDraft((current) => ({ ...current, thumbnailUrl: "" }));
                  }}
                >
                  Remove artwork
                </button>
                <button
                  className={primaryAction}
                  type="submit"
                  disabled={savingEvent}
                >
                  <Save size={17} />
                  {savingEvent ? "Saving event…" : "Save event"}
                </button>
              </form>
              {editState && (
                <p className="mb-0 rounded-lg bg-accent-soft p-3 text-[0.92rem] font-(--weight-medium) text-accent">
                  {editState}
                </p>
              )}
            </section>
          )}

          {ownedBySession && session && (
            <SalesOverview
              initialData={initialReports?.sales}
              key={`sales:${displayEvent.id}:${session.user.id}`}
              eventId={displayEvent.id}
              token={session.token}
            />
          )}
          {ownedBySession && session && (
            <EventAttendees
              initialData={initialReports?.attendees}
              key={`${displayEvent.id}:${session.user.id}`}
              eventId={displayEvent.id}
              token={session.token}
            />
          )}
          {ownedBySession && session && (
            <EventScanMetrics
              initialData={initialReports?.scans}
              key={`${displayEvent.id}:${session.user.id}`}
              eventId={displayEvent.id}
              token={session.token}
            />
          )}
          {session && ownerId(displayEvent) === session.user.id && (
            <EventDuplicate eventId={displayEvent.id} token={session.token} />
          )}
          {ownedBySession && session && !cancelled && (
            <>
              <BookingManager
                event={displayEvent}
                token={session.token}
                onSaved={setDisplayEvent}
              />
              <TicketTypeManager
                event={displayEvent}
                token={session.token}
                onSaved={async () =>
                  setDisplayEvent(await api.getEvent(event.id, session.token))
                }
              />
            </>
          )}
          <section className={panelPadded}>
            <div className="flex items-center gap-2.5 text-text [&_svg]:text-accent">
              <QrCode size={22} />
              <h2 className="mb-0 text-[1.55rem]">
                Your tickets for this event
              </h2>
            </div>
            {ticketsForEvent.length === 0 ? (
              <p className="mb-0 text-text-muted">
                Tickets you buy for this event will appear here.
              </p>
            ) : (
              <div className="grid gap-3">
                {ticketsForEvent.map((ticket) => (
                  <article
                    className="grid grid-cols-[92px_1fr] items-center gap-3 rounded-lg border border-border bg-surface-muted p-3 max-[600px]:grid-cols-1"
                    key={ticket.id}
                  >
                    <img
                      className="size-23 rounded-lg bg-white p-1 max-[600px]:size-33"
                      src={ticket.qrCodeDataUrl}
                      alt={`QR code for ${ticket.buyerName}`}
                    />
                    <div className="min-w-0">
                      <h3 className="mb-1 truncate text-text">
                        {ticket.buyerName}
                      </h3>
                      <p className="mb-2 text-text-muted">
                        {ticket.ticketTypeName ?? "General admission"}
                        {ticket.seatLabel
                          ? ` · Seat ${ticket.seatLabel}`
                          : ""}{" "}
                        · {ticket.status.replace("_", " ")}
                      </p>
                      <code className="rounded-md bg-surface-elevated px-2 py-1 text-[0.78rem] text-accent">
                        {ticket.code}
                      </code>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="sticky top-[calc(var(--site-header-height)+1.25rem)] grid gap-5 max-[1120px]:static">
          <section className={panelPadded}>
            <div>
              <p className={kicker}>
                {session ? "Signed in checkout" : "Guest checkout"}
              </p>
              <h2 className="mb-0 text-[1.55rem]">
                {session
                  ? `Buying as ${session.user.name}`
                  : displayEvent.booking?.kind === "bus" ? "Book your journey" : displayEvent.booking?.kind === "cinema" ? "Book your screening" : "Reserve your spot"}
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
            {displayEvent.booking && (
              <div className="mb-4 grid gap-1 text-sm text-text-muted">
                <strong className="text-accent">
                  {formatLabels[displayEvent.booking.kind]}
                </strong>
                {displayEvent.booking.destination && (
                  <span>
                    {displayEvent.venue} → {displayEvent.booking.destination}
                  </span>
                )}
                {displayEvent.booking.service && (
                  <span>{displayEvent.booking.service}</span>
                )}
                {displayEvent.booking.durationMinutes && (
                  <span>{displayEvent.booking.durationMinutes} minutes</span>
                )}
              </div>
            )}
            <p role="status">
              {cancelled
                ? "Event cancelled"
                : checkoutEvent.soldOut
                  ? "Sold out"
                  : checkoutEvent.remainingCapacity != null
                    ? `${checkoutEvent.remainingCapacity} tickets remaining`
                    : "Tickets available"}
            </p>
            <div className="select-ticket-heading">
              <span className="select-ticket-heading__icon">
                <TicketIcon size={22} />
              </span>
              <div>
                <p className={kicker}>Select tickets</p>
                <h2 className="mb-0 text-[1.55rem]">
                  {displayEvent.ticketTypes?.length || 1} ticket categories
                </h2>
              </div>
            </div>
            {Boolean(displayEvent.ticketTypes?.length) && (
              <label className="grid gap-2">
                Ticket category
                <select
                  className="rounded-lg border border-border bg-surface-muted p-3 text-text"
                  value={selectedTicketTypeId}
                  onChange={(e) => {
                    setSelectedTicketTypeId(e.target.value);
                    setQuantity(1);
                    setSelectedSeats([]);
                  }}
                >
                  <option value="">Choose a category</option>
                  {displayEvent.ticketTypes?.map((type) => {
                    const state = ticketSalesState(
                      displayEvent,
                      type,
                      salesNow,
                    );
                    return (
                      <option
                        key={type.id}
                        value={type.id}
                        disabled={state !== "available"}
                      >
                        {type.name} — {money.format(type.priceCents / 100)}
                        {state === "available"
                          ? ""
                          : ` (${salesStateLabels[state]})`}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}
            {selectedType && (
              <p role="status" className="m-0 text-text-muted">
                {salesStateLabels[selectedSalesState]}
                {selectedType.salesStart
                  ? ` · Opens ${dateTime.format(new Date(selectedType.salesStart))}`
                  : ""}
                {selectedType.salesEnd
                  ? ` · Ends ${dateTime.format(new Date(selectedType.salesEnd))}`
                  : ""}{" "}
                (your local time)
              </p>
            )}
            <div className="grid gap-3 rounded-lg border border-border bg-surface-muted p-3">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-text">
                  {selectedType?.name ?? "General admission"}
                </strong>
                <strong className="text-price">
                  {money.format(unitPrice / 100)}
                </strong>
              </div>
              <span className="text-[0.9rem] text-text-muted">
                {dateTime.format(new Date(checkoutEvent.startsAt))}
              </span>
              <span className="text-[0.9rem] text-text-muted">
                {checkoutEvent.venue}
              </span>
              <span className="text-[0.86rem] font-(--weight-semibold) text-text-soft">
                Displayed price
              </span>
            </div>
            <button
              className={primaryAction}
              type="button"
              disabled={
                salesClosed || checkoutEvent.soldOut || categoryUnavailable
              }
              onClick={() => setCheckoutOpen(true)}
            >
              <CircleDollarSign size={18} />
              {isDraft
                ? "Draft — ticket sales closed"
                : cancelled
                  ? "Event cancelled"
                  : checkoutEvent.soldOut
                    ? "Sold out"
                    : displayEvent.booking?.seating
                      ? "Choose seats"
                      : unitPrice === 0
                        ? "Get ticket"
                        : "Pay now"}
            </button>
            {purchaseState && (
              <p className="mb-0 rounded-lg bg-accent-soft p-3 text-[0.92rem] font-(--weight-medium) text-accent">
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
          <div className="checkout-dialog__backdrop" aria-hidden="true" />
          <section className="checkout-dialog__panel">
            <div className="checkout-dialog__header">
              <div>
                <p className={kicker}>Checkout</p>
                <h2
                  className="mb-0 text-[clamp(1.6rem,3vw,2.35rem)] leading-tight text-text"
                  id="checkout-dialog-title"
                >
                  {unitPrice === 0 ? "Get your ticket" : "Complete payment"}
                </h2>
              </div>
              <button
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-muted text-text"
                type="button"
                aria-label="Close checkout"
                onClick={() => setCheckoutOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="checkout-dialog__body">
              {categoryUnavailable && (
                <p role="status" className="text-text">
                  {salesStateLabels[selectedSalesState]}. Choose an available
                  category to continue.
                </p>
              )}
              <div className="grid gap-3 rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-text">
                    {selectedType?.name ?? "General admission"}
                  </strong>
                  <strong className="text-price">
                    {money.format(ticketTotalCents / 100)}
                  </strong>
                </div>
                <span className="text-[0.9rem] text-text-muted">
                  {quantity.toLocaleString("en-UG")} x{" "}
                  {money.format(unitPrice / 100)}
                </span>
                <span className="text-[0.9rem] text-text-muted">
                  {dateTime.format(new Date(checkoutEvent.startsAt))}
                </span>
              </div>

              <form
                className={formGrid}
                {...checkoutValidation.formProps(buyTickets)}
              >
                <label>
                  <RequiredLabel>Buyer name</RequiredLabel>
                  <input
                    aria-describedby="detail-buyer-name-error"
                    aria-invalid={Boolean(checkoutBuyerNameError) || undefined}
                    value={buyerName}
                    onChange={(input) => setBuyerName(input.target.value)}
                    placeholder={session?.user.name ?? "Anonymous buyer name"}
                    {...requiredField("Buyer name")}
                  />
                  <FieldMessage
                    error={checkoutBuyerNameError}
                    id="detail-buyer-name-error"
                  />
                </label>
                <label>
                  <RequiredLabel>Buyer email</RequiredLabel>
                  <input
                    aria-describedby="detail-buyer-email-error"
                    aria-invalid={Boolean(checkoutBuyerEmailError) || undefined}
                    type="email"
                    value={buyerEmail}
                    onChange={(input) => setBuyerEmail(input.target.value)}
                    placeholder={
                      session?.user.email ?? "Email for ticket delivery"
                    }
                    {...requiredField("Buyer email")}
                  />
                  <FieldMessage
                    error={checkoutBuyerEmailError}
                    id="detail-buyer-email-error"
                  />
                </label>
                {displayEvent.booking?.seating ? (
                  <div className="grid gap-3">
                    <strong>
                      Choose your seats · {selectedSeats.length} selected
                    </strong>
                    <SeatMap
                      booking={displayEvent.booking}
                      selected={selectedSeats}
                      occupied={displayEvent.occupiedSeats}
                      onSelect={(seat) => {
                        const next = selectedSeats.includes(seat)
                          ? selectedSeats.filter((s) => s !== seat)
                          : selectedSeats.length < maximumQuantity
                            ? [...selectedSeats, seat]
                            : selectedSeats;
                        setSelectedSeats(next);
                        setQuantity(Math.max(1, next.length));
                      }}
                    />
                    <p className="text-sm text-text-muted">
                      Choose up to {maximumQuantity} seats. Selected:{" "}
                      {selectedSeats.join(", ") || "None"}
                    </p>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={async () => {
                        setDisplayEvent(
                          await api.getEvent(event.id, session?.token),
                        );
                        setSelectedSeats([]);
                        setQuantity(1);
                      }}
                    >
                      Refresh availability
                    </button>
                  </div>
                ) : (
                  <>
                    <label>
                      <RequiredLabel>Quantity</RequiredLabel>
                      <span className="quantity-stepper">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => stepQuantity(-1)}
                          disabled={quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          aria-describedby="detail-quantity-limit detail-quantity-error"
                          aria-invalid={
                            Boolean(checkoutQuantityError) || undefined
                          }
                          inputMode="numeric"
                          pattern="[0-9,]*"
                          title="Please enter a whole number."
                          value={formattedQuantity}
                          onChange={(input) =>
                            updateQuantityFromText(input.target.value)
                          }
                          onKeyDown={(event) => {
                            if (["e", "E", "+", "-", "."].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          onWheel={(event) => {
                            if (
                              document.activeElement !== event.currentTarget
                            ) {
                              return;
                            }

                            event.preventDefault();
                            stepQuantity(event.deltaY > 0 ? 1 : -1);
                          }}
                          {...requiredField("Quantity")}
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => stepQuantity(1)}
                          disabled={quantity >= maximumQuantity}
                        >
                          <Plus size={16} />
                        </button>
                      </span>
                      <FieldMessage
                        error={checkoutQuantityError}
                        id="detail-quantity-error"
                      />
                      <span id="detail-quantity-limit">
                        Maximum {selectedType?.maxPerOrder ?? 10} tickets per
                        order. Availability may reduce this quantity.
                      </span>
                    </label>
                  </>
                )}

                {unitPrice > 0 && (
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
                            aria-pressed={paymentProvider === option.value}
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
                            <span className="payment-option__footer">
                              <span>{option.label}</span>
                              {paymentProvider === option.value && (
                                <span className="payment-option__selected">
                                  <CheckCircle2 size={16} />
                                  Selected
                                </span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <PhoneNumberInput
                      label="Mobile money number"
                      value={mobileMoneyNumber}
                      onChange={setMobileMoneyNumber}
                      paymentProvider={paymentProvider}
                      required
                    />
                  </>
                )}

                <button
                  className={primaryAction}
                  type="submit"
                  disabled={
                    (Boolean(displayEvent.booking?.seating) &&
                      selectedSeats.length !== quantity) ||
                    salesClosed ||
                    checkoutEvent.soldOut ||
                    categoryUnavailable
                  }
                >
                  <CircleDollarSign size={18} />
                  {unitPrice === 0
                    ? "Get ticket"
                    : `Pay with ${
                        paymentProvider === "mtn" ? "MTN MoMo" : "Airtel Money"
                      }`}
                </button>
              </form>
              {purchaseState && (
                <p className="mb-0 rounded-lg bg-accent-soft p-3 text-[0.92rem] font-(--weight-medium) text-accent">
                  {purchaseState}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
