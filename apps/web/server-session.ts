import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession, User } from "./api";
import { getApiUrl } from "./api";

export const SESSION_COOKIE = "passmint-server-session";
export const serverApiUrl = () => process.env.API_INTERNAL_URL ?? getApiUrl();

export async function verifySession(
  token: string,
): Promise<AuthSession | null> {
  const response = await fetch(`${serverApiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok)
    throw new Error("Unable to verify your session. Please try again.");
  return { token, user: (await response.json()) as User };
}

// React cache is scoped to this render request, never shared between accounts.
export const getServerSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
});

export async function requireServerSession(path: string) {
  const session = await getServerSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}`);
  return session;
}

export async function serverPrivateData<T>(
  path: string,
  token: string,
): Promise<T> {
  const response = await fetch(`${serverApiUrl()}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login");
  if (!response.ok)
    throw new Error("Unable to load your event data. Please try again.");
  return response.json() as Promise<T>;
}
