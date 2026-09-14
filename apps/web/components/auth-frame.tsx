import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Ticket } from "lucide-react";

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
      <div className="auth-intro" aria-hidden="true">
        <span className="auth-emblem">
          <Ticket size={26} strokeWidth={1.7} />
        </span>
        <span>YOUR PASS TO GOOD THINGS</span>
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
        <header className="auth-card-heading">
          {kicker && <p className="eyebrow">{kicker}</p>}
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </header>
        <div className="auth-card-body">{children}</div>
        <div className="auth-card-footer">
          <span>Good plans start here.</span>
          <Link href="/help">
            Need a hand? <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
      <Link href="/" className="auth-back">
        <ArrowLeft size={15} /> Back to exploring
      </Link>
    </section>
  );
}
