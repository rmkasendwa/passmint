const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type Event = {
  id: string;
  name: string;
  description: string;
  venue: string;
  mapLocation?: string | null;
  startsAt: string;
  capacity: number;
  priceCents: number;
  thumbnailUrl?: string | null;
  owner?: string | User | null;
};

export type Ticket = {
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

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export type AuthSession = {
  token: string;
  user: User;
};

export function getApiUrl() {
  return API_URL;
}

async function request<T>(
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
  listEvents: () => request<Event[]>("/events"),
  getEvent: (eventId: string) => request<Event>(`/events/${eventId}`),
  myEvents: (token: string) =>
    request<Event[]>("/events/mine", undefined, token),
  createEvent: (
    payload: {
      name: string;
      description: string;
      venue: string;
      mapLocation?: string;
      startsAt: string;
      capacity: number;
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
      name: string;
      description: string;
      venue: string;
      mapLocation: string;
      startsAt: string;
      capacity: number;
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
