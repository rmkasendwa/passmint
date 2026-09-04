'use client';

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
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, Event } from '../api';
import { eventCategory, eventStatus, eventTone } from '../event-utils';
import { dateTime, money } from '../formatters';
import { useAppContext } from './app-provider';
import { EventImage } from './event-image';
import {
  FieldMessage,
  RequiredLabel,
  requiredField,
  requiredTextareaField,
  useInlineFormValidation,
} from './form-validation';
import { PhoneNumberInput } from './phone-number-input';

const panel =
  'rounded-lg border border-border bg-surface-raised shadow-[0_18px_52px_rgb(0_0_0/14%)]';
const panelPadded = `${panel} grid gap-4 p-4.5`;
const primaryAction =
  'inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(--button-bg) px-4 font-(--weight-bold) text-(--button-text) hover:bg-accent';
const secondaryAction =
  'inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface-muted px-4 font-(--weight-bold) text-text';
const formGrid =
  'grid gap-3 [&_label]:grid [&_label]:gap-1.75 [&_label]:text-[0.82rem] [&_label]:font-(--weight-semibold) [&_label]:text-text-muted [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-border [&_input]:bg-surface-elevated [&_input]:px-3 [&_input]:text-text [&_input]:focus:border-accent [&_input]:focus:outline-[3px_solid_rgb(255_122_69/18%)] [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:min-w-0 [&_textarea]:resize-y [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-surface-elevated [&_textarea]:px-3 [&_textarea]:py-2.75 [&_textarea]:text-text [&_textarea]:focus:border-accent [&_textarea]:focus:outline-[3px_solid_rgb(255_122_69/18%)]';
const sectionHeading =
  'mb-0 text-[clamp(1.45rem,2vw,2rem)] font-(--weight-bold) leading-tight text-text';
const kicker =
  'mb-2 text-[0.78rem] font-(--weight-semibold) uppercase tracking-[0.08em] text-accent';

