import { TicketsCheckout } from "../../components/tickets-checkout";

export default function TicketsPage() {
  return (
    <section className="page-layout tickets-page" aria-label="Ticket checkout">
      <div className="page-intro">
        <p className="section-kicker">Tickets</p>
        <h1>Choose your event and check out.</h1>
        <p>
          Purchase as a guest or sign in first to keep your tickets attached to
          your Passmint account.
        </p>
      </div>

      <TicketsCheckout />
    </section>
  );
}
