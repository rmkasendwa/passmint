import { NextResponse } from "next/server";
import { organizerReturnPath } from "../../../../organizer-routes";
import { SESSION_COOKIE, verifySession } from "../../../../server-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const next = organizerReturnPath(url.searchParams.get("next"));

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=Google%20sign-in%20did%20not%20complete.", url),
    );
  }

  const session = await verifySession(token).catch(() => null);
  if (!session) {
    return NextResponse.redirect(
      new URL("/login?error=Google%20sign-in%20session%20expired.", url),
    );
  }

  const response = NextResponse.redirect(new URL(next, url));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
