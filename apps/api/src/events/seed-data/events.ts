import type { Booking } from "../../common/booking";

type SeedTicketType = {
  name: string;
  priceCents: number;
  capacity?: number;
};

export type SeedEvent = {
  id: string;
  imageSlug: string;
  imageFile: string;
  name: string;
  description: string;
  venue: string;
  mapLocation: string;
  startsAt: Date;
  capacity: number;
  priceCents: number;
  booking?: Booking;
  ticketTypes?: SeedTicketType[];
  occupiedSeats?: string[];
};

type SeedEventDefinition = Omit<SeedEvent, "startsAt"> & {
  monthsAhead: number;
  day: number;
  hour: number;
  minute?: number;
};

function scheduledDate(
  now: Date,
  monthsAhead: number,
  day: number,
  hour: number,
  minute = 0,
) {
  const date = new Date(now);
  date.setDate(1);
  date.setMonth(date.getMonth() + monthsAhead);
  date.setDate(day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

const eventDefinitions: SeedEventDefinition[] = [
  {
    id: "evt_seed_kampala_tech_night",
    imageSlug: "kampala-tech-night",
    imageFile: "kampala-tech-night.jpg",
    name: "Kampala Tech Night",
    description: "A practical evening of demos, talks, and networking.",
    venue: "Innovation Village, Ntinda",
    mapLocation: "Innovation Village Ntinda Kampala",
    monthsAhead: 2,
    day: 8,
    hour: 18,
    minute: 30,
    capacity: 250,
    priceCents: 2500000,
  },
  {
    id: "evt_seed_lakeside_music_weekend",
    imageSlug: "lakeside-music-weekend",
    imageFile: "lakeside-music-weekend.jpg",
    name: "Lakeside Music Weekend",
    description: "Two stages, local food vendors, and live performances.",
    venue: "Munyonyo Lake Grounds",
    mapLocation: "Munyonyo Lake Grounds Kampala",
    monthsAhead: 2,
    day: 16,
    hour: 15,
    capacity: 1000,
    priceCents: 5000000,
  },
  {
    id: "evt_seed_founders_breakfast_club",
    imageSlug: "founders-breakfast-club",
    imageFile: "founders-breakfast-club.jpg",
    name: "Founders Breakfast Club",
    description:
      "Early coffee, investor office hours, and crisp startup talks.",
    venue: "Design Hub Kampala",
    mapLocation: "Design Hub Kampala",
    monthsAhead: 2,
    day: 22,
    hour: 8,
    capacity: 120,
    priceCents: 1500000,
  },
  {
    id: "evt_seed_afro_house_rooftop",
    imageSlug: "afro-house-rooftop-sessions",
    imageFile: "afro-house-rooftop-sessions.jpg",
    name: "Afro House Rooftop Sessions",
    description: "Sunset DJ sets, rooftop views, and a late-night dance floor.",
    venue: "The Villa, Bukoto",
    mapLocation: "The Villa Bukoto Kampala",
    monthsAhead: 3,
    day: 5,
    hour: 19,
    capacity: 420,
    priceCents: 3500000,
  },
  {
    id: "evt_seed_women_in_product_summit",
    imageSlug: "women-in-product-summit",
    imageFile: "women-in-product-summit.jpg",
    name: "Women in Product Summit",
    description: "Panels, workshops, and mentorship for product teams.",
    venue: "Motiv, Bugolobi",
    mapLocation: "MoTIV Bugolobi Kampala",
    monthsAhead: 3,
    day: 12,
    hour: 9,
    capacity: 300,
    priceCents: 4000000,
  },
  {
    id: "evt_seed_sunday_craft_market",
    imageSlug: "sunday-craft-market",
    imageFile: "sunday-craft-market.jpg",
    name: "Sunday Craft Market",
    description:
      "Local makers, food stalls, family activities, and acoustic music.",
    venue: "Ndere Cultural Centre",
    mapLocation: "Ndere Cultural Centre Kampala",
    monthsAhead: 3,
    day: 19,
    hour: 10,
    capacity: 650,
    priceCents: 1000000,
  },
  {
    id: "evt_seed_kampala_comedy_showcase",
    imageSlug: "kampala-comedy-showcase",
    imageFile: "kampala-comedy-showcase.jpg",
    name: "Kampala Comedy Showcase",
    description: "A fast-paced evening with stand-up sets and surprise guests.",
    venue: "National Theatre",
    mapLocation: "Uganda National Theatre Kampala",
    monthsAhead: 3,
    day: 26,
    hour: 20,
    capacity: 500,
    priceCents: 3000000,
  },
  {
    id: "evt_seed_startup_pitch_arena",
    imageSlug: "startup-pitch-arena",
    imageFile: "startup-pitch-arena.jpg",
    name: "Startup Pitch Arena",
    description: "Ten companies pitch live to operators, angels, and founders.",
    venue: "MoTIV Warehouse",
    mapLocation: "MoTIV Warehouse Kampala",
    monthsAhead: 4,
    day: 6,
    hour: 17,
    minute: 30,
    capacity: 380,
    priceCents: 2000000,
  },
  {
    id: "evt_seed_maker_faire_kampala",
    imageSlug: "maker-faire-kampala",
    imageFile: "maker-faire-kampala.jpg",
    name: "Maker Faire Kampala",
    description:
      "Hardware demos, robotics, design booths, and family workshops.",
    venue: "UMA Show Grounds",
    mapLocation: "UMA Show Grounds Kampala",
    monthsAhead: 4,
    day: 13,
    hour: 11,
    capacity: 1200,
    priceCents: 2500000,
  },
  {
    id: "evt_seed_indie_film_night",
    imageSlug: "indie-film-night",
    imageFile: "indie-film-night.jpg",
    name: "Indie Film Night",
    description: "Short films, director Q&A, and a relaxed lobby mixer.",
    venue: "Century Cinemax Acacia",
    mapLocation: "Century Cinemax Acacia Kampala",
    monthsAhead: 4,
    day: 20,
    hour: 18,
    capacity: 180,
    priceCents: 2200000,
  },
  {
    id: "evt_seed_wellness_reset_day",
    imageSlug: "wellness-reset-day",
    imageFile: "wellness-reset-day.jpg",
    name: "Wellness Reset Day",
    description:
      "Yoga, guided breathwork, nutrition talks, and recovery sessions.",
    venue: "Forest Park Resort",
    mapLocation: "Forest Park Resort Kampala",
    monthsAhead: 4,
    day: 27,
    hour: 7,
    minute: 30,
    capacity: 240,
    priceCents: 4500000,
  },
  {
    id: "evt_seed_basketball_opening_night",
    imageSlug: "basketball-opening-night",
    imageFile: "basketball-opening-night.jpg",
    name: "Basketball Opening Night",
    description: "City league tip-off with courtside access and halftime acts.",
    venue: "Lugogo Indoor Arena",
    mapLocation: "Lugogo Indoor Arena Kampala",
    monthsAhead: 5,
    day: 7,
    hour: 19,
    minute: 30,
    capacity: 900,
    priceCents: 3000000,
  },
  {
    id: "evt_seed_kampala_food_festival",
    imageSlug: "kampala-food-festival",
    imageFile: "kampala-food-festival.jpg",
    name: "Kampala Food Festival",
    description:
      "A day of chef pop-ups, street food, tastings, and live music.",
    venue: "Lugogo Cricket Oval",
    mapLocation: "Lugogo Cricket Oval Kampala",
    monthsAhead: 5,
    day: 14,
    hour: 12,
    capacity: 1600,
    priceCents: 2000000,
  },
  {
    id: "evt_seed_stage_and_story_night",
    imageSlug: "stage-and-story-night",
    imageFile: "stage-and-story-night.jpg",
    name: "Stage and Story Night",
    description:
      "New theatre, spoken word, and a post-show conversation with the cast.",
    venue: "National Theatre",
    mapLocation: "Uganda National Theatre Kampala",
    monthsAhead: 5,
    day: 21,
    hour: 18,
    capacity: 340,
    priceCents: 2800000,
  },
  {
    id: "evt_seed_family_science_day",
    imageSlug: "family-science-day",
    imageFile: "family-science-day.jpg",
    name: "Family Science Day",
    description:
      "Hands-on experiments, planetarium sessions, and young inventor demos.",
    venue: "Uganda Museum",
    mapLocation: "Uganda Museum Kampala",
    monthsAhead: 5,
    day: 28,
    hour: 10,
    capacity: 700,
    priceCents: 1200000,
  },
  {
    id: "evt_seed_city_football_derby",
    imageSlug: "city-football-derby",
    imageFile: "city-football-derby.jpg",
    name: "City Football Derby",
    description:
      "A floodlit city rivalry with supporter sections and family seating.",
    venue: "MTN Omondi Stadium",
    mapLocation: "MTN Omondi Stadium Lugogo Kampala",
    monthsAhead: 6,
    day: 9,
    hour: 17,
    capacity: 9500,
    priceCents: 2000000,
  },
  {
    id: "evt_seed_kampala_book_fair",
    imageSlug: "kampala-book-fair",
    imageFile: "kampala-book-fair.jpg",
    name: "Kampala Book Fair",
    description:
      "Author talks, independent publishers, readings, and a children's corner.",
    venue: "Sheraton Gardens",
    mapLocation: "Sheraton Kampala Gardens",
    monthsAhead: 6,
    day: 17,
    hour: 9,
    capacity: 1100,
    priceCents: 1000000,
  },
  {
    id: "evt_seed_lake_victoria_cycle_day",
    imageSlug: "lake-victoria-cycle-day",
    imageFile: "lake-victoria-cycle-day.jpg",
    name: "Lake Victoria Cycle Day",
    description:
      "Supported road rides for beginners and experienced cyclists, plus a finish village.",
    venue: "Munyonyo Commonwealth Resort",
    mapLocation: "Munyonyo Commonwealth Resort Kampala",
    monthsAhead: 6,
    day: 25,
    hour: 6,
    minute: 30,
    capacity: 600,
    priceCents: 3000000,
  },
  {
    id: "evt_sample_bus_jinja",
    imageSlug: "kampala-jinja-coach",
    imageFile: "kampala-jinja-coach.jpg",
    name: "Kampala to Jinja · Sample coach",
    description:
      "Sample journey: compare adult and child fares, choose a numbered seat, and use your QR ticket when boarding. Departure from the Kampala terminal. Arrive 20 minutes early.",
    venue: "Kampala Central Bus Terminal",
    mapLocation: "Kampala bus terminal",
    monthsAhead: 2,
    day: 10,
    hour: 8,
    priceCents: 3000000,
    capacity: 39,
    booking: {
      kind: "bus",
      destination: "Jinja Main Terminal",
      service: "Passmint Express · Coach 01",
      durationMinutes: 150,
      seating: { rows: 10, columns: 4, aisleAfter: 2, blocked: ["40"] },
    },
    ticketTypes: [
      { name: "Adult", priceCents: 3000000 },
      { name: "Child (under 12)", priceCents: 2000000 },
    ],
    occupiedSeats: ["1", "2", "7"],
  },
  {
    id: "evt_sample_cinema",
    imageSlug: "indie-film-night",
    imageFile: "indie-film-night.jpg",
    name: "The Midnight Atlas · Sample screening",
    description:
      "A fictional adventure film screening for exploring cinema bookings. Choose a standard or student ticket, then pick your row and seat. Screen 2, original language, 2D.",
    venue: "Passmint Cinema · Kampala",
    mapLocation: "Acacia Mall Kampala",
    monthsAhead: 2,
    day: 18,
    hour: 19,
    priceCents: 2500000,
    capacity: 78,
    booking: {
      kind: "cinema",
      service: "Screen 2 · 2D",
      durationMinutes: 118,
      seating: { rows: 8, columns: 10, aisleAfter: 5, blocked: ["A1", "A10"] },
    },
    ticketTypes: [
      { name: "Standard", priceCents: 2500000 },
      { name: "Student (ID required)", priceCents: 1800000 },
    ],
    occupiedSeats: ["D5", "D6", "E5", "E6"],
  },
  {
    id: "evt_sample_festival",
    imageSlug: "lakeside-music-weekend",
    imageFile: "lakeside-music-weekend.jpg",
    name: "Passmint Sessions · Sample festival",
    description:
      "A sample live event with multiple ticket categories. Compare general admission, VIP lounge access, and a limited early-bird allocation. This event uses open admission without reserved seats.",
    venue: "Kampala Arts Gardens",
    mapLocation: "Kampala",
    monthsAhead: 2,
    day: 26,
    hour: 16,
    priceCents: 3500000,
    capacity: 450,
    booking: { kind: "event" },
    ticketTypes: [
      { name: "Early bird", priceCents: 3500000, capacity: 50 },
      { name: "General admission", priceCents: 5000000, capacity: 300 },
      { name: "VIP lounge", priceCents: 10000000, capacity: 100 },
    ],
    occupiedSeats: [],
  },
];

export function buildSeedEvents(now = new Date()): SeedEvent[] {
  return eventDefinitions.map(
    ({ monthsAhead, day, hour, minute, ...event }) => ({
      ...event,
      startsAt: scheduledDate(now, monthsAhead, day, hour, minute),
    }),
  );
}
