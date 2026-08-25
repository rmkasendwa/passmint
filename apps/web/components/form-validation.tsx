"use client";

import type {
  FormEvent,
  FormEventHandler,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type ValidatableField = HTMLInputElement | HTMLTextAreaElement;
type InputValidationProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "onInput" | "onInvalid" | "required"
> & {
  "data-validation-label": string;
};
type TextareaValidationProps = Pick<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onInput" | "onInvalid" | "required"
> & {
  "data-validation-label": string;
};

function labelFor(field: ValidatableField) {
  return field.dataset.validationLabel ?? "This field";
}

function requiredMessage(field: ValidatableField) {
  return `${labelFor(field)} is required.`;
}

function validityMessage(field: ValidatableField) {
  const validity = field.validity;
  const label = labelFor(field);

  if (validity.valueMissing) return requiredMessage(field);
  if (validity.typeMismatch && field instanceof HTMLInputElement) {
    if (field.type === "email") return "Enter a valid email address.";
    if (field.type === "url") return "Enter a valid URL.";
  }
  if (validity.tooShort) {
    return `${label} must be at least ${field.minLength} characters.`;
  }
  if (validity.rangeUnderflow && field instanceof HTMLInputElement) {
    return `${label} must be ${field.min} or more.`;
  }
  if (validity.rangeOverflow && field instanceof HTMLInputElement) {
    return `${label} must be ${field.max} or less.`;
  }
  if (validity.patternMismatch) return field.title || `${label} is invalid.`;

  return "";
}

export function clearCustomValidity(event: FormEvent<ValidatableField>) {
  event.currentTarget.setCustomValidity("");
}

export function showCustomValidity(event: FormEvent<ValidatableField>) {
  const field = event.currentTarget;
  field.setCustomValidity("");
  field.setCustomValidity(validityMessage(field));
}

const inputClearCustomValidity =
  clearCustomValidity as FormEventHandler<HTMLInputElement>;
const inputShowCustomValidity =
  showCustomValidity as FormEventHandler<HTMLInputElement>;
const textareaClearCustomValidity =
  clearCustomValidity as FormEventHandler<HTMLTextAreaElement>;
const textareaShowCustomValidity =
  showCustomValidity as FormEventHandler<HTMLTextAreaElement>;

export function requiredField(label: string): InputValidationProps {
  return {
    "data-validation-label": label,
    onInput: inputClearCustomValidity,
    onInvalid: inputShowCustomValidity,
    required: true,
  };
}

export function requiredTextareaField(label: string): TextareaValidationProps {
  return {
    "data-validation-label": label,
    onInput: textareaClearCustomValidity,
    onInvalid: textareaShowCustomValidity,
    required: true,
  };
}

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children}{" "}
      <span aria-hidden="true" className="text-(color:--accent)">
        *
      </span>
    </span>
  );
}
