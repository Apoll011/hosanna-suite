/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from "react";

interface PrintSheetProps {
  children: React.ReactNode;
  /** Optional in-flow footer for the screen preview; print uses @page footers. */
  footer?: React.ReactNode;
  className?: string;
}

/** Sheet unit: with page-breaks on, short sheets pin the footer to the page bottom. */
export const PrintSheet: React.FC<PrintSheetProps> = ({ children, footer, className = "" }) => (
  <article className={`hp-sheet ${className}`.trim()}>
    <div className="hp-sheet-body">{children}</div>
    {footer}
  </article>
);
