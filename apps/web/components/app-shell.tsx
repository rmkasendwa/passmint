"use client";

import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Ticket as TicketIcon,
} from "lucide-react";
import Link from "next/link";
import { AccountPopover } from "./account-popover";
import { SiteFooter } from "./site-footer";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AuthSession } from "../api";
import type { ResolvedTheme, ThemePreference } from "../theme";
import { initials } from "../event-utils";

export function AppShell({
  children,
  logout,
  openAuth,
  resolvedTheme,
  session,
  setThemePreference,
  themePreference,
}: {
  children: ReactNode;
  isAuthPage?: boolean;
  logout: () => void;
  openAuth: (mode: "login" | "register") => void;
  resolvedTheme: ResolvedTheme;
  session: AuthSession | null;
  setThemePreference: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  const links = [
    { href: "/", label: "Discover" },
    { href: "/dashboard/events", label: "Events" },
    { href: "/dashboard/reports", label: "Reports" },
    { href: "/dashboard/check-in", label: "Check-in" },
    { href: "/dashboard/events/new", label: "Create event" },
  ];
  const active = (href: string) =>
    href === "/dashboard/events"
      ? pathname === href ||
        (pathname.startsWith(href + "/") &&
          pathname !== "/dashboard/events/new")
      : pathname === href;
  const publicLinks = [
    { href: "/", label: "Discover events" },
    { href: "/organizers", label: "For organizers" },
    { href: "/help", label: "Help" },
  ];
  const navigationLinks = (session ? links : publicLinks).map(
    ({ href, label }) => (
      <Link
        key={href}
        href={href}
        aria-current={active(href) ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
        className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors ${active(href) ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-muted hover:text-text"}`}
      >
        {label}
      </Link>
    ),
  );

  return (
    <div className={`app-shell theme-${resolvedTheme}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header sticky top-0 z-30 min-h-16 w-full border-b border-border bg-[color-mix(in_srgb,var(--surface-raised)_92%,transparent)] backdrop-blur-[18px]">
        <div className="mx-auto grid min-h-16 w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] grid-cols-[auto_1fr_auto] items-center gap-6">
          <Link className="brand" href="/" aria-label="Passmint home">
            <span className="brand-mark">
              <TicketIcon size={22} />
            </span>
            <span>
              Passmint<span className="brand-dot">.</span>
            </span>
          </Link>
          <nav
            className="hidden items-center gap-1 min-[900px]:flex"
            aria-label="Main navigation"
          >
            {navigationLinks}
          </nav>

          {session ? (
            <div className="col-start-3 flex items-center gap-2 justify-self-end">
              <button
                ref={menuButton}
                type="button"
                aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((value) => !value)}
                className="grid size-11 place-items-center rounded-lg text-text hover:bg-surface-muted min-[900px]:hidden"
              >
                {menuOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
              <AccountPopover
                trigger={
                  <>
                    <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                      {initials(session.user.name)}
                    </span>
                    <span className="max-w-40 truncate text-sm font-medium max-[600px]:hidden">
                      {session.user.name}
                    </span>
                    <ChevronDown size={14} />
                    <span className="sr-only">Account menu</span>
                  </>
                }
              >
                <div>
                  <p className="mb-1 truncate text-sm font-semibold text-text">
                    {session.user.name}
                  </p>
                  <p className="mb-4 truncate text-xs text-text-muted">
                    {session.user.email}
                  </p>
                  <Link
                    href="/dashboard/events"
                    className="mb-3 block text-sm text-text"
                  >
                    Your events
                  </Link>
                  <div className="mb-3 flex items-center justify-between border-y border-border py-3">
                    <span className="text-sm text-text-muted">Appearance</span>
                    <ThemeToggle
                      preference={themePreference}
                      onChange={setThemePreference}
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-h-10 w-full items-center gap-2 text-sm text-text-muted hover:text-text"
                    data-close-popover
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </AccountPopover>
            </div>
          ) : (
            <div className="col-start-3 inline-flex items-center justify-self-end gap-2">
              <button
                ref={menuButton}
                type="button"
                aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((value) => !value)}
                className="mobile-menu-button"
              >
                {menuOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
              <span className="header-theme">
                <ThemeToggle
                  preference={themePreference}
                  onChange={setThemePreference}
                />
              </span>
              <button
                type="button"
                className="inline-flex min-h-9.5 items-center justify-center gap-2 whitespace-nowrap border-0 bg-transparent px-2 text-[0.9rem] font-(--weight-semibold) text-text-muted hover:text-text max-[820px]:flex-1"
                onClick={() => openAuth("login")}
              >
                Sign in
              </button>
            </div>
          )}
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMenuOpen(false);
                menuButton.current?.focus();
              }
            }}
            className="grid gap-1 border-t border-border px-4 py-3 min-[900px]:hidden"
          >
            {navigationLinks}
            {!session && (
              <div className="flex items-center justify-between px-3 py-2 text-sm text-text-muted">
                <span>Appearance</span>
                <ThemeToggle
                  preference={themePreference}
                  onChange={setThemePreference}
                />
              </div>
            )}
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function ThemeToggle({
  preference,
  onChange,
}: {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}) {
  const buttonClass =
    "inline-grid h-8 w-8 place-items-center border-0 bg-transparent text-text-soft hover:text-text";
  const selectedClass =
    "text-text shadow-[inset_0_-2px_0_var(--accent)] hover:text-text";

  return (
    <div
      className="inline-grid min-h-8.5 flex-none grid-cols-[repeat(3,32px)] items-center gap-0.5 border-0 bg-transparent"
      aria-label="Color theme"
    >
      <button
        type="button"
        className={`${buttonClass} ${preference === "light" ? selectedClass : ""}`}
        onClick={() => onChange("light")}
        aria-pressed={preference === "light"}
        aria-label="Use light mode"
        title="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        className={`${buttonClass} ${preference === "dark" ? selectedClass : ""}`}
        onClick={() => onChange("dark")}
        aria-pressed={preference === "dark"}
        aria-label="Use dark mode"
        title="Dark mode"
      >
        <Moon size={16} />
      </button>
      <button
        type="button"
        className={`${buttonClass} ${preference === "system" ? selectedClass : ""}`}
        onClick={() => onChange("system")}
        aria-pressed={preference === "system"}
        aria-label="Use system theme"
        title="System theme"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
