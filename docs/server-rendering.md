# Server-first rendering

Page and layout files stay Server Components. Read initial data in the route or a server wrapper, then pass serializable props into interactive components. A `use client` component can still render HTML on the server; do not gate its initial content on an effect or browser storage.

| Routes                        | Initial rendering                                                       | Browser work                                           |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `/`                           | Catalog, search results and event cards                                 | Navigation and filters                                 |
| `/event/[eventId]`            | Event, sales availability, saved tickets; owner reports when authorized | Purchase flow, refreshing availability, report filters |
| `/dashboard/events`           | Validated session and hosted events                                     | Filters, polling and mutations                         |
| `/dashboard/reports`          | Validated session and sales summary                                     | Refresh and interactive reports                        |
| `/dashboard/events/[eventId]` | Event, sales summary, attendees and scan metrics                        | Editing, pagination and report date changes            |
| `/dashboard/events/new`       | Authenticated form and preview shell                                    | File selection, validation and submission              |
| `/dashboard/check-in`         | Authenticated scanner controls and manual entry form                    | Camera access, QR decoding and scanning                |
| Auth and information pages    | Forms, headings and page content                                        | Form submission, password visibility and disclosures   |
| `/dashboard`, `/tickets`      | Server redirects                                                        | None                                                   |

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

## Event creation

The direct `/dashboard/events/new` route renders the shared creation form on the server. The root `@modal` slot intercepts in-app links to that URL and displays the same form in a native modal dialog mounted in a body portal. Default and catch-all slot pages clear the overlay on navigation. Both entry points validate the server session.

The dialog traps focus, locks background scrolling, supports Escape and backdrop dismissal, and warns before closing modified fields. Unsaved fields remain in the current provider while browsing; they are not durable drafts until saved. Refreshing or leaving with edits invokes the browser's unsaved-changes warning. Saving and publishing disable repeat submissions and navigate to the created event's management page. Artwork reading also blocks submission until complete.

`test-web-ssr.cjs` checks both direct server HTML and the intercepted route response. Desktop and mobile dialog layout, required-field validation and cancelled dismissal were also verified in the browser.
