import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChartNoAxesCombined,
  CreditCard,
  QrCode,
  ScanLine,
  Ticket,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Product showcase",
  description:
    "A public product overview of Passmint's buyer, organizer, ticketing and admission workflows.",
  openGraph: {
    title: "Passmint product showcase",
    description:
      "See how Passmint helps people discover events, buy tickets and run admission from one focused product experience.",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
        alt: "Guests at a live event",
      },
    ],
  },
};

const workflow = [
  {
    icon: Ticket,
    title: "Buyer journey",
    copy: "Guests discover events, compare ticket options, complete free or paid checkout and return to entrance-ready QR tickets.",
  },
  {
    icon: CalendarCheck,
    title: "Organizer journey",
    copy: "Hosts create a draft, configure tickets and layouts, publish a public page, monitor attendees and move into check-in.",
  },
  {
    icon: ScanLine,
    title: "Admission",
    copy: "Event staff scan QR tickets or type a code, with accepted, duplicate, cancelled and invalid outcomes clearly separated.",
  },
];

const capabilities = [
  [
    "Event discovery",
    "Searchable event pages with status, venue, timing and availability.",
  ],
  [
    "Ticket options",
    "Ticket categories, seat-aware booking, quantity limits and sold-out states.",
  ],
  [
    "Mobile money direction",
    "Checkout copy is prepared for MTN MoMo and Airtel Money approval flows without overstating settlement.",
  ],
  [
    "Operations",
    "Attendee lists, ticket activity, check-in metrics and sales summaries for organizers.",
  ],
];

export default function ShowcasePage() {
  return (
    <main className="showcase-page">
      <section className="showcase-hero">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=85"
          alt="Guests enjoying a live event"
        />
        <div className="site-container showcase-hero__content">
          <p className="eyebrow">PASSMINT PRODUCT SHOWCASE</p>
          <h1>
            Event ticketing that feels ready from first click to front door.
          </h1>
          <p>
            Passmint brings discovery, checkout, ticket presentation, organizer
            operations and admission into one coherent experience for live
            events in Uganda.
          </p>
          <div className="action-row">
            <Link href="/?demo=1" className="button-primary">
              Open controlled demo <ArrowRight size={18} />
            </Link>
            <Link href="/organizers" className="text-link">
              See organizer tools <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="site-container showcase-section showcase-split">
        <div>
          <p className="eyebrow">WHAT PASSMINT SOLVES</p>
          <h2>
            One product for the public event page and the private operations
            room.
          </h2>
          <p>
            Buyers need confidence before paying. Organizers need clear event
            state, practical ticket controls and quick event-day tools. Passmint
            connects those needs without exposing internal systems.
          </p>
        </div>
        <div className="showcase-proof">
          <BadgeCheck size={30} />
          <strong>Built around real workflows</strong>
          <span>
            The showcase links to the controlled demo environment while keeping
            the source repository, credentials and implementation details
            private.
          </span>
        </div>
      </section>

      <section className="site-container showcase-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WORKFLOWS</p>
            <h2>What people can see and do</h2>
          </div>
        </div>
        <div className="showcase-workflow">
          {workflow.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <Icon size={28} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="showcase-band">
        <div className="site-container showcase-band__grid">
          <div>
            <p className="eyebrow">CAPABILITIES</p>
            <h2>Ticketing, venue context and admission in one place.</h2>
          </div>
          <div className="showcase-capabilities">
            {capabilities.map(([title, copy]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container showcase-section showcase-demo">
        <div>
          <p className="eyebrow">DEMO PATH</p>
          <h2>Share the story publicly, keep the demo controlled.</h2>
          <p>
            Product claims here match the current Passmint experience. Payment
            collection is presented as directionally ready for mobile-money
            approval flows, while verified revenue remains separate from ticket
            face value until settlement data is connected.
          </p>
        </div>
        <div className="showcase-demo__actions">
          <Link href="/tickets" className="button-primary">
            Try buyer checkout <CreditCard size={18} />
          </Link>
          <Link href="/check-in" className="button-secondary">
            View admission <QrCode size={18} />
          </Link>
          <Link href="/reports" className="button-secondary">
            Review reports <ChartNoAxesCombined size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