const eventDay = new Intl.DateTimeFormat('en-UG', {
  day: '2-digit',
});
const eventMonth = new Intl.DateTimeFormat('en-UG', {
  month: 'short',
});
const eventTime = new Intl.DateTimeFormat('en-UG', {
  hour: '2-digit',
  minute: '2-digit',
});
const quantityFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function toLocalInputValue(value: string) {
  const date = new Date(value);
  if (date.getTime() === 0) return '';
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function ownerId(event: Event) {
  if (!event.owner) return null;
  return typeof event.owner === 'string' ? event.owner : event.owner.id;
}

function ownerName(event: Event) {
  if (!event.owner || typeof event.owner === 'string')
    return 'Passmint organizer';
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
  const [editState, setEditState] = useState('');
  const [publishAt, setPublishAt] = useState(event.publishAt ? toLocalInputValue(event.publishAt) : '');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'airtel' | 'mtn'>(
    'mtn',
  );
  const formattedQuantity = quantityFormat.format(quantity);
  const [draft, setDraft] = useState({
    name: event.name,
    description: event.description,
    venue: event.venue,
    mapLocation: event.mapLocation ?? '',
    startsAt: toLocalInputValue(event.startsAt),
    capacity: event.capacity,
    priceCents: event.priceCents,
    thumbnailUrl: event.thumbnailUrl ?? '',
  });
  const editValidation = useInlineFormValidation();
  const checkoutValidation = useInlineFormValidation();

  useEffect(() => {
    chooseEvent(event.id);
  }, [event.id]);

  useEffect(() => {
    let active = true;
    void api.getEvent(event.id, session?.token).then((latest) => {
      if (active) setDisplayEvent(latest);
    }).catch(() => {});
    return () => { active = false; };
  }, [event.id, tickets, session?.token]);

  useEffect(() => {
    if (!checkoutOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [checkoutOpen]);

  const ownedBySession =
    session?.user.role === 'admin' ||
    Boolean(session && ownerId(displayEvent) === session.user.id) ||
    dashboardEvents.some((ownedEvent) => ownedEvent.id === displayEvent.id);
  const relevantIssuedTickets = tickets.filter(
    (ticket) => ticket.event.id === displayEvent.id,
  );
  const savedTicketsForEvent = useMemo(
    () => ticketHistory.filter((ticket) => ticket.event.id === displayEvent.id),
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
  const isDraft = displayEvent.status === 'draft';
  const cancelled = displayEvent.status === 'cancelled';
  const salesClosed = cancelled || isDraft;
  const ticketTotalCents = checkoutEvent.priceCents * quantity;
  const startsAt = new Date(displayEvent.startsAt);
  const mapQuery = displayEvent.mapLocation || displayEvent.venue;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapEmbedUrl = displayEvent.mapLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(displayEvent.mapLocation)}&output=embed`
    : '';
  const eventIndex = visibleEvents.findIndex(
    (listedEvent) => listedEvent.id === displayEvent.id,
  );
  const detailMood = eventIndex === 0 ? 'gold' : 'green';
  const detailTone = eventTone(Math.max(eventIndex, 0));
  const editNameError = editValidation.fieldError({
    label: 'Event name',
    required: true,
    value: draft.name,
  });
  const editDescriptionError = editValidation.fieldError({
    label: 'Description',
    required: true,
    value: draft.description,
  });
  const editVenueError = editValidation.fieldError({
    label: 'Venue',
    required: true,
    value: draft.venue,
  });
  const editStartsError = editValidation.fieldError({
    label: 'Starts',
    required: true,
    value: draft.startsAt,
  });
  const editCapacityError = editValidation.fieldError({
    label: 'Capacity',
    min: 1,
    required: false,
    value: draft.capacity ?? '',
  });
  const editPriceError = editValidation.fieldError({
    label: 'Price in UGX',
    min: 0,
    required: true,
    value: draft.priceCents / 100,
  });
  const checkoutBuyerNameError = checkoutValidation.fieldError({
    label: 'Buyer name',
    required: true,
    value: buyerName,
  });
  const checkoutBuyerEmailError = checkoutValidation.fieldError({
    label: 'Buyer email',
    required: true,
    type: 'email',
    value: buyerEmail,
  });
  const checkoutQuantityError = checkoutValidation.fieldError({
    label: 'Quantity',
    max: 10,
    min: 1,
    pattern: /^[0-9,]+$/,
    required: true,
    title: 'Please enter a whole number.',
    value: formattedQuantity,
  });

  function updateQuantityFromText(value: string) {
    const digits = value.replace(/\D/g, '');
    setQuantity(normalizeQuantity(Number(digits || '1')));
  }

  function stepQuantity(direction: 1 | -1) {
    setQuantity(normalizeQuantity(quantity + direction));
  }

  async function saveEvent(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!session) {
      setEditState('Sign in to edit this event.');
      return;
    }

    setEditState('Saving event...');

    try {
      const updated = await api.updateEvent(
        displayEvent.id,
        {
          name: draft.name,
          description: draft.description,
          venue: draft.venue,
          mapLocation: draft.mapLocation,
          ...(draft.startsAt ? { startsAt: new Date(draft.startsAt).toISOString() } : {}),
          capacity: draft.capacity,
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
        mapLocation: updated.mapLocation ?? '',
        startsAt: toLocalInputValue(updated.startsAt),
        capacity: updated.capacity,
        priceCents: updated.priceCents,
        thumbnailUrl: updated.thumbnailUrl ?? '',
      });
      setIsEditing(false);
      setEditState('Event updated.');
    } catch (error) {
      const fallback = error as { message?: string };
      setEditState(fallback.message ?? 'Event could not be updated.');
    }
  }

  async function cancelEvent() {
    if (!session || !window.confirm('Cancel this event? Ticket sales will stop and existing tickets will remain in purchase history.')) return;
    try {
      setDisplayEvent(await api.cancelEvent(displayEvent.id, session.token));
      setCheckoutOpen(false);
      setIsEditing(false);
      setEditState('Event cancelled.');
    } catch (error) {
      setEditState((error as { message?: string }).message ?? 'Unable to cancel event.');
    }
  }

  async function publishDraft() {
    if (!session) return;
    try {
      setDisplayEvent(await api.updateEvent(displayEvent.id, { status: 'published' }, session.token));
      setEditState('Event published.');
    } catch (error) { setEditState((error as { message?: string }).message ?? 'Unable to publish.'); }
  }

  async function schedulePublication() {
    if (!session) return;
    try {
      const updated = await api.updateEvent(displayEvent.id, { publishAt: publishAt ? new Date(publishAt).toISOString() : null }, session.token);
      setDisplayEvent(updated);
      setEditState(updated.publishAt ? 'Publication scheduled.' : 'Publication schedule removed.');
    } catch (error) { setEditState((error as { message?: string }).message ?? 'Unable to schedule publication.'); }
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
            <h1 className="mb-4 text-[clamp(2.7rem,6vw,6.4rem)] font-(--weight-bold) leading-[0.94] text-white">
              {displayEvent.name}
            </h1>
            <p className="mb-0 max-w-180 text-[1.08rem] leading-[1.6] text-white/76">
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
              {displayEvent.capacity?.toLocaleString('en-UG') ??
                'Unlimited'}{' '}
              total spots
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
            {cancelled && <p role="status" className="rounded-lg bg-accent-soft p-3 text-text">This event has been cancelled. Ticket sales are closed. Existing tickets remain in your purchase history.</p>}
            {isDraft && <p role="status">Private draft. Save your details, then publish when ready.</p>}
            {ownedBySession && isDraft && <button className={primaryAction} type="button" onClick={() => void publishDraft()}>Publish draft</button>}
            {ownedBySession && isDraft && <div className={formGrid}>
              <label>Publish automatically at<input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)} /></label>
              <button className={secondaryAction} type="button" onClick={() => void schedulePublication()}>{publishAt ? 'Schedule publication' : 'Remove schedule'}</button>
              {displayEvent.publishAt && <p>Scheduled for {dateTime.format(new Date(displayEvent.publishAt))}</p>}
            </div>}
            {ownedBySession && !cancelled && (
              <button
                className={secondaryAction}
                type="button"
                onClick={() => setIsEditing((value) => !value)}
              >
                <Edit3 size={17} />
                {isEditing ? 'Close editor' : 'Edit event'}
              </button>
            )}
            {ownedBySession && !cancelled && <button className={secondaryAction} type="button" onClick={() => void cancelEvent()}>Cancel event</button>}
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
                  'Bring your ticket QR',
                  'Your purchased QR code appears here immediately after checkout.',
                ],
                [
                  'Arrive on time',
                  `Doors are based around the ${eventTime.format(startsAt)} start time.`,
                ],
                [
                  'Check the venue',
                  'Use the map link before leaving so your route is clear.',
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
                {...(isDraft ? { noValidate: true, onSubmit: saveEvent } : editValidation.formProps(saveEvent))}
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
                    {...requiredField('Event name')}
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
                    {...requiredTextareaField('Description')}
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
                    {...requiredField('Venue')}
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
                      {...requiredField('Starts')}
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
                      value={draft.capacity ?? ''}
                      onChange={(input) =>
                        setDraft((current) => ({
                          ...current,
                          capacity:
                            input.target.value === ''
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
                      {...requiredField('Price in UGX')}
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
                <p className="mb-0 rounded-lg bg-accent-soft p-3 text-[0.92rem] font-(--weight-medium) text-accent">
                  {editState}
                </p>
              )}
            </section>
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
                        {ticket.status.replace('_', ' ')}
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

        <aside className="sticky top-22 grid gap-5 max-[1120px]:static">
          <section className={panelPadded}>
            <div>
              <p className={kicker}>
                {session ? 'Signed in checkout' : 'Guest checkout'}
              </p>
              <h2 className="mb-0 text-[1.55rem]">
                {session
                  ? `Buying as ${session.user.name}`
                  : 'Reserve your spot'}
              </h2>
            </div>
            {!session && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={secondaryAction}
                  onClick={() => openAuth('login')}
                >
                  <LogIn size={17} />
                  Sign in
                </button>
                <button
                  type="button"
                  className={primaryAction}
                  onClick={() => openAuth('register')}
                >
                  <UserPlus size={17} />
                  Register
                </button>
              </div>
            )}
          </section>

          <section className={panelPadded}>
            <p role="status">
              {cancelled ? 'Event cancelled' : checkoutEvent.soldOut
                ? 'Sold out'
                : checkoutEvent.remainingCapacity != null
                  ? `${checkoutEvent.remainingCapacity} tickets remaining`
                  : 'Tickets available'}
            </p>
            <div className="select-ticket-heading">
              <span className="select-ticket-heading__icon">
                <TicketIcon size={22} />
              </span>
              <div>
                <p className={kicker}>Select tickets</p>
                <h2 className="mb-0 text-[1.55rem]">
                  1 ticket category available
                </h2>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border border-border bg-surface-muted p-3">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-text">General admission</strong>
                <strong className="text-price">
                  {money.format(checkoutEvent.priceCents / 100)}
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
              disabled={salesClosed || checkoutEvent.soldOut}
              onClick={() => setCheckoutOpen(true)}
            >
              <CircleDollarSign size={18} />
              {isDraft ? 'Draft — ticket sales closed' : cancelled ? 'Event cancelled' : checkoutEvent.soldOut
                ? 'Sold out'
                : checkoutEvent.priceCents === 0
                  ? 'Get ticket'
                  : 'Pay now'}
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
                  {checkoutEvent.priceCents === 0
                    ? 'Get your ticket'
                    : 'Complete payment'}
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
              <div className="grid gap-3 rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-text">General admission</strong>
                  <strong className="text-price">
                    {money.format(ticketTotalCents / 100)}
                  </strong>
                </div>
                <span className="text-[0.9rem] text-text-muted">
                  {quantity.toLocaleString('en-UG')} x{' '}
                  {money.format(checkoutEvent.priceCents / 100)}
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
                    placeholder={session?.user.name ?? 'Anonymous buyer name'}
                    {...requiredField('Buyer name')}
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
                      session?.user.email ?? 'Email for ticket delivery'
                    }
                    {...requiredField('Buyer email')}
                  />
                  <FieldMessage
                    error={checkoutBuyerEmailError}
                    id="detail-buyer-email-error"
                  />
                </label>
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
                      aria-describedby="detail-quantity-error"
                      aria-invalid={Boolean(checkoutQuantityError) || undefined}
                      inputMode="numeric"
                      pattern="[0-9,]*"
                      title="Please enter a whole number."
                      value={formattedQuantity}
                      onChange={(input) =>
                        updateQuantityFromText(input.target.value)
                      }
                      onKeyDown={(event) => {
                        if (['e', 'E', '+', '-', '.'].includes(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      onWheel={(event) => {
                        if (document.activeElement !== event.currentTarget) {
                          return;
                        }

                        event.preventDefault();
                        stepQuantity(event.deltaY > 0 ? 1 : -1);
                      }}
                      {...requiredField('Quantity')}
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
                  <FieldMessage
                    error={checkoutQuantityError}
                    id="detail-quantity-error"
                  />
                </label>

                {checkoutEvent.priceCents > 0 && (
                  <>
                    <div>
                      <p className={kicker}>Payment method</p>
                      <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
                        {[
                          {
                            value: 'mtn',
                            label: 'MTN MoMo',
                            logo: '/payment/mtn-momo.svg',
                          },
                          {
                            value: 'airtel',
                            label: 'Airtel Money',
                            logo: '/payment/airtel-money.svg',
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
                                option.value as 'airtel' | 'mtn',
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

                <button className={primaryAction} type="submit" disabled={salesClosed || checkoutEvent.soldOut}>
                  <CircleDollarSign size={18} />
                  {checkoutEvent.priceCents === 0
                    ? 'Get ticket'
                    : `Pay with ${
                        paymentProvider === 'mtn' ? 'MTN MoMo' : 'Airtel Money'
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
