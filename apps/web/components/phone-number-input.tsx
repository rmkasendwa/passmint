"use client";

import { useMemo } from "react";
import type { ChangeEvent } from "react";

type PhoneCountry = {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
  placeholder: string;
};

const COUNTRIES: PhoneCountry[] = [
  {
    code: "UG",
    dialCode: "256",
    flag: "🇺🇬",
    name: "Uganda",
    placeholder: "+256 700 000000",
  },
  {
    code: "KE",
    dialCode: "254",
    flag: "🇰🇪",
    name: "Kenya",
    placeholder: "+254 700 000000",
  },
  {
    code: "TZ",
    dialCode: "255",
    flag: "🇹🇿",
    name: "Tanzania",
    placeholder: "+255 700 000000",
  },
  {
    code: "RW",
    dialCode: "250",
    flag: "🇷🇼",
    name: "Rwanda",
    placeholder: "+250 700 000000",
  },
  {
    code: "BI",
    dialCode: "257",
    flag: "🇧🇮",
    name: "Burundi",
    placeholder: "+257 700 00000",
  },
  {
    code: "SS",
    dialCode: "211",
    flag: "🇸🇸",
    name: "South Sudan",
    placeholder: "+211 900 000000",
  },
  {
    code: "US",
    dialCode: "1",
    flag: "🇺🇸",
    name: "United States",
    placeholder: "+1 555 123 4567",
  },
  {
    code: "GB",
    dialCode: "44",
    flag: "🇬🇧",
    name: "United Kingdom",
    placeholder: "+44 7400 123456",
  },
];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function countryFromValue(value: string) {
  const digits = digitsOnly(value);
  return (
    COUNTRIES.find((country) => digits.startsWith(country.dialCode)) ??
    COUNTRIES[0]
  );
}

function nationalDigits(value: string, country: PhoneCountry) {
  const digits = digitsOnly(value);
  return digits.startsWith(country.dialCode)
    ? digits.slice(country.dialCode.length)
    : digits;
}

function formatNationalNumber(value: string) {
  if (value.length <= 3) return value;
  if (value.length <= 6) return `${value.slice(0, 3)} ${value.slice(3)}`;
  return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 12)}`;
}

function formatPhoneValue(value: string, country: PhoneCountry) {
  if (!value) return "";

  const national = nationalDigits(value, country);
  return `+${country.dialCode}${national ? ` ${formatNationalNumber(national)}` : ""}`;
}

export function PhoneNumberInput({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const selectedCountry = useMemo(() => countryFromValue(value), [value]);
  const formattedValue = formatPhoneValue(value, selectedCountry);

  function updateCountry(event: ChangeEvent<HTMLSelectElement>) {
    const nextCountry =
      COUNTRIES.find((country) => country.code === event.target.value) ??
      COUNTRIES[0];
    const currentNational = nationalDigits(value, selectedCountry);

    onChange(currentNational ? `+${nextCountry.dialCode}${currentNational}` : "");
  }

  function updatePhoneNumber(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value.trim();

    if (!rawValue) {
      onChange("");
      return;
    }

    if (rawValue.startsWith("+")) {
      onChange(`+${digitsOnly(rawValue)}`);
      return;
    }

    onChange(`+${selectedCountry.dialCode}${digitsOnly(rawValue)}`);
  }

  return (
    <label>
      {label}
      <span className="grid min-h-11 grid-cols-[126px_minmax(0,1fr)] overflow-hidden rounded-lg border border-(color:--border) bg-(color:--surface-elevated) focus-within:border-(color:--accent) focus-within:outline-[3px_solid_rgb(22_125_119/18%)] max-[420px]:grid-cols-[112px_minmax(0,1fr)]">
        <span className="relative grid border-r border-(color:--border)">
          <select
            aria-label="Country code"
            className="h-full min-h-11 w-full appearance-none bg-transparent py-0 pl-3 pr-7 text-[0.95rem] font-(weight:--weight-semibold) text-(color:--text) outline-none"
            onChange={updateCountry}
            value={selectedCountry.code}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} +{country.dialCode}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.68rem] text-(color:--text-soft)">
            ▾
          </span>
        </span>
        <input
          autoComplete="tel"
          className="!min-h-11 !rounded-none !border-0 !bg-transparent !px-3 !outline-none focus:!border-0 focus:!outline-none"
          inputMode="tel"
          onChange={updatePhoneNumber}
          placeholder={selectedCountry.placeholder}
          required={required}
          type="tel"
          value={formattedValue}
        />
      </span>
    </label>
  );
}
