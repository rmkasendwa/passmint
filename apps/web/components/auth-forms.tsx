"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  type ChangeEventHandler,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAppContext } from "./app-provider";
import {
  RequiredLabel,
  clearCustomValidity,
  requiredField,
  showCustomValidity,
} from "./form-validation";

const formClass = "grid w-full max-w-[430px] gap-4 max-[820px]:max-w-none";
const labelClass =
  "grid gap-[7px] text-[0.82rem] font-(weight:--weight-semibold) text-(color:--text-muted)";
const inputClass =
  "min-h-[52px] w-full min-w-0 rounded-lg border border-(color:--border) bg-(color:--surface-elevated) px-3 text-(color:--text) hover:border-(color:--border-strong) focus:border-(color:--accent) focus:outline-[3px_solid_rgb(22_125_119/18%)] placeholder:text-(color:--text-soft)";
const passwordInputClass = `${inputClass} pr-12`;
const passwordInputWrapClass = "relative block";
const passwordToggleClass =
  "absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-(color:--text-soft) hover:bg-(color:--surface-muted) hover:text-(color:--text) focus:outline-[3px_solid_rgb(22_125_119/18%)]";
const labelRowClass = "flex items-center justify-between gap-3";
const textLinkClass =
  "font-(weight:--weight-semibold) text-(color:--accent) hover:text-(color:--text)";
const submitClass =
  "inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-(color:--button-bg) px-4 font-(weight:--weight-bold) text-(color:--button-text) hover:bg-(color:--accent)";
const stateClass =
  "mb-0 w-full max-w-[430px] rounded-lg bg-(color:--accent-soft) p-3 text-[0.92rem] font-(weight:--weight-medium) text-(color:--accent) max-[820px]:max-w-none";
const switchClass =
  "w-full max-w-[430px] text-[0.96rem] text-(color:--text-muted) max-[820px]:max-w-none [&_a]:font-(weight:--weight-semibold) [&_a]:text-(color:--accent) [&_a:hover]:text-(color:--text) [&_p]:mb-0";
const strengthTrackClass =
  "h-2 overflow-hidden rounded-full bg-(color:--surface-muted)";
const strengthBarClass =
  "block h-full rounded-full transition-[width,background-color]";
const strengthTextClass =
  "flex items-center justify-between gap-3 text-[0.78rem] text-(color:--text-soft)";

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      label: "Enter a password",
      hint: "Use 8+ characters with variety",
      width: "0%",
      color: "transparent",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak",
      hint: "Add length, numbers, or symbols",
      width: "34%",
      color: "#ef4444",
    };
  }

  if (score <= 4) {
    return {
      label: "Good",
      hint: "A little more variety helps",
      width: "68%",
      color: "#f8c868",
    };
  }

  return {
    label: "Strong",
    hint: "Looks solid",
    width: "100%",
    color: "#28c4b5",
  };
}

type PasswordInputProps = {
  autoComplete: string;
  customError?: string;
  id?: string;
  minLength?: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  revealed: boolean;
  required?: boolean;
  setRevealed: (revealed: boolean) => void;
  validationLabel: string;
  value: string;
};

function PasswordInput({
  autoComplete,
  customError,
  id,
  minLength,
  onChange,
  placeholder,
  revealed,
  required,
  setRevealed,
  validationLabel,
  value,
}: PasswordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = revealed ? EyeOff : Eye;
  const label = revealed ? "Hide password" : "Reveal password";

  useEffect(() => {
    inputRef.current?.setCustomValidity(value ? (customError ?? "") : "");
  }, [customError, value]);

  function handleInvalid(event: FormEvent<HTMLInputElement>) {
    if (customError && value) {
      event.currentTarget.setCustomValidity(customError);
      return;
    }

    showCustomValidity(event);
  }

  return (
    <span className={passwordInputWrapClass}>
      <input
        id={id}
        ref={inputRef}
        className={passwordInputClass}
        type={revealed ? "text" : "password"}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        data-validation-label={validationLabel}
        onInput={clearCustomValidity}
        onInvalid={handleInvalid}
        required={required}
      />
      <button
        type="button"
        className={passwordToggleClass}
        onClick={() => setRevealed(!revealed)}
        aria-label={label}
        title={label}
      >
        <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
      </button>
    </span>
  );
}

