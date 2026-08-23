"use client";

import { QrCode, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "../../components/app-provider";

export default function ResetPasswordPage() {
  const {
    resetConfirmPassword,
    resetPassword,
    resetState,
    setResetConfirmPassword,
    setResetPassword,
    submitResetPassword,
  } = useAppContext();

  return (
    <section className="auth-stage reset-password">
      <AuthMedia />

      <section className="auth-card" aria-label="Account access">
        <div className="auth-heading">
          <p className="section-kicker">New password</p>
          <h1>Choose a new password.</h1>
          <p>
            Use at least eight characters to keep your tickets and host tools
            protected.
          </p>
        </div>

        <AuthBenefits />

        <form className="auth-form" onSubmit={submitResetPassword}>
          <label>
            New password
            <input
              className="auth-input"
              type="password"
              minLength={8}
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirm password
            <input
              className="auth-input"
              type="password"
              minLength={8}
              value={resetConfirmPassword}
              onChange={(event) =>
                setResetConfirmPassword(event.target.value)
              }
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
            />
          </label>
          <button className="primary-action auth-submit" type="submit">
            Reset password
          </button>
        </form>

        {resetState && <p className="state-line auth-state">{resetState}</p>}

        <div className="auth-switch">
          <p>
            Remembered it? <Link href="/login">Back to sign in</Link>
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
