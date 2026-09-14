"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Upload, ArrowUpRight, X, Ticket, Check } from "lucide-react";
import { useAppContext } from "./app-provider";
import { EventDateTimeField, NumericField } from "./event-form-controls";
import { EventImage } from "./event-image";
import { emptyHostEvent } from "../event-utils";
import {
  FieldMessage,
  RequiredLabel,
  requiredField,
  requiredTextareaField,
  useInlineFormValidation,
} from "./form-validation";
const primaryAction = "button-primary";
const secondaryAction = "button-secondary";
export function CreateEventForm({
  onClose,
  onBusyChange,
}: {
  onClose?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const {
    hostEvent,
    hostState,
    hostThumbnailName,
    publishEvent,
    saveDraft,
    selectThumbnail,
    updateHostEvent,
    canPublishEvents,
  } = useAppContext();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const router = useRouter();
  const dirty = JSON.stringify(hostEvent) !== JSON.stringify(emptyHostEvent);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function run(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusyChange?.(true);
    try {
      const created = event ? await publishEvent(event) : await saveDraft();
      if (created) {
        router.replace(`/events/${created.id}`);
        router.refresh();
      }
    } finally {
      pending.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  async function chooseArtwork(file: File | null) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    onBusyChange?.(true);
    try {
      await selectThumbnail(file);
    } finally {
      pending.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  const submit = (event: FormEvent<HTMLFormElement>) => void run(event);
  const validation = useInlineFormValidation();
  const eventNameError = validation.fieldError({
    label: "Event name",
    required: true,
    value: hostEvent.name,
  });
  const descriptionError = validation.fieldError({
    label: "Description",
    required: true,
    value: hostEvent.description,
  });
  const venueError = validation.fieldError({
    label: "Venue",
    required: true,
    value: hostEvent.venue,
  });
  const startsError = validation.fieldError({
    label: "Starts",
    required: true,
    value: hostEvent.startsAt,
  });
  const capacityError = validation.fieldError({
    label: "Capacity",
    min: 1,
    required: false,
    value: hostEvent.capacity ?? "",
  });
  const priceError = validation.fieldError({
    label: "Price in UGX",
    min: 0,
    required: true,
    value: hostEvent.priceCents / 100,
  });

  return (
    <div className="event-create">
      <header className="event-create-header">
        <div>
          <p className="eyebrow">YOUR NEXT GREAT GATHERING</p>
          <h1 id="create-event-title">Create an event</h1>
          <p>Start with the details. Make it yours.</p>
        </div>
        {onClose && (
          <button
            type="button"
            className="event-create-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Close create event"
          >
            <X size={22} />
          </button>
        )}
      </header>
      <div className="event-create-body">
        <div className="event-create-main">
          {" "}
          <form
            onSubmitCapture={(event) => {
              if (!event.currentTarget.checkValidity())
                event.currentTarget
                  .querySelector<HTMLElement>("input:invalid, textarea:invalid")
                  ?.focus();
            }}
            id="create-event-form"
            className="event-create-fields"
            {...validation.formProps(submit)}
          >
            <fieldset disabled={busy}>
              <legend>
                <span>01</span> The essentials
              </legend>
              <p className="field-section-copy">
                Give people a reason to be there.
              </p>
              <label>
                <RequiredLabel>Event name</RequiredLabel>
                <input
                  aria-describedby="host-event-name-error"
                  aria-invalid={Boolean(eventNameError) || undefined}
                  value={hostEvent.name}
                  onChange={(event) =>
                    updateHostEvent("name", event.target.value)
                  }
                  placeholder="Kampala rooftop sessions"
                  {...requiredField("Event name")}
                />
                <FieldMessage
                  error={eventNameError}
                  id="host-event-name-error"
                />
              </label>
              <label>
                <RequiredLabel>Description</RequiredLabel>
                <textarea
                  aria-describedby="host-description-error"
                  aria-invalid={Boolean(descriptionError) || undefined}
                  value={hostEvent.description}
                  onChange={(event) =>
                    updateHostEvent("description", event.target.value)
                  }
                  placeholder="Short public summary"
                  {...requiredTextareaField("Description")}
                />
                <FieldMessage
                  error={descriptionError}
                  id="host-description-error"
                />
              </label>
            </fieldset>
            <fieldset disabled={busy}>
              <legend>
                <span>02</span> When &amp; where
              </legend>
              <p className="field-section-copy">
                Help guests plan their visit. Times use your local timezone.
              </p>
              <label>
                <RequiredLabel>Venue</RequiredLabel>
                <input
                  aria-describedby="host-venue-error"
                  aria-invalid={Boolean(venueError) || undefined}
                  value={hostEvent.venue}
                  onChange={(event) =>
                    updateHostEvent("venue", event.target.value)
                  }
                  placeholder="Venue, city"
                  {...requiredField("Venue")}
                />
                <FieldMessage error={venueError} id="host-venue-error" />
              </label>
              <label>
                Map location
                <input
                  value={hostEvent.mapLocation}
                  onChange={(event) =>
                    updateHostEvent("mapLocation", event.target.value)
                  }
                  placeholder="Optional address, map place, or coordinates"
                />
              </label>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <RequiredLabel>Starts</RequiredLabel>
                  <EventDateTimeField value={hostEvent.startsAt} onChange={(value) => updateHostEvent("startsAt", value)} disabled={busy} invalid={Boolean(startsError)} />
                  <FieldMessage error={startsError} id="host-starts-error" />
                </div>
              </div>
            </fieldset>
            <fieldset disabled={busy}>
              <legend>
                <span>03</span> Tickets
              </legend>
              <p className="field-section-copy">
                Start with general admission. Add more ticket categories after
                creating your event.
              </p>
              <label>
                Capacity (leave blank for unlimited)
                <NumericField
                  aria-label="Capacity"
                  aria-describedby="host-capacity-error"
                  aria-invalid={Boolean(capacityError) || undefined}
                  min={1}
                  value={hostEvent.capacity ?? ""}
                  onValueChange={(value) =>
                    updateHostEvent(
                      "capacity",
                      value === ""
                        ? null
                        : Number(value),
                    )
                  }
                />
                <FieldMessage error={capacityError} id="host-capacity-error" />
              </label>
              <label>
                <RequiredLabel>Price in UGX</RequiredLabel>
                <NumericField
                  aria-label="Price in UGX"
                  aria-describedby="host-price-error"
                  aria-invalid={Boolean(priceError) || undefined}
                  min={0}
                  value={hostEvent.priceCents / 100}
                  onValueChange={(value) =>
                    updateHostEvent(
                      "priceCents",
                      Number(value) * 100,
                    )
                  }
                  {...requiredField("Price in UGX")}
                />
                <FieldMessage error={priceError} id="host-price-error" />
              </label>
            </fieldset>{" "}
          </form>
        </div>
        <aside className="event-create-aside">
          <div className="event-create-art">
            <EventImage
              src={hostEvent.thumbnailUrl}
              name={hostEvent.name || "Your event"}
              fallbackClassName="event-create-art-fallback"
            />
          </div>
          <h2>Set the scene</h2>
          <p>
            Your artwork is the first glimpse of your event. Make it memorable.
          </p>{" "}
          <label className="relative grid gap-1.75">
            <span>Event artwork photo</span>
            <input
              className="absolute inset-0 cursor-pointer opacity-0"
              type="file"
              accept="image/*"
              onChange={(event) =>
                void chooseArtwork(event.target.files?.[0] ?? null)
              }
            />
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-muted px-3 font-(--weight-semibold) text-accent">
              <Upload size={17} />
              {hostThumbnailName || "Optional image upload"}
            </span>
          </label>
          {hostEvent.thumbnailUrl && (
            <button
              className={secondaryAction}
              type="button"
              onClick={() => void chooseArtwork(null)}
            >
              Remove photo
            </button>
          )}
          <p className="event-create-hint">
            JPEG, PNG, WebP or GIF. Up to 5 MB. No image? We'll create branded
            artwork for you.
          </p>
          <div className="event-create-tip">
            <Ticket size={20} />
            <div>
              <strong>Your event, your pace</strong>
              <p>
                Save a private draft now and come back to the details. Publish
                when you're ready for guests.
              </p>
            </div>
          </div>
        </aside>
      </div>
      <footer className="event-create-footer">
        <div aria-live="polite">
          {hostState || (
            <span>
              <Check size={16} /> Drafts are private until published
            </span>
          )}
        </div>
        <div className="event-create-actions">
          {onClose && (
            <button
              className={secondaryAction}
              type="button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
          )}
          <button
            className={secondaryAction}
            type="button"
            onClick={() => void run()}
            disabled={busy || !canPublishEvents}
          >
            Save draft
          </button>
          <button
            className={primaryAction}
            type="submit"
            form="create-event-form"
            disabled={busy || !canPublishEvents}
          >
            {busy ? "Working..." : "Publish event"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </footer>
    </div>
  );
}