export function LoginForm() {
  const {
    authEmail,
    authPassword,
    authState,
    setAuthEmail,
    setAuthPassword,
    submitAuth,
  } = useAppContext();
  const [passwordRevealed, setPasswordRevealed] = useState(false);

  return (
    <>
      <form className={formClass} onSubmit={submitAuth}>
        <label className={labelClass}>
          <RequiredLabel>Email</RequiredLabel>
          <input
            className={inputClass}
            type="email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            {...requiredField("Email")}
          />
        </label>
        <label className={labelClass} htmlFor="login-password">
          <span className={labelRowClass}>
            <RequiredLabel>Password</RequiredLabel>
            <Link className={textLinkClass} href="/forgot-password">
              Forgot password?
            </Link>
          </span>
          <PasswordInput
            id="login-password"
            minLength={8}
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="current-password"
            revealed={passwordRevealed}
            setRevealed={setPasswordRevealed}
            validationLabel="Password"
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
    authConfirmPassword,
    authEmail,
    authName,
    authPassword,
    authState,
    setAuthConfirmPassword,
    setAuthEmail,
    setAuthName,
    setAuthPassword,
    submitAuth,
  } = useAppContext();
  const passwordStrength = getPasswordStrength(authPassword);
  const confirmPasswordError =
    authConfirmPassword && authPassword !== authConfirmPassword
      ? "Passwords must match."
      : "";
  const [passwordsRevealed, setPasswordsRevealed] = useState(false);

  return (
    <>
      <form className={formClass} onSubmit={submitAuth}>
        <label className={labelClass}>
          <RequiredLabel>Name</RequiredLabel>
          <input
            className={inputClass}
            value={authName}
            onChange={(event) => setAuthName(event.target.value)}
            placeholder="Full name"
            autoComplete="name"
            {...requiredField("Name")}
          />
        </label>
        <label className={labelClass}>
          <RequiredLabel>Email</RequiredLabel>
          <input
            className={inputClass}
            type="email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            {...requiredField("Email")}
          />
        </label>
        <label className={labelClass}>
          <RequiredLabel>Password</RequiredLabel>
          <PasswordInput
            minLength={8}
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            revealed={passwordsRevealed}
            setRevealed={setPasswordsRevealed}
            validationLabel="Password"
            required
          />
          <span className="grid gap-2" aria-live="polite">
            <span
              className={strengthTrackClass}
              aria-label={`Password strength: ${passwordStrength.label}`}
            >
              <span
                className={strengthBarClass}
                style={{
                  width: passwordStrength.width,
                  backgroundColor: passwordStrength.color,
                }}
              />
            </span>
            <span className={strengthTextClass}>
              <span>{passwordStrength.label}</span>
              <span>{passwordStrength.hint}</span>
            </span>
          </span>
        </label>
        <label className={labelClass}>
          <RequiredLabel>Confirm password</RequiredLabel>
          <PasswordInput
            customError={confirmPasswordError}
            minLength={8}
            value={authConfirmPassword}
            onChange={(event) => setAuthConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            revealed={passwordsRevealed}
            setRevealed={setPasswordsRevealed}
            validationLabel="Confirm password"
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
          <RequiredLabel>Email</RequiredLabel>
          <input
            className={inputClass}
            type="email"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            {...requiredField("Email")}
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
  const confirmPasswordError =
    resetConfirmPassword && resetPassword !== resetConfirmPassword
      ? "Passwords must match."
      : "";
  const [passwordsRevealed, setPasswordsRevealed] = useState(false);

  return (
    <>
      <form className={formClass} onSubmit={submitResetPassword}>
        <label className={labelClass}>
          <RequiredLabel>New password</RequiredLabel>
          <PasswordInput
            minLength={8}
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            revealed={passwordsRevealed}
            setRevealed={setPasswordsRevealed}
            validationLabel="New password"
            required
          />
        </label>
        <label className={labelClass}>
          <RequiredLabel>Confirm password</RequiredLabel>
          <PasswordInput
            customError={confirmPasswordError}
            minLength={8}
            value={resetConfirmPassword}
            onChange={(event) => setResetConfirmPassword(event.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            revealed={passwordsRevealed}
            setRevealed={setPasswordsRevealed}
            validationLabel="Confirm password"
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
