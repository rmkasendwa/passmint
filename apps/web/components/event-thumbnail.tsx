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
  card: "min-h-[360px] [&_.thumbnail-badge_small]:hidden [&_.thumbnail-frame]:inset-3 [&_.thumbnail-frame]:rounded-2xl [&_.thumbnail-frame]:border-[rgb(255_255_255/14%)] [&_.thumbnail-frame]:border-b-0 [&_.thumbnail-initials]:text-[4.7rem] [&_.thumbnail-title]:hidden [&_.thumbnail-date]:hidden max-[600px]:min-h-[340px]",
  preview: "min-h-[148px]",
};

export function EventThumbnail({
  event,
  tone,
  variant = "card",
  mood = "green",
}: {
  event: Event;
  tone: string;
  variant?: "card" | "featured" | "preview";
  mood?: "green" | "gold";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const date = new Date(event.startsAt);
  const day = new Intl.DateTimeFormat("en-UG", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-UG", { month: "short" }).format(
    date,
  );
  const hasImage = Boolean(event.thumbnailUrl) && !imageFailed;
  const imageOverlay =
    mood === "gold"
      ? "bg-[linear-gradient(180deg,rgb(249_193_91/28%),rgb(40_24_9/8%)_28%,rgb(22_15_8/34%)_54%,rgb(15_12_9/92%)_88%),radial-gradient(circle_at_74%_76%,rgb(246_181_61/46%),transparent_40%)]"
      : "bg-[linear-gradient(180deg,rgb(2_18_16/4%),rgb(2_24_22/15%)_36%,rgb(0_35_31/48%)_65%,rgb(6_16_15/94%)_91%),linear-gradient(135deg,rgb(42_190_171/25%),rgb(8_16_18/8%))]";
  const blendFadeClass =
    mood === "gold"
      ? "bg-[linear-gradient(180deg,transparent_0%,rgb(30_20_11/38%)_28%,rgb(16_13_10/82%)_66%,#0f0d0b_100%)]"
      : "bg-[linear-gradient(180deg,transparent_0%,rgb(4_33_29/34%)_30%,rgb(6_22_20/80%)_68%,#06100f_100%)]";
  const frameClass =
    mood === "gold"
      ? "border-[rgb(246_181_61/36%)] shadow-[inset_0_1px_0_rgb(255_255_255/16%)]"
      : "border-[rgb(94_226_204/24%)] shadow-[inset_0_1px_0_rgb(255_255_255/12%)]";
  const badgeClass =
    mood === "gold"
      ? "border-[rgb(246_181_61/32%)] bg-[rgb(31_20_11/58%)] text-[#f6c866]"
      : "border-[rgb(94_226_204/26%)] bg-[rgb(0_77_67/56%)] text-[#dffcf7]";

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
      <span className={`absolute inset-0 z-[1] ${imageOverlay}`} />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-52 ${blendFadeClass}`}
      />
      <span
        className={`thumbnail-frame absolute inset-4 z-[2] rounded-lg border ${frameClass}`}
      />
      <span
        className={`thumbnail-badge absolute left-[22px] top-[22px] z-[3] inline-flex min-h-8 items-center gap-[7px] rounded-full border px-2.75 text-[0.72rem] font-(weight:--weight-semibold) uppercase backdrop-blur-xl data-[featured=true]:hidden ${badgeClass}`}
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
