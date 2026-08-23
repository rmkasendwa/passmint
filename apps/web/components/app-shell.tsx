"use client";

import {
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Ticket as TicketIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AuthSession } from "../api";
import type { ResolvedTheme, ThemePreference } from "../theme";
import { initials } from "../event-utils";

export function AppShell({
  children,
  logout,
  onHostEvents,
  openAuth,
  resolvedTheme,
  session,
  setThemePreference,
  themePreference,
}: {
  children: ReactNode;
  logout: () => void;
  onHostEvents: () => void;
  openAuth: (mode: "login" | "register") => void;
  resolvedTheme: ResolvedTheme;
  session: AuthSession | null;
  setThemePreference: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
}) {
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
            {session && <Link href="/dashboard">Dashboard</Link>}
          </nav>
          {session ? (
            <div className="header-account">
              <ThemeToggle
                preference={themePreference}
                onChange={setThemePreference}
              />
              <Link className="account-chip" href="/dashboard">
                <span>{initials(session.user.name)}</span>
                <strong>{session.user.name}</strong>
                <small>Dashboard</small>
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
              <ThemeToggle
                preference={themePreference}
                onChange={setThemePreference}
              />
              <button
                type="button"
                className="host-action"
                onClick={onHostEvents}
              >
                Host events
              </button>
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => openAuth("login")}
              >
                <LogIn size={16} />
                Sign in
              </button>
            </div>
          )}
        </div>
      </header>
      {children}
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
            <Link href="/login">Sign in</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function ThemeToggle({
  preference,
  onChange,
}: {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}) {
  return (
    <div className="theme-toggle" aria-label="Color theme">
      <button
        type="button"
        className={preference === "light" ? "selected" : ""}
        onClick={() => onChange("light")}
        aria-label="Use light mode"
        title="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        className={preference === "dark" ? "selected" : ""}
        onClick={() => onChange("dark")}
        aria-label="Use dark mode"
        title="Dark mode"
      >
        <Moon size={16} />
      </button>
      <button
        type="button"
        className={preference === "system" ? "selected" : ""}
        onClick={() => onChange("system")}
        aria-label="Use system theme"
        title="System theme"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
