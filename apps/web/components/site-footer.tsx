import Link from "next/link";
import { ArrowUpRight, Ticket } from "lucide-react";

const groups = [
  {
    title: "Find your next plan",
    links: [
      ["Explore events", "/#events"],
      ["Concerts & music", "/?q=music#events"],
      ["Community & meetups", "/?q=community#events"],
      ["Sports", "/?q=sports#events"],
    ],
  },
  {
    title: "Make it happen",
    links: [
      ["For organizers", "/organizers"],
      ["Booking samples", "/samples"],
      ["Create an event", "/events/new"],
      ["Manage events", "/events"],
      ["Event reports", "/reports"],
    ],
  },
  {
    title: "We're here to help",
    links: [
      ["Help & FAQs", "/help"],
      ["Buying tickets", "/help#tickets"],
      ["Event check-in", "/help#check-in"],
      ["About Passmint", "/about"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Ticket size={22} />
            </span>
            Passmint<span className="brand-dot">.</span>
          </Link>
          <p>Good plans start here.</p>
          <small>
            Discover something worth showing up for. Bring people together. Make
            the moment yours.
          </small>
          <Link href="/organizers" className="footer-cta">
            Bring your event to Passmint <ArrowUpRight size={16} />
          </Link>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="site-container footer-bottom">
        <span>© {new Date().getFullYear()} Passmint. All rights reserved.</span>
        <span>Discover. Book. Be there.</span>
        <Link href="/help#payments">
          Payment & booking guide <ArrowUpRight size={14} />
        </Link>
      </div>
    </footer>
  );
}
