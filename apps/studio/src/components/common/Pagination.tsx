/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  total?: number;
  limit?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  total,
  limit,
}) => {
  if (totalPages <= 1) return null;

  const from =
    total !== undefined && limit !== undefined ? (page - 1) * limit + 1 : null;
  const to =
    total !== undefined && limit !== undefined
      ? Math.min(page * limit, total)
      : null;

  return (
    <nav
      className="flex items-center justify-between gap-4 px-4 py-3 bg-m3-card border-t border-m3-border text-caption"
      aria-label="Pagination"
    >
      <div className="text-m3-secondary tabular-nums min-w-0 truncate">
        {from !== null && to !== null && total !== undefined ? (
          <span>
            {from}–{to} / {total}
          </span>
        ) : (
          <span>
            {page} / {totalPages}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="min-h-9 min-w-9"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
        <span className="px-2 font-semibold text-m3-text tabular-nums text-xs">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="min-h-9 min-w-9"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};
