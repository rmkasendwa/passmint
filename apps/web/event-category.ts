import type { Event } from "./api";

// Prefer the event's name to incidental words in its venue or description.
// These are discovery hints until events have explicit category metadata.
const rules: [string, RegExp][] = [
  ["Wellness", /\b(wellness|yoga|fitness|meditation|retreat)\b/i],
  ["Cinema", /\b(film|cinema|movie|screening)\b/i],
  [
    "Conference",
    /\b(tech|product|summit|startup|pitch|conference|builders?|javascript|founders?|networking)\b/i,
  ],
  [
    "Sports",
    /\b(sports?|football|basketball|match|fc|league|rugby|marathon)\b/i,
  ],
  ["Theatre", /\b(theatre|theater|drama|comedy|play)\b/i],
  ["Community", /\b(community|meetup|craft|market|maker|faire)\b/i],
  ["Nightlife", /\b(nightlife|rooftop|clubbing|dj|afro house)\b/i],
  ["Music", /\b(music|concert|band|jazz|gig|festival)\b/i],
];

export function eventCategory(
  event: Pick<Event, "name" | "description" | "booking">,
) {
  if (event.booking?.kind === "bus") return "Bus";
  if (event.booking?.kind === "cinema") return "Cinema";
  return (
    rules.find(([, pattern]) => pattern.test(event.name))?.[0] ??
    rules.find(([, pattern]) => pattern.test(event.description))?.[0] ??
    "Event"
  );
}
