import type { ReactNode } from "react";

export function AuthFrame({
  children,
  description,
  kicker,
  pageClass,
  title,
}: {
  children: ReactNode;
  description: string;
  kicker?: string;
  pageClass: string;
  title: string;
}) {
  return (
    <section className={`auth-stage ${pageClass}`}>
      <div className="auth-media" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1800&q=85"
          alt=""
        />
        <div className="auth-event-card">
          <span>Passmint</span>
          <strong>One account for tickets, events, and the door.</strong>
          <small>Checkout, hosting, and gate verification in one place.</small>
        </div>
      </div>

      <section className="auth-card" aria-label="Account access">
        <div className="auth-heading">
          {kicker && <p className="section-kicker">{kicker}</p>}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {children}
      </section>
    </section>
  );
}
