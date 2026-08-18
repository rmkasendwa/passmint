"use client";

import type { IScannerControls } from "@zxing/browser";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Compass,
  Drama,
  Dumbbell,
  History,
  ImagePlus,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  Martini,
  Mic2,
  Monitor,
  Music2,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Moon,
  Sun,
  Ticket as TicketIcon,
  Trophy,
  Upload,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { api, AuthSession, Event, GateResult, Ticket } from "./api";

const money = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("en-UG", {
  dateStyle: "medium",
  timeStyle: "short",
});

const shortDate = new Intl.DateTimeFormat("en-UG", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const chipDate = new Intl.DateTimeFormat("en-UG", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const filterDate = new Intl.DateTimeFormat("en-UG", {
  month: "short",
  day: "numeric",
});

const categories = [
  { label: "For you", query: "", icon: Compass },
  { label: "Concerts", query: "music", icon: Music2 },
  { label: "Nightlife", query: "nightlife", icon: Martini },
  { label: "Sports", query: "sports", icon: Trophy },
  { label: "Theatre", query: "theatre", icon: Drama },
  { label: "Conferences", query: "conference", icon: Mic2 },
  { label: "Cinema", query: "cinema", icon: Clapperboard },
  { label: "Wellness", query: "wellness", icon: Dumbbell },
  { label: "Community", query: "community", icon: Users },
];

const SESSION_KEY = "passmint-session";
const THEME_KEY = "passmint-theme";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

function daysFromNow(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

const demoEvents: Event[] = [
  {
    id: "demo-citrus-brunch",
    name: "Citrus & Rose Brunch",
    description:
      "A sunny food, music, and lifestyle ticket for weekend crowds.",
    venue: "The Line, Los Angeles",
    startsAt: daysFromNow(5, 11),
    capacity: 800,
    priceCents: 8500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-kampala-js",
    name: "JavaScript Builders Meetup",
    description: "Talks, demos, and community networking for product builders.",
    venue: "Village Underground, London",
    startsAt: daysFromNow(8, 15),
    capacity: 220,
    priceCents: 0,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-nec-vipers",
    name: "City FC vs United FC",
    description: "Matchday tickets with fast QR entry for football fans.",
    venue: "National Stadium, Singapore",
    startsAt: daysFromNow(12, 13),
    capacity: 4500,
    priceCents: 3000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-vibes-valour",
    name: "Vibes & Valour",
    description:
      "A live conversation and social evening for the next generation of leaders.",
    venue: "House of Yes, Brooklyn",
    startsAt: daysFromNow(17, 16),
    capacity: 180,
    priceCents: 5000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-campus-pitch",
    name: "Campus Pitch Global",
    description:
      "Student founders, investors, product demos, and campus energy.",
    venue: "TU Berlin, Germany",
    startsAt: daysFromNow(24, 9),
    capacity: 600,
    priceCents: 2000000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "demo-basketball",
    name: "Basketball League Opening Night",
    description:
      "Courtside tickets for the first night of the city league season.",
    venue: "Ginásio do Ibirapuera, São Paulo",
    startsAt: daysFromNow(31, 17),
    capacity: 1200,
    priceCents: 2500000,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
  },
];

const emptyHostEvent = {
  name: "",
  description: "",
  venue: "",
  startsAt: "",
  capacity: 120,
  priceCents: 0,
  thumbnailUrl: "",
};

function eventTone(index: number) {
  return `tone-${(index % 6) + 1}`;
}

function readSavedSession() {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function readSavedTheme(): ThemePreference {
  if (typeof window === "undefined") return "dark";

  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "system" ? saved : "dark";
}

function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function eventStatus(event: Event) {
  const startsAt = new Date(event.startsAt).getTime();
  const now = Date.now();

  if (Number.isNaN(startsAt)) return "Tickets open";
  return startsAt >= now ? "Upcoming" : "Past";
}

function eventCategory(event: Event) {
  const haystack =
    `${event.name} ${event.description} ${event.venue}`.toLowerCase();

  if (/sport|match|fc|league|basket|stadium|arena/.test(haystack)) {
    return "Sports";
  }

  if (/music|dj|concert|brunch|night|club|vibes|show/.test(haystack)) {
    return "Music";
  }

  if (/meetup|launch|conference|builder|javascript|talk|demo/.test(haystack)) {
    return "Conference";
  }

  if (/film|cinema|screen/.test(haystack)) return "Cinema";
  if (/theatre|stage|drama/.test(haystack)) return "Theatre";

  return "Event";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateFilterLabel(start: string, end: string) {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);

  if (!startDate) return "Any date";
  if (!endDate || start === end) return filterDate.format(startDate);

  return `${filterDate.format(startDate)} - ${filterDate.format(endDate)}`;
}

function calendarDays(month: Date) {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function EventThumbnail({
  event,
  tone,
  variant = "card",
}: {
  event: Event;
  tone: string;
  variant?: "card" | "featured" | "preview";
}) {
  const date = new Date(event.startsAt);
  const day = new Intl.DateTimeFormat("en-UG", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en-UG", { month: "short" }).format(
    date,
  );

  return (
    <span
      className={`event-thumbnail event-thumbnail-${variant} ${tone} ${
        event.thumbnailUrl ? "has-image" : "fallback"
      }`}
    >
      {event.thumbnailUrl && (
        <img src={event.thumbnailUrl} alt="" aria-hidden="true" />
      )}
      <span className="thumbnail-scrim" />
      <span className="thumbnail-frame" />
      <span className="thumbnail-badge">
        <TicketIcon size={variant === "featured" ? 25 : 18} />
        <small>{eventCategory(event)}</small>
      </span>
      {!event.thumbnailUrl && (
        <span className="thumbnail-initials">{initials(event.name)}</span>
      )}
      <span className="thumbnail-date">
        <strong>{day}</strong>
        <small>{month}</small>
      </span>
      <span className="thumbnail-title">
        <strong>{event.name || "New event"}</strong>
        <small>{event.venue || "Venue to be announced"}</small>
      </span>
    </span>
  );
}

export function App({ initialEvents = [] }: { initialEvents?: Event[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(() => initialEvents);
  const [selectedEventId, setSelectedEventId] = useState(
    () => initialEvents[0]?.id ?? "",
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [gateCode, setGateCode] = useState("");
  const [gateResult, setGateResult] = useState<GateResult | null>(null);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [purchaseState, setPurchaseState] = useState("");
  const [scanState, setScanState] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [query, setQuery] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authState, setAuthState] = useState("");
  const [hostEvent, setHostEvent] = useState(emptyHostEvent);
  const [hostThumbnailName, setHostThumbnailName] = useState("");
  const [hostThumbnailFile, setHostThumbnailFile] = useState<{
    fileName: string;
    contentType: string;
  } | null>(null);
  const [hostState, setHostState] = useState("");
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const dateWidgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialEvents.length > 0) return;

    api
      .listEvents()
      .then((data) => {
        setEvents(data);
        setSelectedEventId(data[0]?.id ?? "");
      })
      .catch(() => {
        setEvents(demoEvents);
        setSelectedEventId(demoEvents[0].id);
        setPurchaseState(
          "Demo events loaded. Start the API to issue real tickets.",
        );
      })
      .finally(() => setLoading(false));
  }, [initialEvents.length]);

  useEffect(() => {
    setSession(readSavedSession());
    const savedTheme = readSavedTheme();
    setThemePreference(savedTheme);
    setResolvedTheme(resolveThemePreference(savedTheme));
    setSessionLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionLoaded) return;

    window.localStorage.setItem(THEME_KEY, themePreference);
    setResolvedTheme(resolveThemePreference(themePreference));

    if (themePreference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const updateResolvedTheme = () =>
      setResolvedTheme(media.matches ? "light" : "dark");

    media.addEventListener("change", updateResolvedTheme);
    return () => media.removeEventListener("change", updateResolvedTheme);
  }, [sessionLoaded, themePreference]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionLoaded) return;

    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
      setTicketHistory([]);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    void loadHistory(session.token);
  }, [session, sessionLoaded]);

  useEffect(() => {
    if (!cameraEnabled || !videoRef.current) return;

    let cancelled = false;

    void import("@zxing/browser").then(({ BrowserQRCodeReader }) => {
      if (cancelled || !videoRef.current) return;

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
          setScanState(
            "Camera scanner could not start. You can enter the code manually.",
          );
          setCameraEnabled(false);
        });
    });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [cameraEnabled]);

  useEffect(() => {
    if (pathname === "/admin" || pathname === "/verify") return;
    setCameraEnabled(false);
  }, [pathname]);

  useEffect(() => {
    if (!datePickerOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        dateWidgetRef.current &&
        event.target instanceof Node &&
        !dateWidgetRef.current.contains(event.target)
      ) {
        setDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [datePickerOpen]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const activeStart = dateStart;
    const activeEnd = dateEnd || dateStart;
    const rangeStart = activeStart <= activeEnd ? activeStart : activeEnd;
    const rangeEnd = activeStart <= activeEnd ? activeEnd : activeStart;

    return events.filter((event) => {
      const haystack =
        `${event.name} ${event.description} ${event.venue}`.toLowerCase();
      const matchesQuery = normalizedQuery
        ? haystack.includes(normalizedQuery)
        : true;
      const eventDate = event.startsAt.slice(0, 10);
      const matchesDate = dateStart
        ? eventDate >= rangeStart && eventDate <= rangeEnd
        : true;

      return matchesQuery && matchesDate;
    });
  }, [dateEnd, dateStart, events, query]);

  const visibleCalendarDays = useMemo(
    () => calendarDays(calendarMonth),
    [calendarMonth],
  );

  const calendarMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-UG", {
        month: "long",
        year: "numeric",
      }).format(calendarMonth),
    [calendarMonth],
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  const featuredEvent = filteredEvents[0] ?? events[0];
  const visibleEvents = filteredEvents.length > 0 ? filteredEvents : events;
  const upcomingEvents = visibleEvents.filter(
    (event) => eventStatus(event) === "Upcoming",
  );
  const nextTicketDrop = upcomingEvents[0] ?? visibleEvents[0];
  const isAdmin = session?.user.role === "admin";
  const hostPreviewEvent: Event = {
    id: "host-preview",
    name: hostEvent.name || "Fresh ticket drop",
    description:
      hostEvent.description ||
      "Upload a photo or let Passmint design the thumbnail.",
    venue: hostEvent.venue || "Venue to be announced",
    startsAt: hostEvent.startsAt
      ? new Date(hostEvent.startsAt).toISOString()
      : new Date().toISOString(),
    capacity: hostEvent.capacity,
    priceCents: hostEvent.priceCents,
    thumbnailUrl: hostEvent.thumbnailUrl || null,
  };

  async function loadHistory(token: string) {
    try {
      setTicketHistory(await api.myTickets(token));
    } catch {
      setTicketHistory([]);
    }
  }

  async function buyTickets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPurchaseState("Creating ticket...");

    try {
      const created = await api.buyTickets(
        {
          eventId: selectedEventId,
          buyerName,
          buyerEmail,
          quantity,
        },
        session?.token,
      );
      setTickets(created);
      if (session) {
        await loadHistory(session.token);
      }
      setPurchaseState(
        session
          ? "Ticket purchase complete and saved to your history."
          : "Ticket purchase complete.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ticket purchase failed.";
      setPurchaseState(message);
    }
  }

  async function scan(code = gateCode) {
    const normalized = code.trim();
    if (!normalized) return;

    setScanState("Checking ticket...");
    setGateResult(null);

    if (!session || !isAdmin) {
      setScanState("Admin login required to verify tickets.");
      return;
    }

    try {
      const result = await api.scanTicket(normalized, session.token);
      setGateResult(result);
      setScanState(result.message);
    } catch (error) {
      const fallback = error as Partial<GateResult>;
      setGateResult({
        result: fallback.result ?? "invalid",
        message: fallback.message ?? "Ticket could not be validated.",
        checkedInAt: fallback.checkedInAt,
        ticket: fallback.ticket,
      });
      setScanState(fallback.message ?? "Ticket could not be validated.");
    }
  }

  function chooseEvent(eventId: string) {
    setSelectedEventId(eventId);
    setPurchaseState("");
  }

  function updateHostEvent(
    key: keyof typeof emptyHostEvent,
    value: string | number,
  ) {
    setHostEvent((current) => ({ ...current, [key]: value }));
  }

  function chooseCalendarDate(dateKey: string) {
    if (!dateStart || dateEnd) {
      setDateStart(dateKey);
      setDateEnd("");
      return;
    }

    if (dateKey < dateStart) {
      setDateEnd(dateStart);
      setDateStart(dateKey);
    } else if (dateKey === dateStart) {
      setDateEnd("");
    } else {
      setDateEnd(dateKey);
    }

    setDatePickerOpen(false);
  }

  function selectThumbnail(file: File | null) {
    if (!file) {
      setHostThumbnailName("");
      setHostThumbnailFile(null);
      updateHostEvent("thumbnailUrl", "");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setHostState("Choose an image file for the ticket thumbnail.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateHostEvent("thumbnailUrl", String(reader.result ?? ""));
      setHostThumbnailName(file.name);
      setHostThumbnailFile({
        fileName: file.name,
        contentType: file.type,
      });
      setHostState("");
    };
    reader.onerror = () => {
      setHostState("Thumbnail upload failed. Try a smaller image.");
    };
    reader.readAsDataURL(file);
  }

  async function publishEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) {
      setHostState("Admin login required to publish events.");
      return;
    }

    const adminToken = session?.token;
    if (!adminToken) {
      setHostState("Admin login required to publish events.");
      return;
    }

    setHostState("Publishing event...");

    try {
      let thumbnailUrl = hostEvent.thumbnailUrl || "";

      if (thumbnailUrl.startsWith("data:") && hostThumbnailFile) {
        setHostState("Uploading thumbnail...");
        const upload = await api.uploadEventImage(
          {
            ...hostThumbnailFile,
            dataUrl: thumbnailUrl,
          },
          adminToken,
        );
        thumbnailUrl = upload.url;
      }

      const created = await api.createEvent(
        {
          name: hostEvent.name,
          description: hostEvent.description,
          venue: hostEvent.venue,
          startsAt: new Date(hostEvent.startsAt).toISOString(),
          capacity: hostEvent.capacity,
          priceCents: hostEvent.priceCents,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        },
        adminToken,
      );
      setEvents((current) =>
        [...current, created].sort(
          (left, right) =>
            new Date(left.startsAt).getTime() -
            new Date(right.startsAt).getTime(),
        ),
      );
      setSelectedEventId(created.id);
      setHostEvent(emptyHostEvent);
      setHostThumbnailName("");
      setHostThumbnailFile(null);
      setHostState("Event published with ticket thumbnail ready.");
    } catch (error) {
      const fallback = error as { message?: string };
      setHostState(fallback.message ?? "Event could not be published.");
    }
  }

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    router.push("/account");
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState(
      authMode === "login" ? "Logging in..." : "Creating account...",
    );

    try {
      const nextSession =
        authMode === "login"
          ? await api.login({ email: authEmail, password: authPassword })
          : await api.register({
              name: authName,
              email: authEmail,
              password: authPassword,
            });
      setSession(nextSession);
      setBuyerName(nextSession.user.name);
      setBuyerEmail(nextSession.user.email);
      setAuthPassword("");
      setAuthState(`Logged in as ${nextSession.user.role}.`);
      if (nextSession.user.role === "admin") {
        router.push("/admin");
      }
    } catch (error) {
      const fallback = error as { message?: string };
      setAuthState(fallback.message ?? "Authentication failed.");
    }
  }

  function logout() {
    setSession(null);
    setAuthState("Logged out.");
  }

  const page = pathname === "/verify" ? "/admin" : pathname;

  return (
    <main className={`app-shell theme-${resolvedTheme}`}>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/" aria-label="Passmint home">
            <span className="brand-mark">
              <TicketIcon size={22} />
            </span>
            <span>Passmint</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Discover</Link>
            <Link href="/tickets">Tickets</Link>
          </nav>
          {session ? (
            <div className="header-account">
              <div className="theme-toggle" aria-label="Color theme">
                <button
                  type="button"
                  className={themePreference === "light" ? "selected" : ""}
                  onClick={() => setThemePreference("light")}
                  aria-label="Use light mode"
                  title="Light mode"
                >
                  <Sun size={16} />
                </button>
                <button
                  type="button"
                  className={themePreference === "dark" ? "selected" : ""}
                  onClick={() => setThemePreference("dark")}
                  aria-label="Use dark mode"
                  title="Dark mode"
                >
                  <Moon size={16} />
                </button>
                <button
                  type="button"
                  className={themePreference === "system" ? "selected" : ""}
                  onClick={() => setThemePreference("system")}
                  aria-label="Use system theme"
                  title="System theme"
                >
                  <Monitor size={16} />
                </button>
              </div>
              <Link
                className="account-chip"
                href={isAdmin ? "/admin" : "/account"}
              >
                <span>{initials(session.user.name)}</span>
                <strong>{session.user.name}</strong>
                <small>{isAdmin ? "gate access" : session.user.role}</small>
              </Link>
              <button
                type="button"
                className="icon-button"
                onClick={logout}
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="header-actions">
              <div className="theme-toggle" aria-label="Color theme">
                <button
                  type="button"
                  className={themePreference === "light" ? "selected" : ""}
                  onClick={() => setThemePreference("light")}
                  aria-label="Use light mode"
                  title="Light mode"
                >
                  <Sun size={16} />
                </button>
                <button
                  type="button"
                  className={themePreference === "dark" ? "selected" : ""}
                  onClick={() => setThemePreference("dark")}
                  aria-label="Use dark mode"
                  title="Dark mode"
                >
                  <Moon size={16} />
                </button>
                <button
                  type="button"
                  className={themePreference === "system" ? "selected" : ""}
                  onClick={() => setThemePreference("system")}
                  aria-label="Use system theme"
                  title="System theme"
                >
                  <Monitor size={16} />
                </button>
              </div>
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => openAuth("login")}
              >
                <LogIn size={17} />
                Login
              </button>
              <button
                type="button"
                className="primary-action compact-action"
                onClick={() => openAuth("register")}
              >
                <UserPlus size={17} />
                Sign up
              </button>
            </div>
          )}
        </div>
      </header>

      {page === "/" && (
        <>
          <section className="discovery-bar" aria-label="Event discovery">
            <form
              className="search-panel"
              onSubmit={(event) => event.preventDefault()}
            >
              <label>
                <span>Search</span>
                <div className="input-shell">
                  <Search size={18} />
                  <input
                    aria-label="Search by event or venue"
                    placeholder="Event, venue, artist, team"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span>When</span>
                <div className="date-widget" ref={dateWidgetRef}>
                  <button
                    className={`date-trigger ${dateStart ? "has-value" : ""}`}
                    type="button"
                    aria-expanded={datePickerOpen}
                    aria-haspopup="dialog"
                    onClick={() => setDatePickerOpen((open) => !open)}
                  >
                    <CalendarDays size={18} />
                    <span>{dateFilterLabel(dateStart, dateEnd)}</span>
                    <ChevronDown size={16} />
                  </button>

                  {datePickerOpen && (
                    <div className="date-popover" role="dialog">
                      <div className="calendar-head">
                        <button
                          type="button"
                          aria-label="Previous month"
                          onClick={() =>
                            setCalendarMonth(
                              (current) =>
                                new Date(
                                  current.getFullYear(),
                                  current.getMonth() - 1,
                                  1,
                                ),
                            )
                          }
                        >
                          <ChevronLeft size={17} />
                        </button>
                        <strong>{calendarMonthLabel}</strong>
                        <button
                          type="button"
                          aria-label="Next month"
                          onClick={() =>
                            setCalendarMonth(
                              (current) =>
                                new Date(
                                  current.getFullYear(),
                                  current.getMonth() + 1,
                                  1,
                                ),
                            )
                          }
                        >
                          <ChevronRight size={17} />
                        </button>
                      </div>

                      <div className="calendar-grid" aria-label="Choose date">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                          <span key={`${day}-${index}`}>{day}</span>
                        ))}
                        {visibleCalendarDays.map((date) => {
                          const dateKey = toDateKey(date);
                          const rangeStart =
                            dateStart && dateEnd && dateEnd < dateStart
                              ? dateEnd
                              : dateStart;
                          const rangeEnd =
                            dateStart && dateEnd && dateEnd < dateStart
                              ? dateStart
                              : dateEnd;
                          const isStart = dateKey === dateStart;
                          const isEnd = dateKey === dateEnd;
                          const isInRange =
                            rangeStart &&
                            rangeEnd &&
                            dateKey > rangeStart &&
                            dateKey < rangeEnd;

                          return (
                            <button
                              type="button"
                              key={dateKey}
                              className={[
                                date.getMonth() === calendarMonth.getMonth()
                                  ? ""
                                  : "muted-day",
                                isStart ? "range-start" : "",
                                isEnd ? "range-end" : "",
                                isInRange ? "in-range" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => chooseCalendarDate(dateKey)}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      <div className="date-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setDateStart("");
                            setDateEnd("");
                          }}
                        >
                          <X size={15} />
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </label>
              <button
                className="search-button"
                type="submit"
                aria-label="Search events"
              >
                <Search size={19} />
                Find tickets
              </button>
            </form>

            <div className="category-strip" aria-label="Event categories">
              {categories.map(({ label, query: categoryQuery, icon: Icon }) => (
                <button
                  type="button"
                  key={label}
                  className={query === categoryQuery ? "selected" : ""}
                  onClick={() => setQuery(categoryQuery)}
                >
                  <Icon size={20} />
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
          </section>

          <section
            className="market-layout public-market home-feed"
            aria-label="Ticket marketplace"
          >
            <div className="main-column">
              {featuredEvent && (
                <section className="featured-event hero-ticket">
                  <EventThumbnail
                    event={featuredEvent}
                    tone={eventTone(0)}
                    variant="featured"
                  />
                  <div className="featured-copy">
                    <div className="ticket-badges">
                      <span>{eventStatus(featuredEvent)}</span>
                      <span>
                        {chipDate.format(new Date(featuredEvent.startsAt))}
                      </span>
                    </div>
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
                      <span>
                        <Users size={16} />
                        {featuredEvent.capacity.toLocaleString("en-UG")} spots
                      </span>
                    </div>
                    <Link
                      className="primary-action"
                      href="/tickets"
                      onClick={() => chooseEvent(featuredEvent.id)}
                    >
                      <TicketIcon size={18} />
                      Get tickets
                    </Link>
                  </div>
                </section>
              )}

              <section>
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">Fresh from the platform</p>
                    <h2>Latest ticket drops</h2>
                  </div>
                  <Link href="/tickets">See everything</Link>
                </div>

                {loading ? (
                  <p className="muted">Loading events...</p>
                ) : (
                  <div className="event-grid">
                    {visibleEvents.map((event, index) => (
                      <button
                        className={`event-card ${eventTone(index)} ${event.id === selectedEventId ? "selected" : ""}`}
                        key={event.id}
                        onClick={() => chooseEvent(event.id)}
                        type="button"
                      >
                        <EventThumbnail event={event} tone={eventTone(index)} />
                        <span className="event-card-copy">
                          <span className="event-card-topline">
                            <span>{eventCategory(event)}</span>
                            <span>{eventStatus(event)}</span>
                          </span>
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
                          <span className="event-card-foot">
                            <span className="event-card-price">
                              {money.format(event.priceCents / 100)}
                            </span>
                            <span className="event-card-affordance">
                              <ArrowRight size={16} />
                            </span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {nextTicketDrop && (
                <section className="ticket-cta">
                  <div>
                    <p className="section-kicker">Next ticket to buy</p>
                    <h2>{nextTicketDrop.name}</h2>
                    <div className="ticket-cta-meta">
                      <span>
                        <CalendarDays size={17} />
                        {dateTime.format(new Date(nextTicketDrop.startsAt))}
                      </span>
                      <span>
                        <MapPin size={17} />
                        {nextTicketDrop.venue}
                      </span>
                      <strong>
                        {money.format(nextTicketDrop.priceCents / 100)}
                      </strong>
                    </div>
                  </div>
                  <Link
                    className="primary-action"
                    href="/tickets"
                    onClick={() => chooseEvent(nextTicketDrop.id)}
                  >
                    <TicketIcon size={18} />
                    Reserve spot
                  </Link>
                </section>
              )}
            </div>
          </section>
        </>
      )}

      {page === "/tickets" && (
        <section
          className="page-layout tickets-page"
          aria-label="Ticket checkout"
        >
          <div className="page-intro">
            <p className="section-kicker">Tickets</p>
            <h1>Choose your event and check out.</h1>
            <p>
              Purchase as a guest or sign in first to keep your tickets attached
              to your Passmint account.
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
                      : "Buy now, login when it matters."}
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
                      Login
                    </button>
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => openAuth("register")}
                    >
                      <UserPlus size={17} />
                      Sign up
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
                    <span>
                      {dateTime.format(new Date(selectedEvent.startsAt))}
                    </span>
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
                      onChange={(event) =>
                        setQuantity(Number(event.target.value))
                      }
                      required
                    />
                  </label>
                  <button
                    className="primary-action"
                    type="submit"
                    disabled={!selectedEventId}
                  >
                    <CircleDollarSign size={18} />
                    Buy ticket
                  </button>
                </form>
                <p className="helper-line">
                  Checkout works anonymously. Login first if you want this order
                  saved to your history.
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

              <section className="account-panel" id="account">
                <div className="panel-heading">
                  <Users size={22} />
                  <h2>Account access</h2>
                </div>
                {session ? (
                  <div className="account-summary signed-in-summary">
                    <div className="profile-row">
                      <span className="profile-avatar">
                        {initials(session.user.name)}
                      </span>
                      <div>
                        <strong>{session.user.name}</strong>
                        <span>{session.user.email}</span>
                      </div>
                    </div>
                    <div className="account-stats">
                      <span>
                        <strong>{ticketHistory.length}</strong>
                        saved tickets
                      </span>
                      <span>
                        <strong>{session.user.role}</strong>
                        access
                      </span>
                    </div>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={logout}
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                ) : (
                  <form className="form-grid" onSubmit={submitAuth}>
                    <div
                      className="auth-tabs"
                      role="tablist"
                      aria-label="Account mode"
                    >
                      <button
                        type="button"
                        className={authMode === "login" ? "selected" : ""}
                        onClick={() => setAuthMode("login")}
                      >
                        <LogIn size={16} />
                        Login
                      </button>
                      <button
                        type="button"
                        className={authMode === "register" ? "selected" : ""}
                        onClick={() => setAuthMode("register")}
                      >
                        <UserPlus size={16} />
                        Sign up
                      </button>
                    </div>
                    <p className="helper-line auth-helper">
                      {authMode === "login"
                        ? "Use the same login for buyer history and admin verification."
                        : "Create an account before checkout to keep this and future tickets in one place."}
                    </p>
                    {authMode === "register" && (
                      <label>
                        Name
                        <input
                          value={authName}
                          onChange={(event) => setAuthName(event.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </label>
                    )}
                    <label>
                      Email
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        minLength={8}
                        value={authPassword}
                        onChange={(event) =>
                          setAuthPassword(event.target.value)
                        }
                        placeholder="At least 8 characters"
                        required
                      />
                    </label>
                    <button className="primary-action" type="submit">
                      {authMode === "login" ? "Login" : "Create account"}
                    </button>
                  </form>
                )}
                {authState && <p className="state-line">{authState}</p>}

                {session && (
                  <div className="history-list">
                    <div className="history-heading">
                      <h3>Ticket history</h3>
                      <History size={18} />
                    </div>
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
                )}
              </section>
            </aside>
          </div>
        </section>
      )}

      {page === "/account" && (
        <section className="page-layout account-page">
          <div className="page-intro">
            <p className="section-kicker">Account</p>
            <h1>Your tickets, profile, and access.</h1>
            <p>
              Sign in to save buyer history. Admin users also unlock the
              protected scanning console.
            </p>
          </div>

          <section className="account-panel account-page-panel">
            <div className="panel-heading">
              <Users size={22} />
              <h2>Account access</h2>
            </div>
            {session ? (
              <div className="account-summary signed-in-summary">
                <div className="profile-row">
                  <span className="profile-avatar">
                    {initials(session.user.name)}
                  </span>
                  <div>
                    <strong>{session.user.name}</strong>
                    <span>{session.user.email}</span>
                  </div>
                </div>
                <div className="account-stats">
                  <span>
                    <strong>{ticketHistory.length}</strong>
                    saved tickets
                  </span>
                  <span>
                    <strong>{session.user.role}</strong>
                    access
                  </span>
                </div>
                {isAdmin && (
                  <Link className="primary-action" href="/admin">
                    <ShieldCheck size={17} />
                    Open admin console
                  </Link>
                )}
                <button
                  className="secondary-action"
                  type="button"
                  onClick={logout}
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            ) : (
              <form className="form-grid" onSubmit={submitAuth}>
                <div
                  className="auth-tabs"
                  role="tablist"
                  aria-label="Account mode"
                >
                  <button
                    type="button"
                    className={authMode === "login" ? "selected" : ""}
                    onClick={() => setAuthMode("login")}
                  >
                    <LogIn size={16} />
                    Login
                  </button>
                  <button
                    type="button"
                    className={authMode === "register" ? "selected" : ""}
                    onClick={() => setAuthMode("register")}
                  >
                    <UserPlus size={16} />
                    Sign up
                  </button>
                </div>
                <p className="helper-line auth-helper">
                  {authMode === "login"
                    ? "Use the same login for buyer history and admin verification."
                    : "Create an account before checkout to keep this and future tickets in one place."}
                </p>
                {authMode === "register" && (
                  <label>
                    Name
                    <input
                      value={authName}
                      onChange={(event) => setAuthName(event.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </label>
                )}
                <label>
                  Email
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    minLength={8}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </label>
                <button className="primary-action" type="submit">
                  {authMode === "login" ? "Login" : "Create account"}
                </button>
              </form>
            )}
            {authState && <p className="state-line">{authState}</p>}

            {session && (
              <div className="history-list">
                <div className="history-heading">
                  <h3>Ticket history</h3>
                  <History size={18} />
                </div>
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
            )}
          </section>
        </section>
      )}

      {page === "/admin" && (
        <section className="admin-layout">
          <div className="admin-hero">
            <p className="section-kicker">Admin gate console</p>
            <h1>Scan tickets without slowing the line.</h1>
            <p>
              A dedicated verification surface for event admins and authorised
              users. Admin authentication is required before a QR code can be
              validated.
            </p>
          </div>

          <div className="admin-workbench">
            <section className="event-publisher-panel">
              <div className="panel-heading">
                <ImagePlus size={22} />
                <h2>Publish event</h2>
              </div>
              <div className="thumbnail-preview">
                <EventThumbnail
                  event={hostPreviewEvent}
                  tone="tone-2"
                  variant="preview"
                />
              </div>
              <form className="form-grid" onSubmit={publishEvent}>
                <label>
                  Event name
                  <input
                    value={hostEvent.name}
                    onChange={(event) =>
                      updateHostEvent("name", event.target.value)
                    }
                    placeholder="Kampala rooftop sessions"
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={hostEvent.description}
                    onChange={(event) =>
                      updateHostEvent("description", event.target.value)
                    }
                    placeholder="Short public summary"
                    required
                  />
                </label>
                <label>
                  Venue
                  <input
                    value={hostEvent.venue}
                    onChange={(event) =>
                      updateHostEvent("venue", event.target.value)
                    }
                    placeholder="Venue, city"
                    required
                  />
                </label>
                <div className="split-fields">
                  <label>
                    Starts
                    <input
                      type="datetime-local"
                      value={hostEvent.startsAt}
                      onChange={(event) =>
                        updateHostEvent("startsAt", event.target.value)
                      }
                      required
                    />
                  </label>
                  <label>
                    Capacity
                    <input
                      min={1}
                      type="number"
                      value={hostEvent.capacity}
                      onChange={(event) =>
                        updateHostEvent("capacity", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                </div>
                <label>
                  Price in UGX
                  <input
                    min={0}
                    type="number"
                    value={hostEvent.priceCents / 100}
                    onChange={(event) =>
                      updateHostEvent(
                        "priceCents",
                        Number(event.target.value) * 100,
                      )
                    }
                    required
                  />
                </label>
                <label className="upload-field">
                  <span>Ticket thumbnail photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      selectThumbnail(event.target.files?.[0] ?? null)
                    }
                  />
                  <span>
                    <Upload size={17} />
                    {hostThumbnailName || "Optional image upload"}
                  </span>
                </label>
                {hostEvent.thumbnailUrl && (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => selectThumbnail(null)}
                  >
                    Remove photo
                  </button>
                )}
                <button
                  className="primary-action"
                  type="submit"
                  disabled={!isAdmin}
                >
                  <ImagePlus size={18} />
                  Publish event
                </button>
              </form>
              <p className="helper-line">
                Photos are optional. Without one, Passmint creates a branded
                ticket thumbnail automatically.
              </p>
              {hostState && <p className="state-line">{hostState}</p>}
            </section>

            <section className="gate-panel">
              <div>
                <div className="panel-heading">
                  <ScanLine size={22} />
                  <h2>Verification app</h2>
                </div>
                <p>
                  Admins use this separate gate surface to verify QR tickets.
                  Accepted tickets are marked entered and cannot be reused.
                </p>
                {isAdmin ? (
                  <div className="verifier-access granted">
                    <ShieldCheck size={18} />
                    {session.user.name} has verifier access.
                  </div>
                ) : (
                  <p className="locked-note">
                    Login with an admin account to use ticket verification.
                  </p>
                )}
              </div>
              <div className="scanner-box">
                {cameraEnabled ? (
                  <video ref={videoRef} muted playsInline />
                ) : (
                  <div
                    className={`scanner-placeholder ${isAdmin ? "ready" : "locked"}`}
                  >
                    {isAdmin ? (
                      <ShieldCheck size={54} />
                    ) : (
                      <LockKeyhole size={54} />
                    )}
                    <span>{isAdmin ? "Ready to scan" : "Admin only"}</span>
                  </div>
                )}
              </div>
              <div className="gate-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setCameraEnabled((value) => !value)}
                  disabled={!isAdmin}
                >
                  <ScanLine size={18} />
                  {cameraEnabled ? "Stop camera" : "Start camera"}
                </button>
                <input
                  placeholder="Paste or type ticket code"
                  value={gateCode}
                  onChange={(event) => setGateCode(event.target.value)}
                />
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => void scan()}
                  disabled={!isAdmin}
                >
                  Validate
                </button>
              </div>
              {scanState && <p className="state-line">{scanState}</p>}
              {gateResult && (
                <div className={`gate-result ${gateResult.result}`}>
                  {gateResult.result === "accepted" ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <XCircle size={28} />
                  )}
                  <div>
                    <strong>{gateResult.result.replace("_", " ")}</strong>
                    <span>
                      {gateResult.ticket?.buyerName ?? gateResult.message}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="site-footer-inner">
          <Link className="brand" href="/" aria-label="Passmint home">
            <span className="brand-mark">
              <TicketIcon size={20} />
            </span>
            <span>Passmint</span>
          </Link>
          <p>© {new Date().getFullYear()} Passmint. All rights reserved.</p>
          <nav aria-label="Footer navigation">
            <Link href="/">Discover</Link>
            <Link href="/tickets">Tickets</Link>
            <Link href="/account">Account</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
