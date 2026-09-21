import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  canonicalBrowserUrl,
  hasWildcardBrowserHost,
} from "./browser-url";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  if (!host || !hasWildcardBrowserHost(`http://${host}`)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(canonicalBrowserUrl(request.nextUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
