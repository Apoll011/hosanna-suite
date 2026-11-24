// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from "react";

export type LanguageCode = "pt" | "en" | "es";

interface LanguageOption {
  code: LanguageCode;
  label: string;
  name: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
  { code: "es", label: "ES", name: "Español" },
];

export function FlagIcon({
  code,
  className = "w-4 h-4",
}: {
  code: LanguageCode;
  className?: string;
}) {
  if (code === "pt") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${className} rounded-full overflow-hidden shrink-0 ring-1 ring-white/25`}
        aria-hidden="true"
      >
        <rect x="0" y="0" width="9.6" height="24" fill="#046A38" />
        <rect x="9.6" y="0" width="14.4" height="24" fill="#DA291C" />
        <circle cx="9.6" cy="12" r="4.1" fill="#FFE900" />
        <path
          d="M7.7 9.8h3.8v2.7c0 1.2-.85 2.1-1.9 2.45-1.05-.35-1.9-1.25-1.9-2.45V9.8z"
          fill="#FFFFFF"
        />
        <path d="M8.8 10.9h1.6v1.45c0 .48-.36.85-.8 1-.44-.15-.8-.52-.8-1V10.9z" fill="#003399" />
      </svg>
    );
  }

  if (code === "en") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${className} rounded-full overflow-hidden shrink-0 ring-1 ring-white/25`}
        aria-hidden="true"
      >
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0L24 24M24 0L0 24" stroke="#FFFFFF" strokeWidth="4.4" />
        <path d="M0 0L24 24M24 0L0 24" stroke="#C8102E" strokeWidth="2.2" />
        <path d="M12 0V24M0 12H24" stroke="#FFFFFF" strokeWidth="6.8" />
        <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="3.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} rounded-full overflow-hidden shrink-0 ring-1 ring-white/25`}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="24" height="6" fill="#AA151B" />
      <rect x="0" y="6" width="24" height="12" fill="#F1BF00" />
      <rect x="0" y="18" width="24" height="6" fill="#AA151B" />
      <rect x="6.5" y="9.2" width="3.4" height="5.1" rx="1.2" fill="#AA151B" />
      <circle cx="8.2" cy="8.7" r="1.2" fill="#F1BF00" stroke="#AA151B" strokeWidth="0.6" />
    </svg>
  );
}

interface LanguageToggleProps {
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  size?: "sm" | "md" | "responsive";
  theme?: "dark" | "light";
}

export default function LanguageToggle({
  language,
  onChangeLanguage,
  size = "md",
  theme = "dark",
}: LanguageToggleProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerSizing =
    size === "sm"
      ? "h-6 pl-1.5 pr-2 gap-1 text-[9px]"
      : size === "responsive"
        ? "h-7 lg:h-8 pl-2 lg:pl-2.5 pr-2.5 lg:pr-3 gap-1.5 lg:gap-2 text-[9.5px] lg:text-[10.5px]"
        : "h-8 pl-2.5 pr-3 gap-2 text-[10.5px]";

  const flagSizing =
    size === "sm"
      ? "w-3 h-3"
      : size === "responsive"
        ? "w-3.25 h-3.25 lg:w-3.75 lg:h-3.75"
        : "w-3.75 h-3.75";

  const chevronSizing =
    size === "sm"
      ? "w-2 h-2"
      : size === "responsive"
        ? "w-2.25 h-2.25 lg:w-2.5 lg:h-2.5"
        : "w-2.5 h-2.5";

  const optionSizing =
    size === "sm"
      ? "h-6 pl-1.5 pr-2 gap-1 text-[9px]"
      : size === "responsive"
        ? "h-6.5 lg:h-7.5 pl-1.5 lg:pl-2 pr-2.5 lg:pr-3 gap-1.5 lg:gap-2 text-[9.5px] lg:text-[10.5px]"
        : "h-7.5 pl-2 pr-3 gap-2 text-[10.5px]";

  const currentOption =
    LANGUAGE_OPTIONS.find((opt) => opt.code === language) ?? LANGUAGE_OPTIONS[0];
  const otherOptions = LANGUAGE_OPTIONS.filter((opt) => opt.code !== language);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentOption.name}`}
        className={`inline-flex items-center rounded-full font-medium uppercase tracking-[0.08em] leading-none whitespace-nowrap shrink-0 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 ${triggerSizing} ${
          theme === "light"
            ? "border border-[#021433]/20 bg-[#021433]/6 hover:bg-[#021433]/12 text-[#021433] focus-visible:ring-[#021433]/60"
            : "border border-white/25 bg-white/8 hover:bg-white/16 text-white focus-visible:ring-white/80"
        }`}
      >
        <FlagIcon code={currentOption.code} className={flagSizing} />
        <span>{currentOption.label}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`${chevronSizing} transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } ${theme === "light" ? "text-[#021433]/60" : "text-white/75"}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className={`absolute right-0 mt-1.5 min-w-full backdrop-blur-md p-1 shadow-xl z-50 flex flex-col gap-0.5 ${
            size === "sm" ? "rounded-[14px]" : "rounded-[18px]"
          } ${
            theme === "light"
              ? "border border-black/10 bg-white/95 text-[#021433]"
              : "border border-white/25 bg-[#040B14]/90 text-white"
          }`}
        >
          {otherOptions.map((opt) => (
            <button
              key={opt.code}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onChangeLanguage(opt.code);
                setOpen(false);
              }}
              className={`inline-flex items-center w-full rounded-full font-medium uppercase tracking-[0.08em] leading-none whitespace-nowrap cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 ${optionSizing} ${
                theme === "light"
                  ? "text-[#021433]/85 hover:text-[#021433] hover:bg-[#021433]/8 focus-visible:ring-[#021433]/50"
                  : "text-white/85 hover:text-white hover:bg-white/15 focus-visible:ring-white/80"
              }`}
            >
              <FlagIcon code={opt.code} className={flagSizing} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
