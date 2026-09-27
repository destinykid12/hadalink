"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  clearCompare,
  removeCompare,
  useCompareIds,
  COMPARE_LIMIT,
} from "@/features/listings/compareStore";
import { listingRepository } from "@/repositories";

export function CompareBar() {
  const ids = useCompareIds();
  if (ids.length === 0) return null;

  const listings = ids
    .map((id) => listingRepository.findById(id))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));

  return (
    <div className="fixed bottom-16 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 lg:bottom-6">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line-strong bg-white px-4 py-3 shadow-pop">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Icon name="compare" size={16} />
          Compare ({ids.length}/{COMPARE_LIMIT})
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {listings.map((listing) => (
            <span
              key={listing.id}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-sand px-2.5 py-1 text-xs text-ink-soft"
            >
              <span className="max-w-[140px] truncate">{listing.title}</span>
              <button
                type="button"
                aria-label={`Remove ${listing.title} from comparison`}
                onClick={() => removeCompare(listing.id)}
                className="text-muted hover:text-danger"
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            Clear
          </Button>
          <Link href="/compare">
            <Button variant="primary" size="sm" disabled={ids.length < 2}>
              Compare now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
