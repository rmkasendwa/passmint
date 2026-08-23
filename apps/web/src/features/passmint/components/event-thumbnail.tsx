import { Ticket as TicketIcon } from "lucide-react";
import type { Event } from "../../../api";
import { eventCategory, initials } from "../event-utils";

export function EventThumbnail({
  event,
  tone,
  variant = "card",
}: {
  event: Event;
  tone: string;
  variant?: "card" | "featured" | "preview";
}) {
  const date = new Date(event.startsAt);
  const day = new Intl.DateTimeFormat("en-UG", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-UG", { month: "short" }).format(
    date,
  );

  return (
    <span
      className={`event-thumbnail event-thumbnail-${variant} ${tone} ${
        event.thumbnailUrl ? "has-image" : "fallback"
      }`}
    >
      {event.thumbnailUrl && (
        <img src={event.thumbnailUrl} alt="" aria-hidden="true" />
      )}
      <span className="thumbnail-scrim" />
      <span className="thumbnail-frame" />
      <span className="thumbnail-badge">
        <TicketIcon size={variant === "featured" ? 25 : 18} />
        <small>{eventCategory(event)}</small>
      </span>
      {!event.thumbnailUrl && (
        <span className="thumbnail-initials">{initials(event.name)}</span>
      )}
      <span className="thumbnail-date">
        <strong>{day}</strong>
        <small>{month}</small>
      </span>
      <span className="thumbnail-title">
        <strong>{event.name || "New event"}</strong>
        <small>{event.venue || "Venue to be announced"}</small>
      </span>
    </span>
  );
}
