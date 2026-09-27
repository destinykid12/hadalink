"use client";

import { Button } from "@/components/ui/Button";

export function Pagination({
  page,
  pageCount,
  onChange,
  label = "Pagination",
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label} className="flex items-center justify-center gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        icon="chevron-left"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <span className="px-2 text-sm text-muted" aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <Button
        variant="outline"
        size="sm"
        iconAfter="chevron-right"
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
      >
        Next
      </Button>
    </nav>
  );
}
