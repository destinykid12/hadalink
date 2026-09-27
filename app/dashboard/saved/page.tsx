"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useDatabase";
import { useSavedListings } from "@/hooks/useListings";
import { ListingCard } from "@/features/listings/ListingCard";
import { useCompareIds } from "@/features/listings/compareStore";
import { CompareBar } from "@/features/listings/CompareBar";

export default function SavedListingsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  const saved = useSavedListings(user?.id ?? "");
  const compareIds = useCompareIds();

  if (!hydrated || !user) return <LoadingState label="Loading saved listings..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Saved listings</h1>
          <p className="mt-1 text-sm text-muted">Your shortlist of equipment and services.</p>
        </div>
        {compareIds.length > 0 ? (
          <Link href="/compare">
            <Button variant="outline" icon="compare">
              Compare {compareIds.length} selected
            </Button>
          </Link>
        ) : null}
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No saved listings yet"
          message="Tap the bookmark icon on any listing to keep it here for later."
          action={
            <Link href="/equipment">
              <Button>Browse equipment</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((listing) => (
            <ListingCard key={listing.id} listing={listing} currentUserId={user.id} />
          ))}
        </div>
      )}

      <CompareBar />
    </div>
  );
}
