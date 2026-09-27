"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/features/listings/ListingCard";
import { SearchPanel } from "@/features/listings/SearchPanel";
import { CompareBar } from "@/features/listings/CompareBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { StorageHealthNotice } from "@/components/layout/StorageHealthNotice";
import { useListingSearch } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useDatabase";
import type { ListingSearchFilters, ListingType } from "@/types/models";
import Link from "next/link";

const PAGE_SIZE = 6;

export function ListingBrowser({
  initialFilters,
  lockType,
  emptyMessage,
}: {
  initialFilters?: ListingSearchFilters;
  lockType?: ListingType;
  emptyMessage: string;
}) {
  const hydrated = useHydration();
  const { user } = useAuth();
  const { filters, setFilters, results } = useListingSearch({
    type: lockType ?? "ALL",
    ...initialFilters,
  });
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visible = useMemo(
    () => results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [results, page],
  );

  if (!hydrated) return <LoadingState label="Loading listings..." />;

  return (
    <div className="space-y-6">
      <StorageHealthNotice />
      <SearchPanel
        filters={filters}
        resultCount={results.length}
        lockType={lockType}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {results.length === 0 ? (
        <EmptyState
          icon="search"
          title="No listings found"
          message={emptyMessage}
          action={
            <Button
              variant="outline"
              onClick={() => setFilters({ type: lockType ?? "ALL", query: "" })}
            >
              Clear search and filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((listing) => (
              <ListingCard key={listing.id} listing={listing} currentUserId={user?.id} />
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Listing results pages" />
        </>
      )}

      <CompareBar />

      {!user ? (
        <p className="text-center text-sm text-muted">
          Want to save listings and make bookings?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create a free account
          </Link>
        </p>
      ) : null}
    </div>
  );
}
