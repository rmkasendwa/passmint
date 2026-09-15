export default function Loading() {
  return (
    <div
      className="site-container py-10"
      role="status"
      aria-label="Loading booking samples"
    >
      <div className="mb-8 h-24 max-w-xl animate-pulse rounded-xl bg-surface-muted" />
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-96 animate-pulse rounded-2xl bg-surface-muted"
          />
        ))}
      </div>
      <span className="sr-only">Loading booking samples…</span>
    </div>
  );
}
