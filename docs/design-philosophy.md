# Passmint design direction

Updated 14 September 2026.

## Good plans start here

Passmint should feel like a place people want to spend time, and a tool organizers can understand at a glance. Lead with the experience; put practical details where a buyer or organizer needs to act.

The visual identity uses forest and mint, warm neutral surfaces, strong sans-serif headings, and a restrained italic accent on the discovery hero. Photography conveys the energy of going out. Event artwork stays clear of decorative gradients and effects. Light and dark appearances use the same semantic surface, text, border and action tokens.

## Reference study

- [DICE](https://dice.fm/): reviewed its live homepage and footer. The useful patterns are a confident editorial headline, concise attendee language, and separate routes for discovery, help and event creators. Passmint uses original typography, composition and color rather than copying DICE's artwork or identity.
- [Ticket Tailor](https://www.tickettailor.com/): reviewed its homepage and footer. Its organizer journey, feature explanations and grouped support links informed the organizer landing page and the footer's information hierarchy. Its commercial claims, testimonials and policies are not Passmint claims.
- [Eventbrite](https://www.eventbrite.com/): discovery/search was an additional reference from indexed material; the homepage could not be fetched directly during research. No visual conclusions depend on that unavailable page.

## Working rules

1. One main purpose per section. Discovery goes from invitation to search, interests and listings, followed by the organizer invitation. Avoid repeating the same event through multiple carousels and statistic panels.
2. Useful density. Cards show artwork, date, status, title, venue and price. Footers group actual routes for attendees, organizers and help. Do not add empty social links or invented company pages to fill space.
3. Confidence through clarity. Display real event information, explicit empty states and recoverable errors. Do not invent reviews, customer counts, guarantees or payment verification.
4. Consistent interaction. Mint identifies primary actions and selected states. Borders separate quiet surfaces. Keyboard focus is visible; mobile navigation includes appearance controls; reduced-motion preferences are respected.
5. Context follows navigation. Every substantive page has its own metadata. Public event titles include the event name; organizer pages use contextual titles; authenticated pages are marked noindex. Search titles reflect the query.
6. Organizer screens favor practical hierarchy over promotional decoration. The shared workspace strip, mint actions and neutral panels distinguish working in the product from browsing events.

## Current product boundaries

The help centre describes the implementation, including that live payment processing and self-service password recovery are not available. Issued tickets do not establish payment success. Legal policies, a verified support contact, payment processing and commercial terms still require their own product work before a paid launch. This design change does not establish commercial readiness.

## Validation

Use the web TypeScript check, discovery regression tests and production build. For an isolated build alongside the development server, set `PASSMINT_BUILD_DIR=.next/production-check` before running the web build. Next.js may update generated type paths during this check; do not retain environment-specific generated changes.

Visually review discovery, search results, event details, checkout, authentication, help and the footer in both themes. Check mobile navigation, small-screen overflow and keyboard focus. Authenticated workspace interactions need an authorized local session for full browser verification.
