import type { Booking } from "./booking";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type Event = {
  booking?: Booking | null;
  occupiedSeats?: string[];
  ticketTypes?: TicketType[];
  status?: "draft" | "published" | "cancelled";
  cancelledAt?: string | null;
  publishAt?: string | null;
  id: string;
  name: string;
  description: string;
  venue: string;
  mapLocation?: string | null;
  startsAt: string;
  capacity: number | null;
  ticketsSold?: number;
  remainingCapacity?: number | null;
  soldOut?: boolean;
  priceCents: number;
  thumbnailUrl?: string | null;
  owner?: string | Pick<User, "id" | "name"> | null;
};

export type Ticket = {
  seatLabel?: string | null;
  ticketTypeId?: string | null;
  ticketTypeName?: string;
  unitPriceCents?: number;
  id: string;
  code: string;
  buyerName: string;
  buyerEmail: string;
  status: "issued" | "checked_in" | "cancelled";
  checkedInAt: string | null;
  qrPayload: string;
  qrCodeDataUrl: string;
  event: Event;
};

export type GateResult = {
  result: "accepted" | "duplicate" | "cancelled" | "invalid" | "forbidden";
  message: string;
  checkedInAt?: string;
  ticket?: Ticket;
};

export type SalesSummary = {
  ticketsIssued: number;
  ticketsCancelled: number;
  checkedIn: number;
  faceValueCents: number;
  unpricedTickets: number;
  events: number;
  remainingCapacity: number;
  unlimitedEvents: number;
  verifiedRevenueCents: null;
  daily: { day: string; ticketsIssued: number }[];
  generatedAt: string;
};

export type AttendeePage = {
  attendees: {
    id: string;
    seatLabel?: string | null;
    buyerName: string;
    buyerEmail: string;
    ticketTypeName: string;
    status: Ticket["status"];
    createdAt: string;
    checkedInAt: string | null;
  }[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "root_admin";
};

export type AuthSession = {
  token: string;
  user: User;
};

export function getApiUrl() {
  return API_URL;
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const payload =
      data?.message && typeof data.message === "object" ? data.message : data;
    throw payload;
  }

  return data as T;
}

export const api = {
  scanMetrics: (id: string, day: string, token: string) =>
    request<ScanMetrics>(
      `/events/${encodeURIComponent(id)}/scan-metrics?${new URLSearchParams({ day })}`,
      { cache: "no-store" },
      token,
    ),
  ticketActivity: (id: string, page: number, token: string) =>
    request<TicketActivityPage>(
      `/tickets/${encodeURIComponent(id)}/activity?page=${page}`,
      { cache: "no-store" },
      token,
    ),
  salesSummary: (token: string, eventId?: string) =>
    request<SalesSummary>(
      eventId ? `/events/${eventId}/sales-summary` : "/events/sales-summary",
      { cache: "no-store" },
      token,
    ),
  eventAttendees: (
    eventId: string,
    search: string,
    page: number,
    token: string,
  ) =>
    request<AttendeePage>(
      `/events/${eventId}/attendees?${new URLSearchParams({ search, page: String(page) })}`,
      undefined,
      token,
    ),
  duplicateEvent: (eventId: string, startsAt: string, token: string) =>
    request<Event>(
      `/events/${eventId}/duplicate`,
      { method: "POST", body: JSON.stringify({ startsAt }) },
      token,
    ),
  createDraft: (
    payload: Partial<
      Pick<
        Event,
        | "name"
        | "description"
        | "venue"
        | "startsAt"
        | "capacity"
        | "priceCents"
        | "mapLocation"
        | "thumbnailUrl"
        | "booking"
      >
    > & { ticketTypes?: InitialTicketType[] },
    token: string,
  ) =>
    request<Event>(
      "/events/drafts",
      { method: "POST", body: JSON.stringify(payload) },
      token,
    ),
  cancelEvent: (eventId: string, token: string) =>
    request<Event>(
      `/events/${eventId}/cancel`,
      { method: "POST", body: JSON.stringify({ confirm: true }) },
      token,
    ),
  listEvents: () => request<Event[]>("/events"),
  getEvent: (eventId: string, token?: string) =>
    request<Event>(`/events/${eventId}`, undefined, token),
  myEvents: (token: string) =>
    request<Event[]>("/events/mine", undefined, token),
  createEvent: (
    payload: {
      booking?: Booking | null;
      ticketTypes?: InitialTicketType[];
      name: string;
      description: string;
      venue: string;
      mapLocation?: string;
      startsAt: string;
      capacity: number | null;
      priceCents: number;
      thumbnailUrl?: string;
    },
    token: string,
  ) =>
    request<Event>(
      "/events",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),
  uploadEventImage: (
    payload: { fileName: string; contentType: string; dataUrl: string },
    token: string,
  ) =>
    request<{ url: string }>(
      "/events/uploads",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),
  updateEvent: (
    eventId: string,
    payload: Partial<{
      booking: Booking | null;
      status: "published";
      publishAt: string | null;
      name: string;
      description: string;
      venue: string;
      mapLocation: string;
      startsAt: string;
      capacity: number | null;
      priceCents: number;
      thumbnailUrl: string;
    }>,
    token: string,
  ) =>
    request<Event>(
      `/events/${eventId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      token,
    ),
  buyTickets: (
    payload: {
      seatLabels?: string[];
      ticketTypeId?: string;
      eventId: string;
      buyerName: string;
      buyerEmail: string;
      quantity: number;
      mobileMoneyNumber?: string;
      confirmAdditional?: boolean;
    },
    token?: string,
  ) =>
    request<Ticket[]>(
      "/tickets",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),
  myTickets: (token: string) =>
    request<Ticket[]>("/tickets/mine", undefined, token),
  scanTicket: (code: string, token: string) =>
    request<GateResult>(
      "/gate/scan",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      },
      token,
    ),
  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: (token: string) => request<User>("/auth/me", undefined, token),
};

export type TicketType = {
  id: string;
  name: string;
  priceCents: number;
  capacity: number | null;
  maxPerOrder: number;
  salesStart: string | null;
  salesEnd: string | null;
  remainingCapacity: number | null;
  ticketsSold: number;
  available: boolean;
};

export type TicketActivityPage = {
  issuedAt: string;
  legacyCheckedInAt: string | null;
  activities: {
    id: string;
    kind: string;
    createdAt: string;
    operatorId: string;
    operatorName: string;
    device: string | null;
  }[];
  page: number;
  hasMore: boolean;
};

export type ScanMetrics = {
  day: string;
  attempts: number;
  accepted: number;
  failed: number;
  duplicates: number;
  timedScans: number;
  averageDecisionMs: number | null;
  peakCheckInHour: string | null;
  peakCheckIns: number;
  hourly: {
    hour: string;
    attempts: number;
    accepted: number;
    failed: number;
    duplicates: number;
    timedScans: number;
    averageDecisionMs: number | null;
  }[];
  generatedAt: string;
};

export type InitialTicketType = {
  name: string;
  priceCents: number;
  capacity?: number | null;
  maxPerOrder?: number;
};
