"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RatingStars } from "@/components/ui/RatingStars";
import { useToast } from "@/components/ui/Toast";
import { CONDITION_LABELS, LISTING_TYPE_LABELS, priceWithUnit } from "@/lib/format";
import type { ListingWithRelations } from "@/types/models";
import { toggleCompare, useCompareIds } from "@/features/listings/compareStore";
import { toggleSaved, isSaved } from "@/services/savedService";

export function ListingCard({
  listing,
  currentUserId,
  showCompare = true,
}: {
  listing: ListingWithRelations;
  currentUserId?: string;
  showCompare?: boolean;
}) {
  const toast = useToast();
  const compareIds = useCompareIds();
  const inCompare = compareIds.includes(listing.id);
  const [saved, setSaved] = useState(() =>
    currentUserId ? isSaved(currentUserId, listing.id) : false,
  );

  const handleSave = () => {
    if (!currentUserId) {
      toast.info("Log in to save listings", "Create a free farmer account to keep your shortlist.");
      return;
    }
    const result = toggleSaved(currentUserId, listing.id);
    if (result.ok) {
      setSaved(result.data);
      toast.success(result.data ? "Listing saved" : "Listing removed from saved");
    }
  };

  const handleCompare = () => {
    const result = toggleCompare(listing.id);
    if (!result.ok) {
      toast.error("Compare list is full", result.message);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <div className="relative h-44 w-full overflow-hidden border-b border-line bg-sand-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.images[0] ?? "/images/farm-scene.jpg"}
          alt={`${listing.title} listed by ${listing.provider.businessName} in ${listing.location}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone={listing.type === "EQUIPMENT" ? "green" : "soft"}>
            {LISTING_TYPE_LABELS[listing.type]}
          </Badge>
          {listing.operatorIncluded ? <Badge tone="blue">Operator included</Badge> : null}
        </div>
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? "Remove from saved listings" : "Save this listing"}
          aria-pressed={saved}
          className="absolute right-3 top-3 rounded-full border border-line bg-white/95 p-2 text-ink-soft hover:text-accent"
        >
          <Icon name="bookmark" size={16} filled={saved} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug text-ink">
            <Link href={`/listings/${listing.id}`} className="hover:text-primary">
              {listing.title}
            </Link>
          </h3>
        </div>

        <p className="mt-1 text-xs text-muted">{listing.category.name}</p>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Icon name="pin" size={14} />
          <span className="truncate">{listing.location}</span>
        </div>

        <div className="mt-2">
          <RatingStars value={listing.rating} count={listing.reviewCount} size={14} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <div>
            <p className="text-lg font-semibold text-ink">{priceWithUnit(listing.price, listing.pricingUnit)}</p>
            <p className="text-xs text-muted">{CONDITION_LABELS[listing.condition]} condition</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Link href={`/providers/${listing.provider.id}`} className="text-xs text-ink-soft hover:text-primary">
            {listing.provider.businessName}
          </Link>
          {listing.provider.verificationStatus === "VERIFIED" ? <VerifiedBadge /> : null}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link href={`/listings/${listing.id}`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth>
              View details
            </Button>
          </Link>
          {showCompare ? (
            <Button
              variant={inCompare ? "secondary" : "ghost"}
              size="sm"
              icon="compare"
              onClick={handleCompare}
              aria-pressed={inCompare}
            >
              {inCompare ? "Added" : "Compare"}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
