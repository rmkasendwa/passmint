import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Help & FAQs",
  description:
    "Practical help with booking tickets, mobile money payments, creating events and QR check-in on Passmint.",
};
const guides = [
  {
    id: "tickets",
    title: "Buying tickets",
    items: [
      [
        "How do I book a ticket?",
        "Open an event to review the date, venue and description. Choose an available ticket option and quantity, then follow the booking steps. Check your details and the total before continuing.",
      ],
      [
        "What should I check before booking?",
        "Read the event description for entry requirements and any organizer instructions. Confirm the event date, start time, venue and ticket type. A listing's displayed status tells you whether the event is upcoming, past, cancelled or sold out.",
      ],
      [
        "What if an event changes or I need a refund?",
        "Check the event page for updates and any organizer contact details or booking conditions. Refund and entry arrangements depend on the event. Keep your booking reference and payment confirmation when raising a query with the organizer.",
      ],
    ],
  },
  {
    id: "payments",
    title: "Payments & booking",
    items: [
      [
        "Which payment options can I use?",
        "The event checkout shows the available payment methods, with MTN Mobile Money and Airtel Money selectors. Live payment collection is not available yet. A ticket issued in the current version is not proof of payment.",
      ],
      [
        "How do I know my booking is complete?",
        "After ticket issuance, your QR ticket appears on the event page. Keep it available for entry. If you booked while signed in, return to that event using the same account to see your tickets. Ticket issuance does not confirm a payment.",
      ],
      [
        "Can I request a payment refund through Passmint?",
        "Passmint does not currently collect live payments or process refunds. If you arranged payment separately with an organizer, contact them using the details provided for that event and keep your transaction reference.",
      ],
    ],
  },
  {
    id: "organizers",
    title: "Creating & managing events",
    items: [
      [
        "How do I publish my first event?",
        "Sign in and open Create event in your organizer workspace. Add a name, description, venue, date, artwork, price and capacity. Save a draft to finish later, or publish when the details are ready. Publishing requires an account with organizer access.",
      ],
      [
        "What makes a useful event listing?",
        "Use a recognizable cover image and a short, specific title. Explain what guests can expect, who the event is for, how to get there and what their ticket includes. Check the date, price and capacity before publishing.",
      ],
      [
        "Where do I manage ticket sales?",
        "Open Your events in the workspace and select an event. Its management view contains ticket options, attendees and activity. Reports gives you a broader view of ticket activity across your events.",
      ],
    ],
  },
  {
    id: "check-in",
    title: "Event check-in",
    items: [
      [
        "How do I check a guest in?",
        "Open Check-in using an account with ticket verification access. Enable your camera to scan the guest's QR ticket, or enter the ticket code manually. Check the result on screen before admitting the guest.",
      ],
      [
        "What if the camera does not work?",
        "Allow camera access in your browser and make sure another application is not using it. If scanning is unavailable, enter the ticket code manually. Keep an internet connection available for verification.",
      ],
      [
        "What if a ticket has already been used?",
        "Do not admit the guest based on a repeated scan alone. Check the verification result and ask the event organizer to review the ticket and attendee record.",
      ],
    ],
  },
];
export default function HelpPage() {
  return (
    <div className="site-container">
      <header className="resource-hero">
        <p className="eyebrow">A LITTLE GUIDANCE, RIGHT WHEN YOU NEED IT</p>
        <h1>
          Let's get you
          <br />
          to the good part.
        </h1>
        <p>
          Answers for ticket buyers, event organizers and the people welcoming
          guests at the door.
        </p>
      </header>
      <div className="guide-layout">
        <nav className="guide-nav" aria-label="Help topics">
          {guides.map((g) => (
            <Link key={g.id} href={`#${g.id}`}>
              {g.title}
            </Link>
          ))}
          <Link href="/forgot-password">Account recovery information ↗</Link>
        </nav>
        <div>
          {guides.map((g) => (
            <section className="guide-section" id={g.id} key={g.id}>
              <h2>{g.title}</h2>
              {g.items.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
