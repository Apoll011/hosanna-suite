/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";

import { cn } from "./cn";

export interface GoogleTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

/**
 * Outlined text field — fixed 56px height, 16px+ horizontal inset so the
 * floating label / typed text never sits in the rounded corner.
 */
export const GoogleTextField = React.forwardRef<HTMLInputElement, GoogleTextFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leadingIcon,
      trailingIcon,
      className,
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      type = "text",
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [focused, setFocused] = useState(false);

    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : defaultValue !== undefined
          ? String(defaultValue).length > 0
          : false;

    const floating = focused || hasValue;

    return (
      <div className="w-full text-left">
        <div
          className={cn(
            "relative h-[56px] w-full rounded-xl border bg-transparent transition-[border-color,box-shadow] duration-200",
            error
              ? "border-m3-danger ring-1 ring-m3-danger"
              : focused
                ? "border-m3-primary ring-2 ring-m3-primary/20"
                : "border-m3-border hover:border-m3-primary/40",
            disabled && "opacity-60",
          )}
        >
          {leadingIcon ? (
            <span
              className={cn(
                "pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2",
                error ? "text-m3-danger" : focused ? "text-m3-primary" : "text-m3-secondary",
              )}
            >
              {leadingIcon}
            </span>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            type={type}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onChange={onChange}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            placeholder={label}
            className={cn(
              "absolute inset-0 z-0 h-full w-full rounded-xl bg-transparent text-[15px] leading-normal text-m3-text",
              "outline-none focus:outline-none placeholder:text-transparent",
              leadingIcon ? "pl-11" : "pl-4",
              trailingIcon ? "pr-11" : "pr-4",
              floating ? "pt-4 pb-2" : "py-0",
              className,
            )}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute z-[1] max-w-[calc(100%-2.75rem)] truncate transition-all duration-150 ease-out",
              leadingIcon ? "left-11" : "left-4",
              floating
                ? cn(
                    "top-0 -translate-y-1/2 px-1 text-xs font-semibold leading-none bg-m3-card",
                    error ? "text-m3-danger" : focused ? "text-m3-primary" : "text-m3-secondary",
                  )
                : "top-1/2 -translate-y-1/2 text-[15px] font-normal leading-none text-m3-secondary",
            )}
          >
            {label}
          </label>

          {trailingIcon ? (
            <span className="absolute right-3 top-1/2 z-[1] flex -translate-y-1/2 items-center text-m3-secondary">
              {trailingIcon}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="mt-1.5 ml-1 text-xs text-m3-danger">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 ml-1 text-caption">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

GoogleTextField.displayName = "GoogleTextField";
