const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Event = {
  id: string;
  name: string;
  description: string;
  venue: string;
  startsAt: string;
  capacity: number;
  priceCents: number;
};

export type Ticket = {
  id: string;
  code: string;
  buyerName: string;
  buyerEmail: string;
  status: 'issued' | 'checked_in' | 'cancelled';
  checkedInAt: string | null;
  qrPayload: string;
  qrCodeDataUrl: string;
  event: Event;
};

export type GateResult = {
  result: 'accepted' | 'duplicate' | 'cancelled' | 'invalid';
  message: string;
  checkedInAt?: string;
  ticket?: Ticket;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
};

export type AuthSession = {
  token: string;
  user: User;
};

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const payload = data?.message && typeof data.message === 'object' ? data.message : data;
    throw payload;
  }

  return data as T;
}

export const api = {
  listEvents: () => request<Event[]>('/events'),
  buyTickets: (payload: {
    eventId: string;
    buyerName: string;
    buyerEmail: string;
    quantity: number;
  }, token?: string) =>
    request<Ticket[]>('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),
  myTickets: (token: string) => request<Ticket[]>('/tickets/mine', undefined, token),
  scanTicket: (code: string, token: string) =>
    request<GateResult>('/gate/scan', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }, token),
  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: (token: string) => request<User>('/auth/me', undefined, token),
};
