"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, verifySession } from "../server-session";

// Next server actions enforce same-origin requests. Never trust a supplied user object.
export async function establishServerSession(token: string) {
  if (typeof token !== "string" || !token || token.length > 4096)
    throw new Error("Invalid session.");
  const session = await verifySession(token);
  if (!session)
    throw new Error("Your session has expired. Please sign in again.");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  revalidatePath("/", "layout");
  return session;
}

export async function clearServerSession() {
  (await cookies()).delete(SESSION_COOKIE);
  revalidatePath("/", "layout");
}
