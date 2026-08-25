"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

type PhoneCountry = {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
  placeholder: string;
  providers?: Partial<Record<MobileMoneyProvider, string>>;
};

type MobileMoneyProvider = "airtel" | "mtn";

const COUNTRIES: PhoneCountry[] = [
  {
    code: "UG",
    dialCode: "256",
    flag: "🇺🇬",
    name: "Uganda",
    placeholder: "+256 700 000000",
    providers: {
      airtel: "+256 759 000000",
      mtn: "+256 773 000000",
    },
  },
  {
    code: "KE",
    dialCode: "254",
    flag: "🇰🇪",
    name: "Kenya",
    placeholder: "+254 700 000000",
    providers: {
      airtel: "+254 733 000000",
      mtn: "+254 789 000000",
    },
  },
  {
    code: "TZ",
    dialCode: "255",
    flag: "🇹🇿",
    name: "Tanzania",
    placeholder: "+255 700 000000",
    providers: {
      airtel: "+255 784 000000",
      mtn: "+255 670 000000",
    },
  },
  {
    code: "RW",
    dialCode: "250",
    flag: "🇷🇼",
    name: "Rwanda",
    placeholder: "+250 700 000000",
    providers: {
      airtel: "+250 730 000000",
      mtn: "+250 780 000000",
    },
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

function hasDialCode(value: string) {
  const digits = digitsOnly(value);
  return COUNTRIES.some((country) => digits.startsWith(country.dialCode));
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
  paymentProvider,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  paymentProvider?: MobileMoneyProvider;
  required?: boolean;
  value: string;
}) {
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    () => countryFromValue(value).code,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLSpanElement>(null);
  const selectedCountry = useMemo(
    () =>
      COUNTRIES.find((country) => country.code === selectedCountryCode) ??
      COUNTRIES[0],
    [selectedCountryCode],
  );
  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return COUNTRIES;

    return COUNTRIES.filter((country) => {
      return (
        country.name.toLowerCase().includes(normalizedQuery) ||
        country.code.toLowerCase().includes(normalizedQuery) ||
        country.dialCode.includes(normalizedQuery.replace("+", ""))
      );
    });
  }, [query]);
  const formattedValue = formatPhoneValue(value, selectedCountry);
  const placeholder =
    (paymentProvider ? selectedCountry.providers?.[paymentProvider] : null) ??
    selectedCountry.placeholder;

  useEffect(() => {
    if (!hasDialCode(value)) return;

    setSelectedCountryCode(countryFromValue(value).code);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  function chooseCountry(country: PhoneCountry) {
    const nextCountry =
      COUNTRIES.find((option) => option.code === country.code) ?? COUNTRIES[0];
    const currentNational = nationalDigits(value, selectedCountry);

    setSelectedCountryCode(nextCountry.code);
    setOpen(false);
    setQuery("");
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

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();
    if (filteredCountries[0]) chooseCountry(filteredCountries[0]);
  }

  return (
    <label>
      {label}
      <span className="grid min-h-11 grid-cols-[158px_minmax(0,1fr)] rounded-lg border border-(color:--border) bg-(color:--surface-elevated) focus-within:border-(color:--accent) focus-within:outline-[3px_solid_rgb(22_125_119/18%)] max-[420px]:grid-cols-[136px_minmax(0,1fr)]">
        <span
          className="relative grid border-r border-(color:--border)"
          ref={dropdownRef}
        >
          <button
            aria-expanded={open}
            aria-haspopup="listbox"
            className="grid h-full min-h-11 grid-cols-[minmax(0,1fr)_16px] items-center gap-2 bg-transparent py-0 pl-3 pr-2 text-left text-[0.95rem] font-(weight:--weight-semibold) text-(color:--text) outline-none"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span className="truncate">
              {selectedCountry.flag} {selectedCountry.name}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`text-(color:--text-soft) transition-transform ${open ? "rotate-180" : ""}`}
              size={16}
            />
          </button>
          {open && (
            <span className="absolute left-0 top-[calc(100%+8px)] z-30 grid w-[min(320px,calc(100vw-32px))] gap-2 rounded-lg border border-(color:--border) bg-(color:--surface-raised) p-2 shadow-[0_18px_44px_rgb(18_24_31/18%)]">
              <span className="grid min-h-10 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-(color:--border) bg-(color:--surface-elevated) px-2">
                <Search
                  aria-hidden="true"
                  className="text-(color:--text-soft)"
                  size={16}
                />
                <input
                  autoComplete="off"
                  className="!min-h-10 !rounded-none !border-0 !bg-transparent !px-0 !text-[0.94rem] !outline-none focus:!border-0 focus:!outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search country"
                  value={query}
                />
              </span>
              <span
                className="grid max-h-[240px] overflow-y-auto"
                role="listbox"
              >
                {filteredCountries.map((country) => (
                  <button
                    aria-selected={country.code === selectedCountry.code}
                    className="grid min-h-10 grid-cols-[minmax(0,1fr)_18px] items-center gap-3 rounded-md px-2 text-left text-[0.94rem] font-(weight:--weight-medium) text-(color:--text) hover:bg-(color:--surface-muted)"
                    key={country.code}
                    onClick={() => chooseCountry(country)}
                    role="option"
                    type="button"
                  >
                    <span className="truncate">
                      {country.flag} {country.name}
                    </span>
                    {country.code === selectedCountry.code && (
                      <Check
                        aria-hidden="true"
                        className="text-(color:--accent)"
                        size={16}
                      />
                    )}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <span className="px-2 py-3 text-[0.92rem] text-(color:--text-muted)">
                    No countries found
                  </span>
                )}
              </span>
            </span>
          )}
        </span>
        <input
          autoComplete="tel"
          className="!min-h-11 !rounded-none !border-0 !bg-transparent !px-3 !outline-none focus:!border-0 focus:!outline-none"
          inputMode="tel"
          onChange={updatePhoneNumber}
          placeholder={placeholder}
          required={required}
          type="tel"
          value={formattedValue}
        />
      </span>
    </label>
  );
}
