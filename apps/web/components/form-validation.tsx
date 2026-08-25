'use client';

import type {
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { useState } from 'react';

type ValidatableElement = HTMLInputElement | HTMLTextAreaElement;
type ValidationRules = {
  customError?: string;
  label: string;
  max?: number;
  min?: number;
  minLength?: number;
  pattern?: RegExp;
  required?: boolean;
  title?: string;
  type?: 'email' | 'url';
  value: string | number;
};
type InputValidationProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'required' | 'minLength' | 'min' | 'max' | 'pattern' | 'title'
> & {
  'data-validation-label': string;
};
type TextareaValidationProps = Pick<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'required' | 'minLength' | 'title'
> & {
  'data-validation-label': string;
};

const messageClass =
  'mb-0 min-h-[1.15rem] text-[0.78rem] font-(weight:--weight-medium) leading-snug text-[#ef4444]';

function stringValue(value: string | number) {
  return String(value ?? '').trim();
}

export function getFieldError({
  customError,
  label,
  max,
  min,
  minLength,
  pattern,
  required,
  title,
  type,
  value,
}: ValidationRules) {
  const normalizedValue = stringValue(value);

  if (required && !normalizedValue) return `${label} is required.`;
  if (!normalizedValue) return '';
  if (customError) return customError;
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    return 'Enter a valid email address.';
  }
  if (type === 'url') {
    try {
      new URL(normalizedValue);
    } catch {
      return 'Enter a valid URL.';
    }
  }
  if (minLength && normalizedValue.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  if (typeof min === 'number' && Number(normalizedValue) < min) {
    return `${label} must be ${min} or more.`;
  }
  if (typeof max === 'number' && Number(normalizedValue) > max) {
    return `${label} must be ${max} or less.`;
  }
  if (pattern && !pattern.test(normalizedValue)) {
    return title ?? `${label} is invalid.`;
  }

  return '';
}

export function requiredField(label: string): InputValidationProps {
  return {
    'data-validation-label': label,
    required: true,
  };
}

export function requiredTextareaField(label: string): TextareaValidationProps {
  return {
    'data-validation-label': label,
    required: true,
  };
}

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children}{' '}
      <span aria-hidden="true" className="text-accent">
        *
      </span>
    </span>
  );
}

export function FieldMessage({ error, id }: { error: string; id?: string }) {
  if (!error) return null;

  return (
    <p aria-live="polite" className={messageClass} id={id}>
      {error}
    </p>
  );
}

export function useInlineFormValidation() {
  const [submitted, setSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(
    () => new Set(),
  );

  function markField(field: ValidatableElement) {
    const label = field.dataset.validationLabel;
    if (!label) return;

    setTouchedFields((current) => {
      if (current.has(label)) return current;
      const next = new Set(current);
      next.add(label);
      return next;
    });
  }

  function fieldError(rules: ValidationRules) {
    if (!submitted && !touchedFields.has(rules.label)) return '';
    return getFieldError(rules);
  }

  function formProps(onSubmit: (event: FormEvent<HTMLFormElement>) => void) {
    return {
      noValidate: true,
      onBlurCapture: (event: FormEvent<HTMLFormElement>) => {
        const target = event.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        ) {
          markField(target);
        }
      },
      onInputCapture: (event: FormEvent<HTMLFormElement>) => {
        const target = event.target;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        ) {
          markField(target);
        }
      },
      onSubmit: (event: FormEvent<HTMLFormElement>) => {
        setSubmitted(true);
        if (!event.currentTarget.checkValidity()) {
          event.preventDefault();
          return;
        }

        onSubmit(event);
      },
    };
  }

  return { fieldError, formProps };
}
