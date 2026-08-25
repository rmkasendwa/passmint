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
import { useAppContext } from "./app-provider";
import { EventThumbnail } from "./event-thumbnail";
import { eventTone } from "../event-utils";
import { dateTime, money, shortDate } from "../formatters";
import { PhoneNumberInput } from "./phone-number-input";
import { RequiredLabel, requiredField } from "./form-validation";

const sectionKicker =
  "mb-2 text-[0.78rem] font-(weight:--weight-semibold) uppercase tracking-[0.08em] text-(color:--accent)";
const panel =
  "rounded-lg border border-(color:--border) bg-(color:--surface-raised) shadow-[0_18px_44px_rgb(18_24_31/6%)]";
const panelPadded = `${panel} grid gap-3.5 p-[18px]`;
const panelHeading =
  "mb-3 flex items-center gap-2.5 text-(color:--text) [&_h2]:mb-0 [&_h2]:text-[1.55rem] [&_svg]:text-(color:--accent)";
const primaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(color:--button-bg) px-4 font-(weight:--weight-bold) text-(color:--button-text) hover:bg-(color:--accent)";
const secondaryAction =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-(color:--border) bg-(color:--surface-muted) px-4 font-(weight:--weight-bold) text-(color:--text)";
const formGrid =
  "grid gap-3 [&_label]:grid [&_label]:gap-[7px] [&_label]:text-[0.82rem] [&_label]:font-(weight:--weight-semibold) [&_label]:text-(color:--text-muted) [&_input]:min-h-11 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-(color:--border) [&_input]:bg-(color:--surface-elevated) [&_input]:px-3 [&_input]:text-(color:--text) [&_input]:focus:border-(color:--accent) [&_input]:focus:outline-[3px_solid_rgb(22_125_119/18%)]";
const eventCard =
  "grid min-h-[430px] rounded-lg border border-(color:--border) bg-(color:--surface-raised) text-left text-(color:--text) shadow-none hover:border-(color:--border-strong) [&.selected]:border-(color:--border-strong) max-[820px]:min-h-[500px] max-[600px]:min-h-0 max-[600px]:grid-rows-[220px_1fr] [&_.event-thumbnail-card]:max-[600px]:min-h-[220px]";
const eventCardCopy =
  "grid grid-rows-[auto_auto_auto_1fr_auto] gap-4 p-[26px] max-[820px]:p-[22px]";
const mutedText = "mb-0 text-(color:--text-muted)";
const helperLine = "mb-0 text-[0.88rem] leading-[1.5] text-(color:--text-soft)";
const stateLine =
  "mb-0 rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent)";

