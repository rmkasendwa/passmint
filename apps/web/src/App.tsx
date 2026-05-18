import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Drama,
  Dumbbell,
  Globe2,
  Landmark,
  MapPin,
  Martini,
  Mic2,
  Music2,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api, Event, GateResult, Ticket } from './api';

const money = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat('en-UG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const shortDate = new Intl.DateTimeFormat('en-UG', {
  month: 'short',
  day: 'numeric',
});

const categories = [
  { label: 'Music', detail: 'Live shows', icon: Music2 },
  { label: 'Sports', detail: 'Games & matches', icon: Trophy },
  { label: 'Nightlife', detail: 'Clubs & raves', icon: Martini },
  { label: 'Theatre', detail: 'Stage & culture', icon: Drama },
  { label: 'Conferences', detail: 'Business', icon: Mic2 },
  { label: 'Cinema', detail: 'Film nights', icon: Clapperboard },
  { label: 'Wellness', detail: 'Fitness', icon: Dumbbell },
  { label: 'Community', detail: 'Meetups', icon: Users },
];

const countries = ['Uganda', 'Kenya', 'Rwanda', 'Tanzania', 'Nigeria', 'Ghana'];

const demoEvents: Event[] = [
  {
    id: 'demo-citrus-brunch',
    name: 'Citrus & Rose Brunch',
    description: 'A sunny food, music, and lifestyle ticket for Nairobi weekend crowds.',
    venue: 'RFUEA Ground, Nairobi',
    startsAt: '2026-05-29T11:00:00.000Z',
    capacity: 800,
    priceCents: 8500000,
  },
  {
    id: 'demo-kampala-js',
    name: 'JavaScript Kampala Meetup',
    description: 'Talks, demos, and community networking for builders across Kampala.',
    venue: "Africa's Talking, Kampala",
    startsAt: '2026-06-04T15:00:00.000Z',
    capacity: 220,
    priceCents: 0,
  },
  {
    id: 'demo-nec-vipers',
    name: 'NEC FC vs Vipers FC',
    description: 'Matchday tickets with fast QR entry for football fans.',
    venue: 'MTN Omondi Stadium, Kampala',
    startsAt: '2026-06-13T13:00:00.000Z',
    capacity: 4500,
    priceCents: 3000000,
  },
  {
    id: 'demo-vibes-valour',
    name: 'Vibes & Valour',
    description: 'A live conversation and social evening for the next generation of leaders.',
    venue: 'Yujo Izakaya, Kampala',
    startsAt: '2026-06-20T16:30:00.000Z',
    capacity: 180,
    priceCents: 5000000,
  },
  {
    id: 'demo-campus-pitch',
    name: 'Campus Pitch Africa',
    description: 'Student founders, investors, product demos, and campus energy.',
    venue: 'Akwa Ibom State University',
    startsAt: '2026-07-02T09:00:00.000Z',
    capacity: 600,
    priceCents: 2000000,
  },
  {
    id: 'demo-basketball',
    name: 'Basketball League Opening Night',
    description: 'Courtside tickets for the first night of the city league season.',
    venue: 'Lugogo Sports Complex, Kampala',
    startsAt: '2026-07-10T17:00:00.000Z',
    capacity: 1200,
    priceCents: 2500000,
  },
];

function eventTone(index: number) {
  return `tone-${(index % 6) + 1}`;
}

