"use client";

import { QrCode, ShieldCheck, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePassmint } from "../passmint-app";

export function AuthScreen() {
  const page = usePathname();
  const {
    authEmail,
    authName,
    authPassword,
    authState,
    resetConfirmPassword,
    resetEmail,
    resetPassword,
    resetState,
    setAuthEmail,
    setAuthName,
    setAuthPassword,
    setResetConfirmPassword,
    setResetEmail,
    setResetPassword,
    submitAuth,
    submitForgotPassword,
    submitResetPassword,
  } = usePassmint();

  return (
    <section className={`auth-stage ${page.slice(1)}`}>
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

      <section className="auth-card" aria-label="Account access">
        <div className="auth-heading">
          <p className="section-kicker">
            {page === "/register"
              ? "Create account"
              : page === "/forgot-password"
                ? "Password reset"
                : page === "/reset-password"
                  ? "New password"
                  : "Sign in"}
          </p>
          <h1>
            {page === "/register"
              ? "Create your account."
              : page === "/forgot-password"
                ? "Reset your password."
                : page === "/reset-password"
                  ? "Choose a new password."
                  : "Welcome back."}
          </h1>
          <p>
            {page === "/register"
              ? "Save tickets, publish events, and move guests through the door with less friction."
              : page === "/forgot-password"
                ? "Enter the email you use for Passmint. We will prepare the next step."
                : page === "/reset-password"
                  ? "Use at least eight characters to keep your tickets and host tools protected."
                  : "Access saved tickets, faster checkout, event publishing, and gate verification."}
          </p>
        </div>

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

        {(page === "/login" || page === "/register") && (
          <form className="auth-form" onSubmit={submitAuth}>
            {page === "/register" && (
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
            )}
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
                autoComplete={
                  page === "/register" ? "new-password" : "current-password"
                }
                required
              />
            </label>
            {page === "/login" && (
              <Link className="auth-text-link" href="/forgot-password">
                Forgot password?
              </Link>
            )}
            <button className="primary-action auth-submit" type="submit">
              {page === "/register" ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        {page === "/forgot-password" && (
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
        )}

        {page === "/reset-password" && (
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
        )}

        {(authState || resetState) && (
          <p className="state-line auth-state">
            {page === "/login" || page === "/register" ? authState : resetState}
          </p>
        )}

        <div className="auth-switch">
          {page === "/login" && (
            <p>
              New to Passmint? <Link href="/register">Create account</Link>
            </p>
          )}
          {page === "/register" && (
            <p>
              Already on the list? <Link href="/login">Sign in</Link>
            </p>
          )}
          {(page === "/forgot-password" || page === "/reset-password") && (
            <p>
              Remembered it? <Link href="/login">Back to sign in</Link>
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
