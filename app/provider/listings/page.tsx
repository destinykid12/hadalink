"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useHydration, useDatabase } from "@/hooks/useDatabase";
import { useProviderListings } from "@/hooks/useListings";
import { getProviderProfile } from "@/services/profileService";
import { deleteListing, setListingStatus } from "@/services/listingService";
import { formatNaira, PRICING_UNIT_LABELS, LISTING_TYPE_LABELS } from "@/lib/format";
import type { ListingWithRelations } from "@/types/models";

export default function ProviderListingsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const listings = useProviderListings(provider?.id ?? "");
  const [pendingDelete, setPendingDelete] = useState<ListingWithRelations | null>(null);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <LoadingState label="Loading listings..." />;

  const onToggle = (listing: ListingWithRelations) => {
    const next = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const result = setListingStatus(listing.id, next);
    if (result.ok) {
      toast.success(
        next === "ACTIVE" ? "Listing enabled" : "Listing disabled",
        next === "ACTIVE"
          ? "Your listing is visible in farmer search results."
          : "Your listing is hidden from farmer search results.",
      );
    } else {
      toast.error("Could not update listing", result.error);
    }
  };

  const onDelete = () => {
    if (!pendingDelete) return;
    setBusy(true);
    const result = deleteListing(pendingDelete.id);
    setBusy(false);
    setPendingDelete(null);
    if (!result.ok) {
      toast.error("Could not delete listing", result.error);
      return;
    }
    toast.success("Listing deleted", "The listing and its saved references were removed.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">My listings</h1>
          <p className="mt-1 text-sm text-muted">
            Create, edit, enable, disable, or remove your equipment and service listings.
          </p>
        </div>
        <Link href="/provider/listings/new">
          <Button icon="plus">Add listing</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon="tractor"
          title="No listings yet"
          message="Create your first listing to appear in farmer search results."
          action={
            <Link href="/provider/listings/new">
              <Button>Add listing</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} padded={false}>
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={listing.images[0] ?? "/images/farm-scene.jpg"}
                  alt=""
                  className="h-24 w-full rounded-md border border-line object-cover sm:w-36"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={listing.type === "EQUIPMENT" ? "green" : "soft"}>
                      {LISTING_TYPE_LABELS[listing.type]}
                    </Badge>
                    <Badge tone={listing.status === "ACTIVE" ? "green" : "neutral"}>
                      {listing.status === "ACTIVE" ? "Active" : "Disabled"}
                    </Badge>
                    <span className="text-xs text-muted">{listing.category.name}</span>
                  </div>
                  <h2 className="mt-1.5 text-base font-semibold text-ink">
                    <Link href={`/listings/${listing.id}`} className="hover:text-primary">
                      {listing.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {formatNaira(listing.price)} | {PRICING_UNIT_LABELS[listing.pricingUnit]} |{" "}
                    {listing.location}
                  </p>
                  <p className="text-xs text-muted">
                    Rating {listing.rating > 0 ? listing.rating.toFixed(1) : "No ratings"} (
                    {listing.reviewCount} reviews) | {listing.bookedDates.length} dates booked
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-col">
                  <Link href={`/provider/listings/${listing.id}/edit`}>
                    <Button variant="outline" size="sm" icon="edit" fullWidth>
                      Edit
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => onToggle(listing)}>
                    {listing.status === "ACTIVE" ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="danger" size="sm" icon="trash" onClick={() => setPendingDelete(listing)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this listing?"
        message={`"${pendingDelete?.title ?? ""}" will be removed from search results and from every farmer's saved list. This cannot be undone.`}
        confirmLabel="Delete listing"
        danger
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
