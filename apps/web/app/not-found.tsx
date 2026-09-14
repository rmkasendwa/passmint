import type { Metadata } from "next";
export const metadata: Metadata = { title: "Page not found" };
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
export default function NotFound() {
  return (
    <section className="site-container empty-discovery my-16">
      <Compass size={40} />
      <p className="eyebrow">404 · A DIFFERENT DIRECTION</p>
      <h1 className="text-4xl font-semibold">
        This page isn't on the guest list.
      </h1>
      <p>
        The link may have changed, or this event may no longer be available.
        Let's find your next plan.
      </p>
      <Link href="/" className="button-primary">
        Back to discovery <ArrowRight size={18} />
      </Link>
    </section>
  );
}
