/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PrintBrand, PrintOptions } from "../types";

interface TemplateFooterProps {
  options: PrintOptions;
  brand: PrintBrand;
}

export const PRINT_BRAND_NAME = "Hosanna";

/** Document footer shown in the preview; print uses the matching @page margin box. */
export const TemplateFooter: React.FC<TemplateFooterProps> = ({ options, brand }) => {
  const note = options.customFooter.trim() || brand.churchName;

  return (
    <footer className="hp-footer">
      <div className="hp-footer-left">{note && <span>{note}</span>}</div>
      <span>{PRINT_BRAND_NAME}</span>
    </footer>
  );
};

/** Compact per-song credit line (CCLI / ©) — not a page footer. */
export const SongCredit: React.FC<{ ccli?: string; copyright?: string }> = ({
  ccli,
  copyright,
}) => {
  if (!ccli && !copyright) return null;
  return (
    <div className="hp-song-credit">
      {ccli && <span>CCLI {ccli}</span>}
      {copyright && <span>© {copyright}</span>}
    </div>
  );
};

/** Text used for the repeating @page footer when printing. */
export function printFooterNote(options: PrintOptions, brand: PrintBrand): string {
  return options.customFooter.trim() || brand.churchName || "";
}
