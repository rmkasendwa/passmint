'use client';

import {
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Ticket as TicketIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AuthSession } from '../api';
import type { ResolvedTheme, ThemePreference } from '../theme';
import { initials } from '../event-utils';

export function AppShell({
  children,
  isAuthPage = false,
  logout,
  onHostEvents,
  openAuth,
  resolvedTheme,
  session,
  setThemePreference,
  themePreference,
}: {
  children: ReactNode;
  isAuthPage?: boolean;
  logout: () => void;
  onHostEvents: () => void;
  openAuth: (mode: 'login' | 'register') => void;
  resolvedTheme: ResolvedTheme;
  session: AuthSession | null;
  setThemePreference: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
}) {
  const navItemClass =
    'inline-flex min-h-9 items-center justify-center rounded-full border-0 bg-transparent px-3 text-[0.9rem] font-(weight:--weight-semibold) text-(color:--text-muted) hover:bg-(color:--surface-muted) hover:text-(color:--text)';
  const footerClass = `${isAuthPage ? 'mt-0' : 'mt-14'} border-t border-border bg-surface-raised`;

  return (
    <main className={`app-shell theme-${resolvedTheme}`}>
      <header className="sticky top-0 z-30 min-h-16 w-full border-b border-border bg-[color-mix(in_srgb,var(--surface-raised)_92%,transparent)] backdrop-blur-[18px]">
        <div className="mx-auto grid min-h-16 w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] grid-cols-[auto_1fr_auto] items-center gap-5.5 max-[820px]:grid-cols-1 max-[820px]:py-3.5">
          <Link
            className="inline-flex items-center gap-2.25 text-[1.02rem] font-(--weight-bold) text-text"
            href="/"
            aria-label="Passmint home"
          >
            <span className="grid size-7.5 place-items-center rounded-full bg-black text-white">
              <TicketIcon size={22} />
            </span>
            <span>Passmint</span>
          </Link>
          <nav
            className="inline-flex items-center justify-center gap-1 self-center max-[820px]:flex-wrap max-[820px]:justify-start"
            aria-label="Main navigation"
          >
            <Link className={navItemClass} href="/discover">
              Discover
            </Link>
            {session ? (
              <Link className={navItemClass} href="/dashboard">
                Dashboard
              </Link>
            ) : (
              <button
                className={navItemClass}
                type="button"
                onClick={onHostEvents}
              >
                Host
              </button>
            )}
          </nav>
          {session ? (
            <div className="inline-flex items-center justify-self-end gap-2 max-[820px]:w-full max-[820px]:justify-self-stretch">
              <ThemeToggle
                preference={themePreference}
                onChange={setThemePreference}
              />
              <Link
                className="inline-flex min-h-11.5 items-center gap-2.25 rounded-full border border-border bg-surface-muted py-1.25 pl-1.25 pr-2.5 max-[820px]:flex-1"
                href="/dashboard"
              >
                <span className="grid size-8.5 place-items-center rounded-lg bg-[#101010] text-[0.82rem] font-(--weight-bold) text-white">
                  {initials(session.user.name)}
                </span>
                <span className="grid min-w-0 gap-1">
                  <strong className="block max-w-27.5 truncate text-[0.86rem] leading-none text-text">
                    {session.user.name}
                  </strong>
                  <small className="block max-w-27.5 truncate text-[0.72rem] font-(--weight-semibold) uppercase text-accent">
                    Dashboard
                  </small>
                </span>
              </Link>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-muted text-text hover:border-border-strong"
                onClick={logout}
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center justify-self-end gap-2 max-[820px]:w-full max-[820px]:justify-self-stretch">
              <ThemeToggle
                preference={themePreference}
                onChange={setThemePreference}
              />
              <button
                type="button"
                className="inline-flex min-h-9.5 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface-muted px-3.25 text-[0.9rem] font-(--weight-semibold) text-text hover:border-border-strong hover:bg-(--button-bg) hover:text-(--button-text) max-[820px]:flex-1"
                onClick={() => openAuth('login')}
              >
                <LogIn size={16} />
                Sign in
              </button>
            </div>
          )}
        </div>
      </header>
      {children}
      <footer className={footerClass}>
        <div className="mx-auto grid min-h-23 w-[min(var(--content-max),calc(100%-var(--content-gutter)*2))] grid-cols-[auto_1fr_auto] items-center gap-5.5 max-[820px]:grid-cols-1 max-[820px]:justify-items-start max-[820px]:py-6">
          <Link
            className="inline-flex items-center gap-2.25 text-[1.02rem] font-(--weight-bold) text-text"
            href="/"
            aria-label="Passmint home"
          >
            <span className="grid size-7.5 place-items-center rounded-full bg-black text-white">
              <TicketIcon size={20} />
            </span>
            <span>Passmint</span>
          </Link>
          <p className="mb-0 text-center text-[0.88rem] text-text-muted max-[820px]:text-left">
            © {new Date().getFullYear()} Passmint. All rights reserved.
          </p>
          <nav
            className="inline-flex items-center justify-end gap-4 max-[820px]:flex-wrap max-[820px]:justify-start"
            aria-label="Footer navigation"
          >
            <Link
              className="text-[0.88rem] font-(--weight-medium) text-text-muted hover:text-text"
              href="/discover"
            >
              Discover
            </Link>
            <Link
              className="text-[0.88rem] font-(--weight-medium) text-text-muted hover:text-text"
              href="/login"
            >
              Sign in
            </Link>
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
  const buttonClass =
    'inline-grid h-7 w-[30px] place-items-center rounded-full border-0 bg-transparent text-(color:--text-muted) hover:text-(color:--text)';
  const selectedClass =
    'bg-(color:--button-bg) text-(color:--button-text) shadow-[0_6px_14px_rgb(0_0_0/10%)] hover:text-(color:--button-text)';

  return (
    <div
      className="inline-grid min-h-8.5 flex-none grid-cols-[repeat(3,30px)] items-center gap-0.5 rounded-full border border-border bg-surface-muted p-0.5"
      aria-label="Color theme"
    >
      <button
        type="button"
        className={`${buttonClass} ${preference === 'light' ? selectedClass : ''}`}
        onClick={() => onChange('light')}
        aria-label="Use light mode"
        title="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        type="button"
        className={`${buttonClass} ${preference === 'dark' ? selectedClass : ''}`}
        onClick={() => onChange('dark')}
        aria-label="Use dark mode"
        title="Dark mode"
      >
        <Moon size={16} />
      </button>
      <button
        type="button"
        className={`${buttonClass} ${preference === 'system' ? selectedClass : ''}`}
        onClick={() => onChange('system')}
        aria-label="Use system theme"
        title="System theme"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
