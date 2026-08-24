"use client";

import { Ticket as TicketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Event } from "../api";
import { eventCategory, initials } from "../event-utils";

const toneGradient: Record<string, string> = {
  "tone-1": "before:bg-[radial-gradient(circle_at_76%_18%,rgb(255_255_255/20%),transparent_24%),linear-gradient(135deg,#174a52,#111827)]",
  "tone-2": "before:bg-[radial-gradient(circle_at_70%_12%,rgb(250_91_45/24%),transparent_28%),linear-gradient(135deg,#3b1d2d,#0f172a)]",
  "tone-3": "before:bg-[radial-gradient(circle_at_78%_16%,rgb(248_200_104/26%),transparent_26%),linear-gradient(135deg,#3f3a16,#111827)]",
  "tone-4": "before:bg-[radial-gradient(circle_at_74%_14%,rgb(121_230_217/25%),transparent_28%),linear-gradient(135deg,#123b44,#14151d)]",
  "tone-5": "before:bg-[radial-gradient(circle_at_74%_14%,rgb(255_255_255/22%),transparent_28%),linear-gradient(135deg,#3b2f4d,#111827)]",
  "tone-6": "before:bg-[radial-gradient(circle_at_74%_14%,rgb(250_91_45/22%),transparent_28%),linear-gradient(135deg,#492b20,#101116)]",
};

const baseThumbnail =
  "relative grid min-w-0 isolate overflow-hidden text-white [&_img]:absolute [&_img]:inset-0 [&_img]:z-0 [&_img]:size-full [&_img]:object-cover";

const fallbackDecor =
  "before:absolute before:inset-0 before:z-0 before:content-[''] after:absolute after:right-[-28px] after:bottom-[-38px] after:z-[1] after:size-[150px] after:rounded-full after:border-[24px] after:border-[rgb(255_255_255/12%)] after:content-['']";

const variantClass = {
  featured:
    "min-h-[580px] max-[820px]:min-h-[500px] max-[600px]:min-h-[260px]",
  card: "min-h-[238px] [&_.thumbnail-badge_small]:hidden [&_.thumbnail-frame]:inset-3 [&_.thumbnail-frame]:rounded-2xl [&_.thumbnail-frame]:border-[rgb(255_255_255/14%)] [&_.thumbnail-initials]:text-[4.7rem] [&_.thumbnail-title]:hidden [&_.thumbnail-date]:hidden",
  preview: "min-h-[148px]",
};

export function EventThumbnail({
  event,
  tone,
  variant = "card",
}: {
  event: Event;
  tone: string;
  variant?: "card" | "featured" | "preview";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const date = new Date(event.startsAt);
  const day = new Intl.DateTimeFormat("en-UG", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-UG", { month: "short" }).format(
    date,
  );
  const hasImage = Boolean(event.thumbnailUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [event.thumbnailUrl]);

  return (
    <span
      className={`event-thumbnail-${variant} ${baseThumbnail} ${variantClass[variant]} ${
        hasImage ? "" : `${fallbackDecor} ${toneGradient[tone] ?? toneGradient["tone-1"]}`
      }`}
    >
      {hasImage && (
        <img
          src={event.thumbnailUrl ?? ""}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
        />
      )}
      <span className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgb(0_0_0/8%),rgb(0_0_0/18%)_42%,rgb(0_0_0/76%)),linear-gradient(135deg,rgb(19_52_63/32%),rgb(12_18_28/16%))]" />
      <span className="thumbnail-frame absolute inset-4 z-[2] rounded-lg border border-[rgb(255_255_255/32%)]" />
      <span
        className="thumbnail-badge absolute left-[22px] top-[22px] z-[3] inline-flex min-h-8 items-center gap-[7px] rounded-lg bg-[rgb(8_13_20/46%)] px-2.5 text-[0.72rem] font-(weight:--weight-semibold) uppercase backdrop-blur-xl data-[featured=true]:hidden"
        data-featured={variant === "featured"}
      >
        <TicketIcon size={variant === "featured" ? 25 : 18} />
        <small>{eventCategory(event)}</small>
      </span>
      {!hasImage && (
        <span className="thumbnail-initials absolute left-[22px] top-[52%] z-[2] -translate-y-1/2 text-[clamp(4rem,10vw,8rem)] font-(weight:--weight-bold) leading-[0.8] text-[rgb(255_255_255/14%)]">
          {initials(event.name)}
        </span>
      )}
      <span className="thumbnail-date absolute bottom-[22px] right-[22px] z-[3] grid min-w-[68px] place-items-center rounded-lg bg-white px-2.5 py-[9px] text-[#101010] shadow-[0_16px_34px_rgb(0_0_0/18%)]">
        <strong className="text-[2.15rem] font-(weight:--weight-bold) leading-[0.9]">
          {day}
        </strong>
        <small className="font-(weight:--weight-semibold) uppercase">
          {month}
        </small>
      </span>
      <span className="thumbnail-title absolute bottom-6 left-[22px] right-28 z-[3] hidden gap-[5px]">
        <strong className="overflow-hidden text-[1.35rem] font-(weight:--weight-bold) leading-[1.02]">
          {event.name || "New event"}
        </strong>
        <small className="font-(weight:--weight-semibold) uppercase">
          {event.venue || "Venue to be announced"}
        </small>
      </span>
    </span>
  );
}
