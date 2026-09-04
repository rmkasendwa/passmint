"use client";

import type { IScannerControls } from "@zxing/browser";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Dispatch,
  FormEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import { api, AuthSession, Event, GateResult, Ticket } from "../api";
import { ResolvedTheme, THEME_KEY, ThemePreference } from "../theme";
import { AppShell } from "./app-shell";
import {
  calendarDays,
  demoEvents,
  emptyHostEvent,
  eventStatus,
} from "../event-utils";

type HostEvent = typeof emptyHostEvent;

type AppContextValue = {
  authConfirmPassword: string;
  authEmail: string;
  authMode: "login" | "register";
  authName: string;
  authPassword: string;
  authState: string;
  buyerEmail: string;
  buyerName: string;
  calendarMonth: Date;
  calendarMonthLabel: string;
  cameraEnabled: boolean;
  canPublishEvents: boolean;
  canVerifyTickets: boolean;
  chooseCalendarDate: (dateKey: string) => void;
  chooseEvent: (eventId: string) => void;
  dateEnd: string;
  datePickerOpen: boolean;
  dateStart: string;
  dashboardCapacity: number;
  dashboardEvents: Event[];
  dashboardRevenuePotential: number;
  dashboardUpcomingCount: number;
  featuredEvent?: Event;
  gateCode: string;
  gateResult: GateResult | null;
  hostEvent: HostEvent;
  hostPreviewEvent: Event;
  hostState: string;
  hostThumbnailName: string;
  loading: boolean;
  mobileMoneyNumber: string;
  nextEvent?: Event;
  openAuth: (mode: "login" | "register") => void;
  purchaseState: string;
  publishEvent: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveDraft: () => Promise<void>;
  buyTickets: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  query: string;
  quantity: number;
  resetConfirmPassword: string;
  resetEmail: string;
  resetPassword: string;
  resetState: string;
  scan: (code?: string) => Promise<void>;
  scanState: string;
  selectThumbnail: (file: File | null) => void;
  selectedEvent?: Event;
  selectedEventId: string;
  session: AuthSession | null;
  setAuthConfirmPassword: (value: string) => void;
  setAuthEmail: (value: string) => void;
  setAuthName: (value: string) => void;
  setAuthPassword: (value: string) => void;
  setBuyerEmail: (value: string) => void;
  setBuyerName: (value: string) => void;
  setCalendarMonth: Dispatch<SetStateAction<Date>>;
  setCameraEnabled: Dispatch<SetStateAction<boolean>>;
  setDateEnd: (value: string) => void;
  setDatePickerOpen: Dispatch<SetStateAction<boolean>>;
  setDateStart: (value: string) => void;
  setGateCode: (value: string) => void;
  setMobileMoneyNumber: (value: string) => void;
  setQuery: (value: string) => void;
  setQuantity: (value: number) => void;
  setResetConfirmPassword: (value: string) => void;
  setResetEmail: (value: string) => void;
  setResetPassword: (value: string) => void;
  submitAuth: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitForgotPassword: (event: FormEvent<HTMLFormElement>) => void;
  submitResetPassword: (event: FormEvent<HTMLFormElement>) => void;
  ticketHistory: Ticket[];
  tickets: Ticket[];
  updateHostEvent: (
    key: keyof HostEvent,
    value: string | number | null,
  ) => void;
  videoRef: RefObject<HTMLVideoElement>;
  visibleCalendarDays: Date[];
  visibleEvents: Event[];
};

const SESSION_KEY = "passmint-session";
const AppContext = createContext<AppContextValue | null>(null);

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

function resolveThemePreference(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "dark";

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppContext must be used inside AppProvider");
  return value;
}

