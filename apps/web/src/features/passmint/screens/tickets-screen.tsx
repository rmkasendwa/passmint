"use client";

import {
  CalendarDays,
  CircleDollarSign,
  History,
  LogIn,
  MapPin,
  QrCode,
  Ticket as TicketIcon,
  UserPlus,
} from "lucide-react";
import { EventThumbnail } from "../components/event-thumbnail";
import { eventTone } from "../event-utils";
import { dateTime, money, shortDate } from "../formatters";
import { usePassmint } from "../passmint-app";

export function TicketsScreen() {
  const {
    buyerEmail,
    buyerName,
    loading,
    mobileMoneyNumber,
    openAuth,
    purchaseState,
    quantity,
    selectedEvent,
    selectedEventId,
    session,
    setBuyerEmail,
    setBuyerName,
    setMobileMoneyNumber,
    setQuantity,
    ticketHistory,
    tickets,
    chooseEvent,
    visibleEvents,
    buyTickets,
  } = usePassmint();

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

      <div className="tickets-grid">
        <section>
          <div className="section-heading">
            <div>
              <p className="section-kicker">Available now</p>
              <h2>Pick an event</h2>
            </div>
            <span>
              {loading ? "Loading..." : `${visibleEvents.length} live`}
            </span>
          </div>
          <div className="event-grid compact-events">
            {visibleEvents.map((event, index) => (
              <button
                className={`event-card ${eventTone(index)} ${event.id === selectedEventId ? "selected" : ""}`}
                key={event.id}
                onClick={() => chooseEvent(event.id)}
                type="button"
              >
                <EventThumbnail event={event} tone={eventTone(index)} />
                <span className="event-card-copy">
                  <strong>{event.name}</strong>
                  <small>{event.description}</small>
                  <span className="event-card-meta">
                    <span>
                      <CalendarDays size={15} />
                      {shortDate.format(new Date(event.startsAt))}
                    </span>
                    <span>
                      <MapPin size={15} />
                      {event.venue}
                    </span>
                  </span>
                  <span className="event-card-price">
                    {money.format(event.priceCents / 100)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="checkout-stack">
          <section
            className={`identity-panel ${session ? "signed-in" : "anonymous"}`}
          >
            <div>
              <p className="section-kicker">
                {session ? "Signed in checkout" : "Guest checkout"}
              </p>
              <h2>
                {session
                  ? `Buying as ${session.user.name}`
                  : "Buy now, sign in when it matters."}
              </h2>
            </div>
            {session ? (
              <span className={`role-pill ${session.user.role}`}>
                {session.user.role}
              </span>
            ) : (
              <div className="inline-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => openAuth("login")}
                >
                  <LogIn size={17} />
                  Sign in
                </button>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => openAuth("register")}
                >
                  <UserPlus size={17} />
                  Register
                </button>
              </div>
            )}
          </section>

          <section className="checkout-panel">
            <div className="panel-heading">
              <TicketIcon size={22} />
              <h2>Checkout</h2>
            </div>
            {selectedEvent && (
              <div className="event-summary">
                <strong>{selectedEvent.name}</strong>
                <span>{dateTime.format(new Date(selectedEvent.startsAt))}</span>
                <span>{selectedEvent.venue}</span>
              </div>
            )}
            <form onSubmit={buyTickets} className="form-grid">
              <label>
                Buyer name
                <input
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  placeholder={session?.user.name ?? "Anonymous buyer name"}
                  required
                />
              </label>
              <label>
                Buyer email
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  placeholder={
                    session?.user.email ?? "Email for ticket delivery"
                  }
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  min={1}
                  max={10}
                  type="number"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                />
              </label>
              {selectedEvent && selectedEvent.priceCents > 0 && (
                <label>
                  Mobile money number
                  <input
                    value={mobileMoneyNumber}
                    onChange={(event) =>
                      setMobileMoneyNumber(event.target.value)
                    }
                    placeholder="256..."
                    required
                  />
                </label>
              )}
              <button
                className="primary-action"
                type="submit"
                disabled={!selectedEventId}
              >
                <CircleDollarSign size={18} />
                {selectedEvent?.priceCents === 0
                  ? "Get ticket"
                  : "Pay with mobile money"}
              </button>
            </form>
            <p className="helper-line">
              Checkout works anonymously with an email address. Register after
              checkout to track attendance, tickets, and payment methods.
            </p>
            {purchaseState && <p className="state-line">{purchaseState}</p>}
          </section>

          <section className="tickets-panel">
            <div className="panel-heading">
              <QrCode size={22} />
              <h2>Issued tickets</h2>
            </div>
            {tickets.length === 0 ? (
              <p className="muted">
                Purchased tickets will appear here with scannable QR codes.
              </p>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <img
                      src={ticket.qrCodeDataUrl}
                      alt={`QR code for ${ticket.buyerName}`}
                    />
                    <div>
                      <h3>{ticket.buyerName}</h3>
                      <p>{ticket.event.name}</p>
                      <code>{ticket.code}</code>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {session && (
            <section className="history-panel">
              <div className="panel-heading">
                <History size={22} />
                <h2>Saved tickets</h2>
              </div>
              <div className="history-list">
                {ticketHistory.length === 0 ? (
                  <p className="muted">
                    Tickets bought while logged in will show here.
                  </p>
                ) : (
                  ticketHistory.map((ticket) => (
                    <article className="history-card" key={ticket.id}>
                      <div>
                        <strong>{ticket.event.name}</strong>
                        <small>
                          {dateTime.format(new Date(ticket.event.startsAt))}
                        </small>
                      </div>
                      <span className={`ticket-status ${ticket.status}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}
