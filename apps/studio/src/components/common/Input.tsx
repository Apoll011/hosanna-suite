/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, helperText, className = "", id, ...props }, ref) => {
      const inputId =
        id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
      const errorId = error && inputId ? `${inputId}-error` : undefined;
      const helperId =
        helperText && !error && inputId ? `${inputId}-helper` : undefined;

      return (
        <div className="w-full flex flex-col gap-1.5">
          {label && (
            <label htmlFor={inputId} className="text-label ml-0.5">
              {label}
            </label>
          )}
          <div className="relative flex items-center group">
            {icon && (
              <div
                className="absolute left-3 pointer-events-none text-m3-secondary group-focus-within:text-m3-primary transition-colors"
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <input
              id={inputId}
              ref={ref}
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId || helperId}
              className={`w-full rounded-[var(--radius-md)] border bg-m3-card text-m3-text text-sm px-3.5 py-2.5 min-h-10 transition-colors placeholder:text-m3-input focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary ${
                icon ? "pl-10" : ""
              } ${
                error
                  ? "border-m3-danger/50 focus:border-m3-danger focus:ring-m3-danger/20"
                  : "border-m3-border hover:border-m3-primary/40"
              } ${className}`}
              {...props}
            />
          </div>
          {error && (
            <span
              id={errorId}
              className="text-xs text-m3-danger font-medium"
              role="alert"
            >
              {error}
            </span>
          )}
          {helperText && !error && (
            <span id={helperId} className="text-caption">
              {helperText}
            </span>
          )}
        </div>
      );
    },
  ),
);

Input.displayName = "Input";
