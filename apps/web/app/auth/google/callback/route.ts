import { NextResponse } from "next/server";
import { canonicalBrowserUrl } from "../../../../browser-url";
import { organizerReturnPath } from "../../../../organizer-routes";
import {
  SESSION_COOKIE,
  serverApiUrl,
  verifySession,
} from "../../../../server-session";

const GOOGLE_OAUTH_STATE_COOKIE = "passmint-google-oauth-state";

export async function GET(request: Request) {
  const url = canonicalBrowserUrl(request.url);
  const token = url.searchParams.get("token");
  const next = organizerReturnPath(url.searchParams.get("next"));

  if (
    !token &&
    ["code", "state", "error"].some((parameter) =>
      url.searchParams.has(parameter),
    )
  ) {
    const backendUrl = new URL(
      `${serverApiUrl().replace(/\/$/, "")}/auth/google/callback`,
      url.origin,
    );
    backendUrl.search = url.search;

    try {
      const cookie = request.headers.get("cookie");
      const backendResponse = await fetch(backendUrl, {
        cache: "no-store",
        headers: cookie ? { cookie } : undefined,
        redirect: "manual",
      });
      const location = backendResponse.headers.get("location");

      if (location) {
        const response = NextResponse.redirect(
          canonicalBrowserUrl(new URL(location, url)),
          302,
        );
        response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
        return response;
      }
    } catch {
      // The login page below provides a stable failure destination.
    }

    const response = NextResponse.redirect(
      new URL("/login?error=Google%20sign-in%20did%20not%20complete.", url),
    );
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    return response;
  }

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
