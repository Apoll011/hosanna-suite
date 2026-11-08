/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Spinner } from "./Spinner";
import { TablePagination, type TablePaginationProps } from "./TablePagination";

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
   * Fixed column header above the vertical scroll region.
   * Stays visible while rows scroll; vertical scrollbar starts below it.
   */
  header?: React.ReactNode;
  /** Extra classes for the vertical scroll body wrapper. */
  bodyClassName?: string;
}

/**
 * Full-height table shell: card fills available space, body scrolls
 * vertically under a pinned header, pagination stays at the bottom.
 * Horizontal overflow is shared by header + body so columns stay aligned.
 */
export const Table: React.FC<TableProps> = ({
  pagination,
  isLoading = false,
  loadingLabel,
  error,
  empty,
  header,
  bodyClassName = "",
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-m3-card border border-m3-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 transition-colors ${className}`}
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
        <div className="flex-1 min-h-0 overflow-x-auto flex flex-col">
          {header != null && <div className="shrink-0">{header}</div>}
          <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${bodyClassName}`}>
            {children}
          </div>
        </div>
      )}

      {pagination && !isLoading && error == null && <TablePagination {...pagination} />}
    </div>
  );
};
