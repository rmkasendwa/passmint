"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { FieldMessage, RequiredLabel, getFieldError } from "./form-validation";

type PhoneCountry = {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
  placeholder: string;
  providers?: Partial<Record<MobileMoneyProvider, string>>;
};

type MobileMoneyProvider = "airtel" | "mtn";
type DropdownPosition = {
  maxHeight: number;
  left: number;
  top: number;
  width: number;
};

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
  const inputId = useId();
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    () => countryFromValue(value).code,
  );
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLSpanElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);
  const scrolledToSelectedRef = useRef(false);
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
  const error =
    touched || value
      ? getFieldError({
          label,
          required,
          value,
        })
      : "";
  const placeholder =
    (paymentProvider ? selectedCountry.providers?.[paymentProvider] : null) ??
    selectedCountry.placeholder;

  useEffect(() => {
    if (!hasDialCode(value)) return;

    setSelectedCountryCode(countryFromValue(value).code);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        countryButtonRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
      setQuery("");
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown, true);
    return () =>
      document.removeEventListener(
        "pointerdown",
        closeOnOutsidePointerDown,
        true,
      );
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function updateDropdownPosition(event?: Event) {
      const eventTarget = event?.target as Node | null;
      if (eventTarget && dropdownRef.current?.contains(eventTarget)) return;

      const rect = countryButtonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 16;
      const dropdownGap = 8;
      const preferredHeight = 308;
      const width = Math.min(320, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - width - viewportPadding,
      );
      const spaceBelow =
        window.innerHeight - rect.bottom - dropdownGap - viewportPadding;
      const spaceAbove = rect.top - dropdownGap - viewportPadding;
      const opensAbove =
        spaceBelow < preferredHeight && spaceAbove > spaceBelow;
      const availableHeight = Math.max(
        176,
        Math.min(preferredHeight, opensAbove ? spaceAbove : spaceBelow),
      );
      const top = opensAbove
        ? Math.max(viewportPadding, rect.top - dropdownGap - availableHeight)
        : Math.min(
            rect.bottom + dropdownGap,
            window.innerHeight - availableHeight - viewportPadding,
          );

      setDropdownPosition({
        maxHeight: availableHeight,
        left,
        top,
        width,
      });
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      scrolledToSelectedRef.current = false;
      return;
    }

    if (!dropdownPosition || query || scrolledToSelectedRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      const list = listRef.current;
      const selectedOption = selectedOptionRef.current;
      if (!list || !selectedOption) return;

      list.scrollTop = Math.max(
        0,
        selectedOption.offsetTop - list.offsetTop - 8,
      );
      scrolledToSelectedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [dropdownPosition, open, query, selectedCountryCode]);

  function chooseCountry(country: PhoneCountry) {
    const nextCountry =
      COUNTRIES.find((option) => option.code === country.code) ?? COUNTRIES[0];
    const currentNational = nationalDigits(value, selectedCountry);

    setSelectedCountryCode(nextCountry.code);
    setOpen(false);
    setQuery("");
    onChange(
      currentNational ? `+${nextCountry.dialCode}${currentNational}` : "",
    );
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

  const dropdown =
    open && dropdownPosition && typeof document !== "undefined"
      ? createPortal(
          <>
            <span
              aria-hidden="true"
              className="fixed inset-0 z-[119]"
              onPointerDown={() => {
                setOpen(false);
                setQuery("");
              }}
            />
            <span
              className="fixed z-[120] grid grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden rounded-lg border border-border bg-surface-raised p-2 shadow-[0_18px_44px_rgb(18_24_31/18%)]"
              onWheel={(event) => event.stopPropagation()}
              ref={dropdownRef}
              style={{
                height: dropdownPosition.maxHeight,
                left: dropdownPosition.left,
                top: dropdownPosition.top,
                width: dropdownPosition.width,
              }}
            >
              <span className="grid min-h-10 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-border bg-surface-elevated px-2">
                <Search
                  aria-hidden="true"
                  className="text-text-soft"
                  size={16}
                />
                <input
                  autoComplete="off"
                  className="min-h-10 w-full min-w-0 border-0 bg-transparent px-0 text-[0.94rem] text-text outline-none placeholder:text-text-soft"
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search country"
                  ref={searchRef}
                  value={query}
                />
              </span>
              <span
                className="grid min-h-0 touch-pan-y overflow-y-auto overscroll-contain"
                ref={listRef}
                role="listbox"
              >
                {filteredCountries.map((country) => (
                  <button
                    aria-selected={country.code === selectedCountry.code}
                    className="grid min-h-10 grid-cols-[minmax(0,1fr)_18px] items-center gap-3 rounded-md px-2 text-left text-[0.94rem] font-(--weight-medium) text-text hover:bg-surface-muted"
                    key={country.code}
                    onClick={() => chooseCountry(country)}
                    ref={
                      country.code === selectedCountry.code
                        ? selectedOptionRef
                        : null
                    }
                    role="option"
                    type="button"
                  >
                    <span className="truncate">
                      {country.flag} {country.name}
                    </span>
                    {country.code === selectedCountry.code && (
                      <Check
                        aria-hidden="true"
                        className="text-accent"
                        size={16}
                      />
                    )}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <span className="px-2 py-3 text-[0.92rem] text-text-muted">
                    No countries found
                  </span>
                )}
              </span>
            </span>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <span className="grid gap-[7px] text-[0.82rem] font-(--weight-semibold) text-text-muted">
        <label htmlFor={inputId}>
          {required ? <RequiredLabel>{label}</RequiredLabel> : label}
        </label>
        <span className="grid min-h-11 grid-cols-[158px_minmax(0,1fr)] rounded-lg border border-border bg-surface-elevated focus-within:border-accent focus-within:outline-[3px_solid_rgb(22_125_119/18%)] max-[420px]:grid-cols-[136px_minmax(0,1fr)]">
          <span className="grid border-r border-border">
            <button
              aria-expanded={open}
              aria-haspopup="listbox"
              className="grid h-full min-h-11 grid-cols-[minmax(0,1fr)_16px] items-center gap-2 bg-transparent py-0 pl-3 pr-2 text-left text-[0.95rem] font-(--weight-semibold) text-text outline-none"
              onClick={() => setOpen((current) => !current)}
              ref={countryButtonRef}
              type="button"
            >
              <span className="truncate">
                {selectedCountry.flag} {selectedCountry.name}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`text-text-soft transition-transform ${open ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
          </span>
          <input
            autoComplete="tel"
            className="min-h-11! rounded-none! border-0! bg-transparent! px-3! outline-none! focus:border-0! focus:outline-none!"
            id={inputId}
            inputMode="tel"
            data-validation-label={label}
            onBlur={() => setTouched(true)}
            onChange={(event) => {
              setTouched(true);
              updatePhoneNumber(event);
            }}
            onInvalid={(event) => {
              event.preventDefault();
              setTouched(true);
            }}
            placeholder={placeholder}
            required={required}
            type="tel"
            value={formattedValue}
          />
        </span>
        <FieldMessage error={error} />
      </span>
      {dropdown}
    </>
  );
}
