"use client";

import Link from "next/link";
import { useAppContext } from "./app-provider";

export function LoginForm() {
  const {
    authEmail,
    authPassword,
    authState,
    setAuthEmail,
    setAuthPassword,
    submitAuth,
  } = useAppContext();

  return (
    <>
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
    </>
  );
}

export function RegisterForm() {
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
    <>
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
    </>
  );
}

export function ForgotPasswordForm() {
  const { resetEmail, resetState, setResetEmail, submitForgotPassword } =
    useAppContext();

  return (
    <>
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
    </>
  );
}

export function ResetPasswordForm() {
  const {
    resetConfirmPassword,
    resetPassword,
    resetState,
    setResetConfirmPassword,
    setResetPassword,
    submitResetPassword,
  } = useAppContext();

  return (
    <>
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
            onChange={(event) => setResetConfirmPassword(event.target.value)}
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
    </>
  );
}
