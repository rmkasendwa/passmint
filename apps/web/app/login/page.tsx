"use client";

import { QrCode, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "../../components/app-provider";

export default function LoginPage() {
  const {
    authEmail,
    authPassword,
    authState,
    setAuthEmail,
    setAuthPassword,
    submitAuth,
  } = useAppContext();

  return (
    <section className="auth-stage login">
      <AuthMedia />

      <section className="auth-card" aria-label="Account access">
        <div className="auth-heading">
          <p className="section-kicker">Sign in</p>
          <h1>Welcome back.</h1>
          <p>
            Access saved tickets, faster checkout, event publishing, and gate
            verification.
          </p>
        </div>

        <AuthBenefits />

        <form className="auth-form" onSubmit={submitAuth}>
          <label>
            Email
            <input
              className="auth-input"
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              className="auth-input"
              type="password"
              minLength={8}
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="current-password"
              required
            />
          </label>
          <Link className="auth-text-link" href="/forgot-password">
            Forgot password?
          </Link>
          <button className="primary-action auth-submit" type="submit">
            Sign in
          </button>
        </form>

        {authState && <p className="state-line auth-state">{authState}</p>}

        <div className="auth-switch">
          <p>
            New to Passmint? <Link href="/register">Create account</Link>
          </p>
        </div>
      </section>
    </section>
  );
}

function AuthMedia() {
  return (
    <div className="auth-media" aria-hidden="true">
      <img
        src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1800&q=85"
        alt=""
      />
      <div className="auth-event-card">
        <span>Passmint</span>
        <strong>One account for tickets, events, and the door.</strong>
        <small>Checkout, hosting, and gate verification in one place.</small>
      </div>
    </div>
  );
}

function AuthBenefits() {
  return (
    <div className="auth-benefits" aria-label="Account benefits">
      <span>
        <TicketIcon size={15} />
        Saved tickets
      </span>
      <span>
        <ShieldCheck size={15} />
        Host tools
      </span>
      <span>
        <QrCode size={15} />
        Door scan
      </span>
    </div>
  );
}
