import { Ticket } from "lucide-react";
export default function Loading() {
  return (
    <div className="site-container py-20" role="status">
      <div className="flex items-center gap-3 text-text-muted">
        <Ticket size={22} />
        <span>Getting things ready…</span>
      </div>
      <div className="resource-grid" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-64 rounded-xl border border-border bg-surface-raised"
          />
        ))}
      </div>
    </div>
  );
}
