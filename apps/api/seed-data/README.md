# Seed data

The API uses the files in `event-images` to create development fixtures. At seed time, each source image passes through the normal event-image validation and optimization pipeline and is written to a stable `event-images/seed/<slug>.webp` storage key. Production never runs the seeder, and Docker excludes this directory from the build context and final image.

The source JPEGs were downloaded from Unsplash on 2026-09-21. Retaining the source URL here preserves provenance without making seeded events depend on an external image host at runtime.

| File                              | Source                                                       |
| --------------------------------- | ------------------------------------------------------------ |
| `afro-house-rooftop-sessions.jpg` | https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3 |
| `basketball-opening-night.jpg`    | https://images.unsplash.com/photo-1546519638-68e109498ffc    |
| `city-football-derby.jpg`         | https://images.unsplash.com/photo-1574629810360-7efbbe195018 |
| `family-science-day.jpg`          | https://images.unsplash.com/photo-1532094349884-543bc11b234d |
| `founders-breakfast-club.jpg`     | https://images.unsplash.com/photo-1556761175-b413da4baf72    |
| `indie-film-night.jpg`            | https://images.unsplash.com/photo-1489599849927-2ee91cede3ba |
| `kampala-book-fair.jpg`           | https://images.unsplash.com/photo-1521587760476-6c12a4b040da |
| `kampala-comedy-showcase.jpg`     | https://images.unsplash.com/photo-1527224857830-43a7acc85260 |
| `kampala-food-festival.jpg`       | https://images.unsplash.com/photo-1504674900247-0877df9cc836 |
| `kampala-jinja-coach.jpg`         | https://images.unsplash.com/photo-1544620347-c4fd4a3d5957    |
| `kampala-tech-night.jpg`          | https://images.unsplash.com/photo-1516321318423-f06f85e504b3 |
| `lake-victoria-cycle-day.jpg`     | https://images.unsplash.com/photo-1528704910379-b8fb984fc562 |
| `lakeside-music-weekend.jpg`      | https://images.unsplash.com/photo-1501386761578-eac5c94b800a |
| `maker-faire-kampala.jpg`         | https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b |
| `stage-and-story-night.jpg`       | https://images.unsplash.com/photo-1507676184212-d03ab07a01bf |
| `startup-pitch-arena.jpg`         | https://images.unsplash.com/photo-1559223607-a43c990c692c    |
| `sunday-craft-market.jpg`         | https://images.unsplash.com/photo-1488459716781-31db52582fe9 |
| `wellness-reset-day.jpg`          | https://images.unsplash.com/photo-1544367567-0f2fcb009e0b    |
| `women-in-product-summit.jpg`     | https://images.unsplash.com/photo-1522202176988-66273c2fd55f |
