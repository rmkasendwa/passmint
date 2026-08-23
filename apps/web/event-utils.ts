import {
  Clapperboard,
  Compass,
  Drama,
  Dumbbell,
  Martini,
  Mic2,
  Music2,
  Trophy,
  Users,
} from "lucide-react";
import type { Event } from "./api";
import { filterDate } from "./formatters";

export const categories = [
  { label: "For you", query: "", icon: Compass },
  { label: "Concerts", query: "music", icon: Music2 },
  { label: "Nightlife", query: "nightlife", icon: Martini },
  { label: "Sports", query: "sports", icon: Trophy },
  { label: "Theatre", query: "theatre", icon: Drama },
  { label: "Conferences", query: "conference", icon: Mic2 },
  { label: "Cinema", query: "cinema", icon: Clapperboard },
  { label: "Wellness", query: "wellness", icon: Dumbbell },
  { label: "Community", query: "community", icon: Users },
];

export const emptyHostEvent = {
  name: "",
  description: "",
  venue: "",
  startsAt: "",
  capacity: 120,
  priceCents: 0,
  thumbnailUrl: "",
};

function daysFromNow(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const demoEvents: Event[] = [
  {
    id: "demo-citrus-brunch",
    name: "Citrus & Rose Brunch",
    description:
      "A sunny food, music, and lifestyle ticket for weekend crowds.",
    venue: "The Line, Los Angeles",
    startsAt: daysFromNow(5, 11),
    capacity: 800,
    priceCents: 8500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-kampala-js",
    name: "JavaScript Builders Meetup",
    description: "Talks, demos, and community networking for product builders.",
    venue: "Village Underground, London",
    startsAt: daysFromNow(8, 15),
    capacity: 220,
    priceCents: 0,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-nec-vipers",
    name: "City FC vs United FC",
    description: "Matchday tickets with fast QR entry for football fans.",
    venue: "National Stadium, Singapore",
    startsAt: daysFromNow(12, 13),
    capacity: 4500,
    priceCents: 3000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-vibes-valour",
    name: "Vibes & Valour",
    description:
      "A live conversation and social evening for the next generation of leaders.",
    venue: "House of Yes, Brooklyn",
    startsAt: daysFromNow(17, 16),
    capacity: 180,
    priceCents: 5000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-campus-pitch",
    name: "Campus Pitch Global",
    description:
      "Student founders, investors, product demos, and campus energy.",
    venue: "TU Berlin, Germany",
    startsAt: daysFromNow(24, 9),
    capacity: 600,
    priceCents: 2000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-basketball",
    name: "Basketball League Opening Night",
    description:
      "Courtside tickets for the first night of the city league season.",
    venue: "Ginásio do Ibirapuera, São Paulo",
    startsAt: daysFromNow(31, 17),
    capacity: 1200,
    priceCents: 2500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
  },
];

export function eventTone(index: number) {
  return `tone-${(index % 6) + 1}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function eventStatus(event: Event) {
  const startsAt = new Date(event.startsAt).getTime();
  const now = Date.now();

  if (Number.isNaN(startsAt)) return "Tickets open";
  return startsAt >= now ? "Upcoming" : "Past";
}

export function eventCategory(event: Event) {
  const haystack =
    `${event.name} ${event.description} ${event.venue}`.toLowerCase();

  if (/sport|match|fc|league|basket|stadium|arena/.test(haystack)) {
    return "Sports";
  }

  if (/music|dj|concert|brunch|night|club|vibes|show/.test(haystack)) {
    return "Music";
  }

  if (/meetup|launch|conference|builder|javascript|talk|demo/.test(haystack)) {
    return "Conference";
  }

  if (/film|cinema|screen/.test(haystack)) return "Cinema";
  if (/theatre|stage|drama/.test(haystack)) return "Theatre";

  return "Event";
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateFilterLabel(start: string, end: string) {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);

  if (!startDate) return "Any date";
  if (!endDate || start === end) return filterDate.format(startDate);

  return `${filterDate.format(startDate)} - ${filterDate.format(endDate)}`;
}

export function calendarDays(month: Date) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}
