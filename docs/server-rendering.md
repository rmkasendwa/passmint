# Server-first rendering

Page and layout files stay Server Components. Read initial data in the route or a server wrapper, then pass serializable props into interactive components. A `use client` component can still render HTML on the server; do not gate its initial content on an effect or browser storage.

| Routes | Initial rendering | Browser work |
| --- | --- | --- |
| `/` | Catalog, search results and event cards | Navigation and filters |
| `/event/[eventId]` | Event, sales availability, saved tickets; owner reports when authorized | Purchase flow, refreshing availability, report filters |
| `/dashboard/events` | Validated session and hosted events | Filters, polling and mutations |
| `/dashboard/reports` | Validated session and sales summary | Refresh and interactive reports |
| `/dashboard/events/[eventId]` | Event, sales summary, attendees and scan metrics | Editing, pagination and report date changes |
| `/dashboard/events/new` | Authenticated form and preview shell | File selection, validation and submission |
| `/dashboard/check-in` | Authenticated scanner controls and manual entry form | Camera access, QR decoding and scanning |
| Auth and information pages | Forms, headings and page content | Form submission, password visibility and disclosures |
| `/dashboard`, `/tickets` | Server redirects | None |

Every content route has a layout-specific `loading.tsx`. Client requests triggered after the first render use table, chart or activity skeletons. Preserve existing data during background refreshes. Skeletons expose one loading announcement and respect reduced motion.

## Sessions and private data

`server-session.ts` validates the session cookie against `/auth/me` and uses request-scoped React caching. Protected routes call `requireServerSession` before loading their data. The API remains responsible for resource-level authorization. Private requests use `cache: 'no-store'`; never put account-specific data in a shared cache.

Sign-in establishes an HttpOnly, SameSite=Lax cookie, secure in production. Sign-out clears it. Existing browser sessions are validated and migrated through a server action on their first visit. The existing bearer-token browser API client remains in use; this is not a migration to cookie-only authentication. A browser-only legacy session requires one initial hydration before the server can recognize it.

The root layout loads the session and theme, not the entire event catalog. Use `API_INTERNAL_URL` for server API access where the browser API address is unsuitable.

## Verification

- `node apps/web/node_modules/typescript/bin/tsc -p apps/web/tsconfig.json --noEmit`
- `node --test apps/api/test/server-rendering.test.cjs apps/api/test/discovery.test.cjs`
- Build the web app with `PASSMINT_BUILD_DIR=.next/production-check` using the repository environment runner.
- `node scripts/test-web-ssr.cjs` starts that production build on port 3062 with an isolated fixture API on port 3053. It strips scripts from responses and checks actual HTML, including protected pages and guest redirects. It does not create accounts or modify the development database.

References: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [authentication](https://nextjs.org/docs/app/guides/authentication), and [data fetching](https://nextjs.org/docs/app/getting-started/fetching-data).
