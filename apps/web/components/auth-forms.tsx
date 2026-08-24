"use client";

import Link from "next/link";
import { useAppContext } from "./app-provider";

const formClass = "grid w-full max-w-[430px] gap-4 max-[820px]:max-w-none";
const labelClass =
  "grid gap-[7px] text-[0.82rem] font-(weight:--weight-semibold) text-(color:--text-muted)";
const inputClass =
  "min-h-[52px] w-full min-w-0 rounded-lg border border-(color:--border) bg-(color:--surface-elevated) px-3 text-(color:--text) hover:border-(color:--border-strong) focus:border-(color:--accent) focus:outline-[3px_solid_rgb(22_125_119/18%)] placeholder:text-(color:--text-soft)";
const labelRowClass = "flex items-center justify-between gap-3";
const textLinkClass =
  "font-(weight:--weight-semibold) text-(color:--accent) hover:text-(color:--text)";
const submitClass =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(color:--button-bg) px-4 font-(weight:--weight-bold) text-(color:--button-text) hover:bg-(color:--accent)";
const stateClass =
  "mb-0 w-full max-w-[430px] rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent) max-[820px]:max-w-none";
const switchClass =
  "w-full max-w-[430px] text-[0.96rem] text-(color:--text-muted) max-[820px]:max-w-none [&_a]:font-(weight:--weight-semibold) [&_a]:text-(color:--accent) [&_a:hover]:text-(color:--text) [&_p]:mb-0";

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
      <form className={formClass} onSubmit={submitAuth}>
        <label className={labelClass}>
          Email
          <input
            className={inputClass}
            type="email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className={labelClass} htmlFor="login-password">
          <span className={labelRowClass}>
            Password
            <Link className={textLinkClass} href="/forgot-password">
              Forgot password?
            </Link>
          </span>
          <input
            id="login-password"
            className={inputClass}
            type="password"
            minLength={8}
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="current-password"
            required
          />
        </label>
        <button className={submitClass} type="submit">
          Sign in
        </button>
      </form>

      {authState && <p className={stateClass}>{authState}</p>}

      <div className={switchClass}>
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
      <form className={formClass} onSubmit={submitAuth}>
        <label className={labelClass}>
          Name
          <input
            className={inputClass}
            value={authName}
            onChange={(event) => setAuthName(event.target.value)}
            placeholder="Full name"
            autoComplete="name"
            required
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            className={inputClass}
            type="email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className={labelClass}>
          Password
          <input
            className={inputClass}
            type="password"
            minLength={8}
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </label>
        <button className={submitClass} type="submit">
          Create account
        </button>
      </form>

      {authState && <p className={stateClass}>{authState}</p>}

      <div className={switchClass}>
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
      <form className={formClass} onSubmit={submitForgotPassword}>
        <label className={labelClass}>
          Email
          <input
            className={inputClass}
            type="email"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <button className={submitClass} type="submit">
          Send reset link
        </button>
      </form>

      {resetState && <p className={stateClass}>{resetState}</p>}

      <div className={switchClass}>
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
      <form className={formClass} onSubmit={submitResetPassword}>
        <label className={labelClass}>
          New password
          <input
            className={inputClass}
            type="password"
            minLength={8}
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </label>
        <label className={labelClass}>
          Confirm password
          <input
            className={inputClass}
            type="password"
            minLength={8}
            value={resetConfirmPassword}
            onChange={(event) => setResetConfirmPassword(event.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            required
          />
        </label>
        <button className={submitClass} type="submit">
          Reset password
        </button>
      </form>

      {resetState && <p className={stateClass}>{resetState}</p>}

      <div className={switchClass}>
        <p>
          Remembered it? <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </>
  );
}
