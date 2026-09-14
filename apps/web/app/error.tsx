"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="site-container empty-discovery my-16" role="alert">
      <RefreshCw size={36} />
      <p className="eyebrow">LET'S TRY THAT AGAIN</p>
      <h1 className="text-4xl font-semibold">We couldn't load this page.</h1>
      <p>
        Something interrupted the connection. Try again, or return to discovery.
      </p>
      <div className="action-row">
        <button onClick={reset} className="button-primary">
          Try again <RefreshCw size={16} />
        </button>
        <Link className="text-link" href="/">
          Back to discovery
        </Link>
      </div>
    </section>
  );
}