export function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [gateCode, setGateCode] = useState('');
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseState, setPurchaseState] = useState('');
  const [scanState, setScanState] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    api
      .listEvents()
      .then((data) => {
        setEvents(data);
        setSelectedEventId(data[0]?.id ?? '');
      })
      .catch(() => {
        setEvents(demoEvents);
        setSelectedEventId(demoEvents[0].id);
        setPurchaseState('Demo events loaded. Start the API to issue real tickets.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cameraEnabled || !videoRef.current) return;

    const reader = new BrowserQRCodeReader();
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result) {
          const text = result.getText();
          setGateCode(text);
          void scan(text);
          controlsRef.current?.stop();
          setCameraEnabled(false);
        }
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => {
        setScanState('Camera scanner could not start. You can enter the code manually.');
        setCameraEnabled(false);
      });

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [cameraEnabled]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const haystack = `${event.name} ${event.description} ${event.venue}`.toLowerCase();
      const matchesQuery = normalizedQuery ? haystack.includes(normalizedQuery) : true;
      const matchesDate = dateFilter ? event.startsAt.slice(0, 10) === dateFilter : true;

      return matchesQuery && matchesDate;
    });
  }, [dateFilter, events, query]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  const featuredEvent = filteredEvents[0] ?? events[0];
  const visibleEvents = filteredEvents.length > 0 ? filteredEvents : events;

  async function buyTickets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPurchaseState('Creating ticket...');

    try {
      const created = await api.buyTickets({
        eventId: selectedEventId,
        buyerName,
        buyerEmail,
        quantity,
      });
      setTickets(created);
      setPurchaseState('Ticket purchase complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ticket purchase failed.';
      setPurchaseState(message);
    }
  }

  async function scan(code = gateCode) {
    const normalized = code.trim();
    if (!normalized) return;

    setScanState('Checking ticket...');
    setGateResult(null);

    try {
      const result = await api.scanTicket(normalized);
      setGateResult(result);
      setScanState(result.message);
    } catch (error) {
      const fallback = error as Partial<GateResult>;
      setGateResult({
        result: fallback.result ?? 'invalid',
        message: fallback.message ?? 'Ticket could not be validated.',
        checkedInAt: fallback.checkedInAt,
        ticket: fallback.ticket,
      });
      setScanState(fallback.message ?? 'Ticket could not be validated.');
    }
  }

  function chooseEvent(eventId: string) {
    setSelectedEventId(eventId);
    setPurchaseState('');
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#discover" aria-label="Passmint home">
          <span className="brand-mark">
            <TicketIcon size={22} />
          </span>
          <span>Passmint</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#discover">Discover</a>
          <a href="#checkout">Tickets</a>
          <a href="#gate">Gate</a>
        </nav>
        <a className="host-link" href="#checkout">
          List an event
          <ChevronRight size={16} />
        </a>
      </header>

      <section className="hero-section" id="discover">
        <div className="hero-copy">
          <p className="eyebrow">Africa-ready ticketing</p>
          <h1>Find the room, buy the ticket, scan the gate.</h1>
          <p className="hero-text">
            A ticketing marketplace for concerts, sport, nightlife, meetups, and community experiences,
            with QR passes issued instantly at checkout.
          </p>
        </div>

        <form className="search-panel" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>Where to?</span>
            <div className="input-shell">
              <MapPin size={18} />
              <input
                aria-label="Search by event or venue"
                placeholder="Any event or venue"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
          <label>
            <span>When</span>
            <div className="input-shell">
              <CalendarDays size={18} />
              <input
                aria-label="Filter by date"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </div>
          </label>
          <button className="search-button" type="submit" aria-label="Search events">
            <Search size={19} />
            Search
          </button>
        </form>

        <div className="category-strip" aria-label="Event categories">
          {categories.map(({ label, detail, icon: Icon }) => (
            <button type="button" key={label} onClick={() => setQuery(label)}>
              <Icon size={20} />
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="market-layout" aria-label="Ticket marketplace">
        <div className="main-column">
          {featuredEvent && (
            <section className="featured-event">
              <div className={`poster-art ${eventTone(0)}`}>
                <Sparkles size={34} />
                <span>{shortDate.format(new Date(featuredEvent.startsAt))}</span>
              </div>
              <div className="featured-copy">
                <p className="section-kicker">Featured ticket</p>
                <h2>{featuredEvent.name}</h2>
                <p>{featuredEvent.description}</p>
                <div className="event-meta">
                  <span>
                    <MapPin size={16} />
                    {featuredEvent.venue}
                  </span>
                  <span>
                    <CircleDollarSign size={16} />
                    {money.format(featuredEvent.priceCents / 100)}
                  </span>
                </div>
                <button className="primary-action" type="button" onClick={() => chooseEvent(featuredEvent.id)}>
                  <TicketIcon size={18} />
                  Get tickets
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="section-heading">
              <div>
                <p className="section-kicker">Latest published events</p>
                <h2>Tickets selling now</h2>
              </div>
              <span>{loading ? 'Loading...' : `${visibleEvents.length} live`}</span>
            </div>

            {loading ? (
              <p className="muted">Loading events...</p>
            ) : (
              <div className="event-grid">
                {visibleEvents.map((event, index) => (
                  <button
                    className={`event-card ${eventTone(index)} ${event.id === selectedEventId ? 'selected' : ''}`}
                    key={event.id}
                    onClick={() => chooseEvent(event.id)}
                    type="button"
                  >
                    <span className="event-poster">
                      <TicketIcon size={24} />
                      <strong>{shortDate.format(new Date(event.startsAt))}</strong>
                    </span>
                    <span className="event-card-copy">
                      <strong>{event.name}</strong>
                      <small>{event.venue}</small>
                      <span>{money.format(event.priceCents / 100)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="section-heading">
              <div>
                <p className="section-kicker">Discover by country</p>
                <h2>Explore events across Africa</h2>
              </div>
              <Globe2 size={22} />
            </div>
            <div className="country-grid">
              {countries.map((country) => (
                <button type="button" key={country} onClick={() => setQuery(country)}>
                  <Landmark size={18} />
                  <span>{country}</span>
                  <small>East & West Africa</small>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="side-column" id="checkout">
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
                <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} required />
              </label>
              <label>
                Buyer email
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
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
              <button className="primary-action" type="submit" disabled={!selectedEventId}>
                <CircleDollarSign size={18} />
                Buy ticket
              </button>
            </form>
            {purchaseState && <p className="state-line">{purchaseState}</p>}
          </section>

          <section className="tickets-panel">
            <div className="panel-heading">
              <QrCode size={22} />
              <h2>Issued tickets</h2>
            </div>
            {tickets.length === 0 ? (
              <p className="muted">Purchased tickets will appear here with scannable QR codes.</p>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <img src={ticket.qrCodeDataUrl} alt={`QR code for ${ticket.buyerName}`} />
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
        </aside>
      </section>

      <section className="gate-panel" id="gate">
        <div>
          <div className="panel-heading">
            <ScanLine size={22} />
            <h2>Gate scanner</h2>
          </div>
          <p>Validate QR tickets at the door, detect duplicates, and keep entry moving.</p>
        </div>
        <div className="scanner-box">
          {cameraEnabled ? (
            <video ref={videoRef} muted playsInline />
          ) : (
            <div className="scanner-placeholder">
              <ShieldCheck size={54} />
            </div>
          )}
        </div>
        <div className="gate-actions">
          <button type="button" className="secondary-action" onClick={() => setCameraEnabled((value) => !value)}>
            <ScanLine size={18} />
            {cameraEnabled ? 'Stop camera' : 'Start camera'}
          </button>
          <input
            placeholder="Paste or type ticket code"
            value={gateCode}
            onChange={(event) => setGateCode(event.target.value)}
          />
          <button type="button" className="primary-action" onClick={() => void scan()}>
            Validate
          </button>
        </div>
        {scanState && <p className="state-line">{scanState}</p>}
        {gateResult && (
          <div className={`gate-result ${gateResult.result}`}>
            {gateResult.result === 'accepted' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
            <div>
              <strong>{gateResult.result.replace('_', ' ')}</strong>
              <span>{gateResult.ticket?.buyerName ?? gateResult.message}</span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
