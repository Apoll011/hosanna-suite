/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Spinner } from "./Spinner";
import {
  TablePagination,
  type TablePaginationProps,
} from "./TablePagination";

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pinned footer pagination. Omitted when not needed. */
  pagination?: TablePaginationProps;
  isLoading?: boolean;
  loadingLabel?: string;
  /** Replaces the body when set (e.g. error message). */
  error?: React.ReactNode;
  /** Replaces the body when set (e.g. EmptyState). */
  empty?: React.ReactNode;
  /**
   * Optional fixed header above the scroll region (column labels for
   * non-<table> layouts). Stays visible while body content scrolls.
   */
  header?: React.ReactNode;
  /** Extra classes for the scrollable body wrapper. */
  bodyClassName?: string;
  /**
   * When true, sticky-pins native `<thead th>` cells inside the scroll body
   * (song-library style HTML tables).
   */
  stickyHeader?: boolean;
}

/**
 * Full-height table shell: card fills available space, body scrolls,
 * pagination stays pinned at the bottom.
 */
export const Table: React.FC<TableProps> = ({
  pagination,
  isLoading = false,
  loadingLabel,
  error,
  empty,
  header,
  bodyClassName = "",
  stickyHeader = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-m3-card border border-m3-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden flex flex-col flex-1 min-h-0 transition-colors ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-12 min-h-64">
          <Spinner label={loadingLabel} />
        </div>
      ) : error != null ? (
        <div className="flex-1 flex items-center justify-center p-12 text-center text-m3-danger font-bold">
          {error}
        </div>
      ) : empty != null ? (
        <div className="flex-1 overflow-y-auto min-h-0 p-8">{empty}</div>
      ) : (
        <>
          {header}
          <div
            className={`flex-1 min-h-0 overflow-auto ${
              stickyHeader
                ? "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-m3-sidebar/95 [&_thead_th]:backdrop-blur-sm"
                : ""
            } ${bodyClassName}`}
          >
            {children}
          </div>
        </>
      )}

      {pagination && !isLoading && error == null && (
        <TablePagination {...pagination} />
      )}
    </div>
  );
};
