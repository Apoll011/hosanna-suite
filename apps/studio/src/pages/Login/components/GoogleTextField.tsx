/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";

interface GoogleTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const GoogleTextField = React.forwardRef<
  HTMLInputElement,
  GoogleTextFieldProps
>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      className = "",
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);

    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : defaultValue !== undefined
          ? String(defaultValue).length > 0
          : false;

    const isFloating = isFocused || hasValue;

    return (
      <div className="w-full flex flex-col group/field text-left">
        <div
          className={`relative flex items-center min-h-12.5 sm:min-h-13.5 rounded-[var(--radius-md)] border transition-all duration-200 bg-transparent ${
            error
              ? "border-m3-danger ring-1 ring-m3-danger"
              : isFocused
                ? "border-m3-primary ring-2 ring-m3-primary/25"
                : "border-m3-border hover:border-m3-primary/40"
          }`}
        >
          {leadingIcon && (
            <div
              className={`pl-3 pr-1 shrink-0 transition-colors ${
                error
                  ? "text-m3-danger"
                  : isFocused
                    ? "text-m3-primary"
                    : "text-m3-secondary"
              }`}
            >
              {leadingIcon}
            </div>
          )}

          <label
            htmlFor={inputId}
            className={`absolute pointer-events-none transition-all duration-150 ease-out origin-top-left select-none truncate max-w-[calc(100%-2rem)] ${
              leadingIcon ? "left-9" : "left-3"
            } ${
              isFloating
                ? `-top-2.5 px-1.5 text-label bg-m3-card ${
                    error
                      ? "text-m3-danger"
                      : isFocused
                        ? "text-m3-primary"
                        : "text-m3-secondary"
                  }`
                : "top-1/2 -translate-y-1/2 text-sm text-m3-secondary"
            }`}
          >
            {label}
          </label>

          <input
            id={inputId}
            ref={ref}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`w-full h-full bg-transparent px-3.5 py-3 sm:py-3.5 text-sm text-m3-text rounded-[var(--radius-md)] focus:outline-none placeholder-transparent ${className}`}
            {...props}
          />

          {trailingIcon && (
            <div className="pr-3 pl-1 shrink-0">{trailingIcon}</div>
          )}
        </div>

        {error ? (
          <p className="mt-1 ml-1 text-xs text-m3-danger flex items-center gap-1 animate-in fade-in duration-150">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1 ml-1 text-caption">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

GoogleTextField.displayName = "GoogleTextField";
