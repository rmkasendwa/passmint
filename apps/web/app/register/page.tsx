"use client";

import { QrCode, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "../../components/app-provider";

export default function RegisterPage() {
  const {
    authEmail,
    authName,
    authPassword,
    authState,
    setAuthEmail,
    setAuthName,
    setAuthPassword,
    submitAuth,
  } = useAppContext();

  return (
    <section className="auth-stage register">
      <AuthMedia />

      <section className="auth-card" aria-label="Account access">
        <div className="auth-heading">
          <p className="section-kicker">Create account</p>
          <h1>Create your account.</h1>
          <p>
            Save tickets, publish events, and move guests through the door with
            less friction.
          </p>
        </div>

        <AuthBenefits />

        <form className="auth-form" onSubmit={submitAuth}>
          <label>
            Name
            <input
              className="auth-input"
              value={authName}
              onChange={(event) => setAuthName(event.target.value)}
              placeholder="Full name"
              autoComplete="name"
              required
            />
          </label>
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
              autoComplete="new-password"
              required
            />
          </label>
          <button className="primary-action auth-submit" type="submit">
            Create account
          </button>
        </form>

        {authState && <p className="state-line auth-state">{authState}</p>}

        <div className="auth-switch">
          <p>
            Already on the list? <Link href="/login">Sign in</Link>
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
