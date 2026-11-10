/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";

export interface GoogleTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

/**
 * Outlined text field with a static label and native placeholder.
 */
export const GoogleTextField = React.forwardRef<HTMLInputElement, GoogleTextFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      className = "",
      id,
      placeholder,
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

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        <label htmlFor={inputId} className="text-sm font-medium text-m3-text px-0.5">
          {label}
        </label>

        <div
          className={`relative flex items-center min-h-16 rounded-xl border transition-all duration-200 bg-m3-card ${
            error
              ? "border-m3-danger ring-1 ring-m3-danger"
              : isFocused
                ? "border-m3-primary ring-2 ring-m3-primary/25"
                : "border-m3-border hover:border-m3-primary/40"
          }`}
        >
          {leadingIcon ? (
            <div
              className={`pl-3.5 pr-1 shrink-0 transition-colors ${
                error ? "text-m3-danger" : isFocused ? "text-m3-primary" : "text-m3-secondary"
              }`}
            >
              {leadingIcon}
            </div>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            type={type}
            placeholder={placeholder}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`w-full min-h-16 bg-transparent px-4 py-4 text-sm text-m3-text placeholder:text-m3-secondary/70 rounded-xl focus:outline-none ${
              leadingIcon ? "pl-1.5" : ""
            } ${trailingIcon ? "pr-1.5" : ""} ${className}`}
            {...props}
          />

          {trailingIcon ? <div className="pr-3 pl-1 shrink-0">{trailingIcon}</div> : null}
        </div>

        {error ? (
          <p className="ml-0.5 text-xs text-m3-danger">{error}</p>
        ) : helperText ? (
          <p className="ml-0.5 text-caption">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

GoogleTextField.displayName = "GoogleTextField";
