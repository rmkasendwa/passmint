import { TicketsCheckout } from '../../components/tickets-checkout';

export default function TicketsPage() {
  return (
    <section
      className="mx-auto mt-6.5 w-[min(1180px,calc(100%-32px))] max-w-295 text-text"
      aria-label="Ticket checkout"
    >
      <div className="mb-4.5 grid gap-3 overflow-hidden rounded-lg border border-[rgb(18_24_31/10%)] bg-[linear-gradient(135deg,rgb(255_255_255/92%),rgb(255_255_255/78%)),url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center px-7 py-9.5 shadow-[0_24px_70px_rgb(23_28_36/10%)] max-[820px]:px-4 max-[820px]:py-7.5">
        <p className="mb-2 text-[0.78rem] font-(--weight-semibold) uppercase tracking-[0.08em] text-[#fa5b2d]">
          Tickets
        </p>
        <h1 className="mb-0 max-w-225 text-[clamp(2.45rem,6vw,5.8rem)] text-[#101010]">
          Choose your event and check out.
        </h1>
        <p className="mb-0 max-w-162.5 text-[1.02rem] leading-[1.6] text-[#555b64]">
          Purchase as a guest or sign in first to keep your tickets attached to
          your Passmint account.
        </p>
      </div>

      <TicketsCheckout />
    </section>
  );
}
