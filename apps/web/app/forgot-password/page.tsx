"use client";

import { QrCode, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { useAppContext } from "../../components/app-provider";

export default function ForgotPasswordPage() {
  const { resetEmail, resetState, setResetEmail, submitForgotPassword } =
    useAppContext();

  return (
    <section className="auth-stage forgot-password">
      <AuthMedia />

      <section className="auth-card" aria-label="Account access">
        <div className="auth-heading">
          <p className="section-kicker">Password reset</p>
          <h1>Reset your password.</h1>
          <p>
            Enter the email you use for Passmint. We will prepare the next step.
          </p>
        </div>

        <AuthBenefits />

        <form className="auth-form" onSubmit={submitForgotPassword}>
          <label>
            Email
            <input
              className="auth-input"
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <button className="primary-action auth-submit" type="submit">
            Send reset link
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