export function AppProvider({
  children,
  initialEvents = [],
  initialThemePreference = "dark",
}: {
  children: ReactNode;
  initialEvents?: Event[];
  initialThemePreference?: ThemePreference;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(() => initialEvents);
  const [selectedEventId, setSelectedEventId] = useState(
    () => initialEvents[0]?.id ?? "",
  );
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
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
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    initialThemePreference,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveThemePreference(initialThemePreference),
  );
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authState, setAuthState] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetState, setResetState] = useState("");
  const [hostEvent, setHostEvent] = useState(emptyHostEvent);
  const [hostThumbnailName, setHostThumbnailName] = useState("");
  const [hostThumbnailFile, setHostThumbnailFile] = useState<{
    fileName: string;
    contentType: string;
  } | null>(null);
  const [hostState, setHostState] = useState("");
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

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
    setSessionLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionLoaded) return;

    window.localStorage.setItem(THEME_KEY, themePreference);
    document.cookie = `${THEME_KEY}=${themePreference}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const nextResolvedTheme = resolveThemePreference(themePreference);
    setResolvedTheme(nextResolvedTheme);
    document.documentElement.dataset.theme = nextResolvedTheme;

    if (themePreference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const updateResolvedTheme = () => {
      const systemTheme = media.matches ? "light" : "dark";
      setResolvedTheme(systemTheme);
      document.documentElement.dataset.theme = systemTheme;
    };

    media.addEventListener("change", updateResolvedTheme);
    return () => media.removeEventListener("change", updateResolvedTheme);
  }, [sessionLoaded, themePreference]);

  useEffect(() => {
    if (typeof window === "undefined" || !sessionLoaded) return;

    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
      setTicketHistory([]);
      setHostedEvents([]);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    void loadHistory(session.token);
    void loadHostedEvents(session.token);
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
    if (pathname === "/dashboard") return;
    setCameraEnabled(false);
  }, [pathname]);

  useEffect(() => {
    setAuthState("");
    setResetState("");
  }, [pathname]);

  useEffect(() => {
    if (!sessionLoaded || pathname !== "/dashboard" || session) return;
    router.replace("/login");
  }, [pathname, router, session, sessionLoaded]);

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
  const nextEvent = upcomingEvents[0] ?? visibleEvents[0];
  const authMode = pathname === "/register" ? "register" : "login";
  const isAuthPage = [
    "/forgot-password",
    "/login",
    "/register",
    "/reset-password",
  ].includes(pathname);
  const dashboardEvents = hostedEvents;
  const dashboardUpcomingCount = dashboardEvents.filter(
    (event) => eventStatus(event) === "Upcoming",
  ).length;
  const dashboardCapacity = dashboardEvents.reduce(
    (total, event) => total + (event.capacity ?? 0),
    0,
  );
  const dashboardRevenuePotential = dashboardEvents.reduce(
    (total, event) => total + (event.capacity ?? 0) * event.priceCents,
    0,
  );
  const hostPreviewEvent: Event = {
    id: "host-preview",
    name: hostEvent.name || "Fresh event",
    description:
      hostEvent.description ||
      "Upload a photo or let Passmint design the event artwork.",
    venue: hostEvent.venue || "Venue to be announced",
    mapLocation: hostEvent.mapLocation || null,
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

  async function loadHostedEvents(token: string) {
    try {
      setHostedEvents(await api.myEvents(token));
    } catch {
      setHostedEvents([]);
    }
  }

  async function submitTicketPurchase(confirmAdditional = false) {
    const selected = selectedEvent;
    setPurchaseState(
      selected?.priceCents === 0
        ? "Creating ticket..."
        : "Processing mobile money ticket...",
    );

    const created = await api.buyTickets(
      {
        eventId: selectedEventId,
        buyerName,
        buyerEmail,
        quantity,
        ...(mobileMoneyNumber ? { mobileMoneyNumber } : {}),
        ...(confirmAdditional ? { confirmAdditional: true } : {}),
      },
      session?.token,
    );
    setTickets(created);
    if (session) await loadHistory(session.token);
    setPurchaseState(
      session
        ? "Ticket purchase complete and saved to your history."
        : "Ticket purchase complete. Register to track this and future tickets.",
    );
  }

  async function buyTickets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await submitTicketPurchase();
    } catch (error) {
      const fallback = error as {
        result?: string;
        message?: string;
        existingTicketCount?: number;
        totalAfterPurchase?: number;
      };
      if (fallback.result === "additional_confirmation_required") {
        const confirmed = window.confirm(
          `${fallback.message} This email already has ${fallback.existingTicketCount} ticket(s) for this event. Confirming will bring the total to ${fallback.totalAfterPurchase}.`,
        );

        if (confirmed) {
          try {
            await submitTicketPurchase(true);
            return;
          } catch (confirmedError) {
            const confirmedFallback = confirmedError as { message?: string };
            setPurchaseState(
              confirmedFallback.message ?? "Ticket purchase failed.",
            );
            return;
          }
        }

        setPurchaseState("Additional ticket request cancelled.");
        return;
      }

      const message =
        error instanceof Error ? error.message : "Ticket purchase failed.";
      setPurchaseState(fallback.message ?? message);
    }
  }

  async function scan(code = gateCode) {
    const normalized = code.trim();
    if (!normalized) return;

    setScanState("Checking ticket...");
    setGateResult(null);

    if (!session) {
      setScanState("Login required to verify tickets.");
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
    key: keyof HostEvent,
    value: string | number | null,
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
      setHostState("Choose an image file for the event artwork.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateHostEvent("thumbnailUrl", String(reader.result ?? ""));
      setHostThumbnailName(file.name);
      setHostThumbnailFile({ fileName: file.name, contentType: file.type });
      setHostState("");
    };
    reader.onerror = () =>
      setHostState("Thumbnail upload failed. Try a smaller image.");
    reader.readAsDataURL(file);
  }

  async function publishEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      setHostState("Login required to publish events.");
      return;
    }

    setHostState("Publishing event...");

    try {
      let thumbnailUrl = hostEvent.thumbnailUrl || "";

      if (thumbnailUrl.startsWith("data:") && hostThumbnailFile) {
        setHostState("Uploading event artwork...");
        const upload = await api.uploadEventImage(
          { ...hostThumbnailFile, dataUrl: thumbnailUrl },
          session.token,
        );
        thumbnailUrl = upload.url;
      }

      const created = await api.createEvent(
        {
          name: hostEvent.name,
          description: hostEvent.description,
          venue: hostEvent.venue,
          ...(hostEvent.mapLocation
            ? { mapLocation: hostEvent.mapLocation }
            : {}),
          startsAt: new Date(hostEvent.startsAt).toISOString(),
          capacity: hostEvent.capacity,
          priceCents: hostEvent.priceCents,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        },
        session.token,
      );
      const byStartDate = (left: Event, right: Event) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();

      setEvents((current) => [...current, created].sort(byStartDate));
      setHostedEvents((current) => [...current, created].sort(byStartDate));
      setSelectedEventId(created.id);
      setHostEvent(emptyHostEvent);
      setHostThumbnailName("");
      setHostThumbnailFile(null);
      setHostState("Event published. You can validate tickets for this event.");
    } catch (error) {
      const fallback = error as { message?: string };
      setHostState(fallback.message ?? "Event could not be published.");
    }
  }

  async function saveDraft() {
    if (!session) return;
    setHostState("Saving draft...");
    try {
      let thumbnailUrl = hostEvent.thumbnailUrl;
      if (thumbnailUrl.startsWith("data:") && hostThumbnailFile) {
        thumbnailUrl = (await api.uploadEventImage({ ...hostThumbnailFile, dataUrl: thumbnailUrl }, session.token)).url;
      }
      const created = await api.createDraft({
        ...hostEvent, thumbnailUrl,
        startsAt: hostEvent.startsAt ? new Date(hostEvent.startsAt).toISOString() : undefined,
      }, session.token);
      setHostedEvents(current => [...current, created]);
      setHostEvent(emptyHostEvent);
      setHostThumbnailFile(null);
      setHostThumbnailName("");
      setHostState("Draft saved. Open it from Your events to continue editing.");
    } catch (error) {
      setHostState((error as { message?: string }).message ?? "Unable to save draft.");
    }
  }

  function openAuth(mode: "login" | "register") {
    router.push(mode === "login" ? "/login" : "/register");
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authMode === "register" && authPassword !== authConfirmPassword) {
      setAuthState("Passwords do not match.");
      return;
    }

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
      setAuthConfirmPassword("");
      setAuthState(`Logged in as ${nextSession.user.role}.`);
      router.push("/dashboard");
    } catch (error) {
      const fallback = error as { message?: string };
      setAuthState(fallback.message ?? "Authentication failed.");
    }
  }

  function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetState(
      "If that email matches a Passmint account, a reset link will be sent when email delivery is connected.",
    );
  }

  function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (resetPassword !== resetConfirmPassword) {
      setResetState("Passwords do not match.");
      return;
    }

    setResetState(
      "Password reset is ready for the backend reset-token endpoint.",
    );
  }

  function logout() {
    setSession(null);
    setAuthState("Logged out.");
  }

  const contextValue: AppContextValue = {
    authConfirmPassword,
    authEmail,
    authMode,
    authName,
    authPassword,
    authState,
    buyerEmail,
    buyerName,
    calendarMonth,
    calendarMonthLabel,
    cameraEnabled,
    canPublishEvents: Boolean(session),
    canVerifyTickets: Boolean(session),
    chooseCalendarDate,
    chooseEvent,
    dateEnd,
    datePickerOpen,
    dateStart,
    dashboardCapacity,
    dashboardEvents,
    dashboardRevenuePotential,
    dashboardUpcomingCount,
    featuredEvent,
    gateCode,
    gateResult,
    hostEvent,
    hostPreviewEvent,
    hostState,
    hostThumbnailName,
    loading,
    mobileMoneyNumber,
    nextEvent,
    openAuth,
    purchaseState,
    publishEvent,
    saveDraft,
    buyTickets,
    query,
    quantity,
    resetConfirmPassword,
    resetEmail,
    resetPassword,
    resetState,
    scan,
    scanState,
    selectThumbnail,
    selectedEvent,
    selectedEventId,
    session,
    setAuthConfirmPassword,
    setAuthEmail,
    setAuthName,
    setAuthPassword,
    setBuyerEmail,
    setBuyerName,
    setCalendarMonth,
    setCameraEnabled,
    setDateEnd,
    setDatePickerOpen,
    setDateStart,
    setGateCode,
    setMobileMoneyNumber,
    setQuery,
    setQuantity,
    setResetConfirmPassword,
    setResetEmail,
    setResetPassword,
    submitAuth,
    submitForgotPassword,
    submitResetPassword,
    ticketHistory,
    tickets,
    updateHostEvent,
    videoRef,
    visibleCalendarDays,
    visibleEvents,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AppShell
        isAuthPage={isAuthPage}
        logout={logout}
        openAuth={openAuth}
        resolvedTheme={resolvedTheme}
        session={session}
        setThemePreference={setThemePreference}
        themePreference={themePreference}
      >
        {children}
      </AppShell>
    </AppContext.Provider>
  );
}