export function TicketsCheckout() {
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
  } = useAppContext();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-[18px] max-[1120px]:grid-cols-1">
      <section>
        <div className="mb-[26px] flex items-end justify-between gap-4">
          <div>
            <p className={sectionKicker}>Available now</p>
            <h2 className="mb-0 text-[clamp(2rem,3vw,3.15rem)] font-(weight:--weight-bold) leading-none text-(color:--text)">
              Pick an event
            </h2>
          </div>
          <span className="text-base font-(weight:--weight-semibold) text-(color:--text-muted)">
            {loading ? "Loading..." : `${visibleEvents.length} live`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-[22px] max-[820px]:grid-cols-1">
          {visibleEvents.map((event, index) => (
            <button
              className={`${eventCard} ${event.id === selectedEventId ? "selected" : ""}`}
              key={event.id}
              onClick={() => chooseEvent(event.id)}
              type="button"
            >
              <EventThumbnail event={event} tone={eventTone(index)} />
              <span className={eventCardCopy}>
                <strong className="text-[1.18rem] font-(weight:--weight-bold) leading-[1.16] text-(color:--text)">
                  {event.name}
                </strong>
                <small className="min-h-[3.1em] text-[1.02rem] font-(weight:--weight-regular) leading-[1.55] text-(color:--text-muted)">
                  {event.description}
                </small>
                <span className="grid gap-2 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-[7px] [&_span]:text-[0.94rem] [&_span]:font-(weight:--weight-medium) [&_span]:leading-[1.34] [&_span]:text-(color:--text-muted) [&_svg]:text-(color:--accent)">
                  <span>
                    <CalendarDays size={15} />
                    {shortDate.format(new Date(event.startsAt))}
                  </span>
                  <span>
                    <MapPin size={15} />
                    {event.venue}
                  </span>
                </span>
                <span className="self-center text-[1.4rem] font-(weight:--weight-bold) text-[#167d77]">
                  {money.format(event.priceCents / 100)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside className="sticky top-[94px] grid gap-[18px] max-[1120px]:static">
        <section
          className={`${panelPadded} ${session ? "signed-in" : "anonymous"}`}
        >
          <div>
            <p className={sectionKicker}>
              {session ? "Signed in checkout" : "Guest checkout"}
            </p>
            <h2>
              {session
                ? `Buying as ${session.user.name}`
                : "Buy now, sign in when it matters."}
            </h2>
          </div>
          {session ? (
            <span
              className={`inline-flex min-h-[30px] w-fit items-center rounded-full px-2.5 text-[0.78rem] font-(weight:--weight-semibold) uppercase ${session.user.role === "admin" ? "bg-[#ffe6d8] text-[#b43d19]" : "bg-(color:--accent-soft) text-(color:--accent)"}`}
            >
              {session.user.role}
            </span>
          ) : (
            <div className="inline-flex items-center gap-2 [&_button]:flex-1">
              <button
                type="button"
                className={secondaryAction}
                onClick={() => openAuth("login")}
              >
                <LogIn size={17} />
                Sign in
              </button>
              <button
                type="button"
                className={primaryAction}
                onClick={() => openAuth("register")}
              >
                <UserPlus size={17} />
                Register
              </button>
            </div>
          )}
        </section>

        <section className={panelPadded}>
          <div className={panelHeading}>
            <TicketIcon size={22} />
            <h2>Checkout</h2>
          </div>
          {selectedEvent && (
            <div className="grid gap-1 rounded-lg bg-(color:--surface-muted) p-3">
              <strong className="text-(color:--text)">
                {selectedEvent.name}
              </strong>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {dateTime.format(new Date(selectedEvent.startsAt))}
              </span>
              <span className="text-[0.9rem] text-(color:--text-muted)">
                {selectedEvent.venue}
              </span>
            </div>
          )}
          <form onSubmit={buyTickets} className={formGrid}>
            <label>
              <RequiredLabel>Buyer name</RequiredLabel>
              <input
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                placeholder={session?.user.name ?? "Anonymous buyer name"}
                {...requiredField("Buyer name")}
              />
            </label>
            <label>
              <RequiredLabel>Buyer email</RequiredLabel>
              <input
                type="email"
                value={buyerEmail}
                onChange={(event) => setBuyerEmail(event.target.value)}
                placeholder={session?.user.email ?? "Email for ticket delivery"}
                {...requiredField("Buyer email")}
              />
            </label>
            <label>
              <RequiredLabel>Quantity</RequiredLabel>
              <input
                min={1}
                max={10}
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                {...requiredField("Quantity")}
              />
            </label>
            {selectedEvent && selectedEvent.priceCents > 0 && (
              <PhoneNumberInput
                label="Mobile money number"
                value={mobileMoneyNumber}
                onChange={setMobileMoneyNumber}
                required
              />
            )}
            <button
              className={primaryAction}
              type="submit"
              disabled={!selectedEventId}
            >
              <CircleDollarSign size={18} />
              {selectedEvent?.priceCents === 0
                ? "Get ticket"
                : "Pay with mobile money"}
            </button>
          </form>
          <p className={helperLine}>
            Checkout works anonymously with an email address. Register after
            checkout to track attendance, tickets, and payment methods.
          </p>
          {purchaseState && <p className={stateLine}>{purchaseState}</p>}
        </section>

        <section className={panelPadded}>
          <div className={panelHeading}>
            <QrCode size={22} />
            <h2>Issued tickets</h2>
          </div>
          {tickets.length === 0 ? (
            <p className={mutedText}>
              Purchased tickets will appear here with scannable QR codes.
            </p>
          ) : (
            <div className="grid gap-3">
              {tickets.map((ticket) => (
                <article
                  className="grid grid-cols-[92px_1fr] items-center gap-3 rounded-lg border border-(color:--border) bg-(color:--surface-muted) p-3 max-[600px]:grid-cols-1"
                  key={ticket.id}
                >
                  <img
                    className="size-[92px] rounded-lg bg-white p-1 max-[600px]:size-[132px]"
                    src={ticket.qrCodeDataUrl}
                    alt={`QR code for ${ticket.buyerName}`}
                  />
                  <div>
                    <h3>{ticket.buyerName}</h3>
                    <p className="mb-2 text-(color:--text-muted)">
                      {ticket.event.name}
                    </p>
                    <code className="rounded-md bg-(color:--surface-elevated) px-2 py-1 text-[0.78rem] text-(color:--accent)">
                      {ticket.code}
                    </code>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {session && (
          <section className={panelPadded}>
            <div className={panelHeading}>
              <History size={22} />
              <h2>Saved tickets</h2>
            </div>
            <div className="grid gap-2.5">
              {ticketHistory.length === 0 ? (
                <p className={mutedText}>
                  Tickets bought while logged in will show here.
                </p>
              ) : (
                ticketHistory.map((ticket) => (
                  <article
                    className="flex items-center justify-between gap-3 rounded-lg border border-(color:--border) bg-(color:--surface-muted) p-3"
                    key={ticket.id}
                  >
                    <div>
                      <strong className="block text-(color:--text)">
                        {ticket.event.name}
                      </strong>
                      <small className="text-(color:--text-muted)">
                        {dateTime.format(new Date(ticket.event.startsAt))}
                      </small>
                    </div>
                    <span
                      className={`inline-flex min-h-[28px] items-center rounded-full px-2.5 text-[0.75rem] font-(weight:--weight-semibold) uppercase ${ticket.status === "checked_in" ? "bg-[#dff7e8] text-[#14532d]" : ticket.status === "cancelled" ? "bg-[#ffe8df] text-[#8d2718]" : "bg-(color:--accent-soft) text-(color:--accent)"}`}
                    >
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
  );
}
