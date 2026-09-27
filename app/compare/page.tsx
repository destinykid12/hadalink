"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Badge, VerificationBadge, VerifiedBadge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { Icon } from "@/components/ui/Icon";
import {
  clearCompare,
  removeCompare,
  useCompareIds,
  COMPARE_LIMIT,
} from "@/features/listings/compareStore";
import { getListingWithRelations } from "@/services/listingService";
import {
  CONDITION_LABELS,
  LISTING_TYPE_LABELS,
  PRICING_UNIT_LABELS,
  formatNaira,
} from "@/lib/format";

const ROWS: { label: string; render: (id: string) => React.ReactNode }[] = [
  {
    label: "Equipment or service",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing?.images[0] ?? "/images/farm-scene.jpg"}
            alt=""
            className="h-12 w-16 rounded-md border border-line object-cover"
          />
          <div>
            <Link href={`/listings/${id}`} className="text-sm font-semibold text-ink hover:text-primary">
              {listing?.title ?? "Unknown listing"}
            </Link>
            <p className="text-xs text-muted">{listing ? LISTING_TYPE_LABELS[listing.type] : ""}</p>
          </div>
        </div>
      );
    },
  },
  {
    label: "Provider",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return (
        <div>
          <Link href={`/providers/${listing?.provider.id ?? ""}`} className="text-sm text-ink hover:text-primary">
            {listing?.provider.businessName ?? "Unknown"}
          </Link>
          <div className="mt-1">
            {listing?.provider.verificationStatus === "VERIFIED" ? (
              <VerifiedBadge />
            ) : (
              <VerificationBadge status={listing?.provider.verificationStatus ?? "UNSUBMITTED"} />
            )}
          </div>
        </div>
      );
    },
  },
  {
    label: "Location",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return <span className="text-sm text-ink-soft">{listing?.location ?? "-"}</span>;
    },
  },
  {
    label: "Price",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return (
        <div>
          <p className="text-sm font-semibold text-ink">{listing ? formatNaira(listing.price) : "-"}</p>
          <p className="text-xs text-muted">{listing ? PRICING_UNIT_LABELS[listing.pricingUnit] : ""}</p>
        </div>
      );
    },
  },
  {
    label: "Availability",
    render: (id) => {
      const listing = getListingWithRelations(id);
      if (!listing) return <span>-</span>;
      const blocked = listing.bookedDates.length + listing.unavailableDates.length;
      return (
        <span className="text-sm text-ink-soft">
          {blocked === 0 ? "Most dates open" : `${blocked} date${blocked === 1 ? "" : "s"} blocked`}
        </span>
      );
    },
  },
  {
    label: "Operator",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return (
        <Badge tone={listing?.operatorIncluded ? "green" : "neutral"}>
          {listing?.operatorIncluded ? "Included" : "Not included"}
        </Badge>
      );
    },
  },
  {
    label: "Rating",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return listing ? (
        <RatingStars value={listing.rating} count={listing.reviewCount} size={13} />
      ) : (
        <span>-</span>
      );
    },
  },
  {
    label: "Condition",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return (
        <span className="text-sm text-ink-soft">
          {listing ? CONDITION_LABELS[listing.condition] : "-"}
        </span>
      );
    },
  },
  {
    label: "Description",
    render: (id) => {
      const listing = getListingWithRelations(id);
      return (
        <p className="line-clamp-4 text-xs leading-relaxed text-muted">
          {listing?.description ?? "-"}
        </p>
      );
    },
  },
];

function CompareContent() {
  const ids = useCompareIds();
  const [, setTick] = useState(0);

  if (ids.length === 0) {
    return (
      <EmptyState
        icon="compare"
        title="Nothing to compare yet"
        message="Add listings to your compare list from the search pages, then come back here to view them side by side."
        action={
          <Link href="/equipment">
            <Button>Browse equipment</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Comparing {ids.length} of {COMPARE_LIMIT} listings. Remove one to add another.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            Clear all
          </Button>
          <Link href="/equipment">
            <Button variant="outline" size="sm" icon="plus">
              Add listings
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Side by side comparison of selected listings</caption>
          <thead>
            <tr className="border-b border-line bg-sand">
              <th scope="col" className="w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                Compare
              </th>
              {ids.map((id) => {
                const listing = getListingWithRelations(id);
                return (
                  <th key={id} scope="col" className="px-4 py-3 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {listing?.title ?? "Unknown listing"}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove from comparison"
                        onClick={() => {
                          removeCompare(id);
                          setTick((tick) => tick + 1);
                        }}
                        className="rounded p-1 text-muted hover:bg-sand-deep hover:text-danger"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0">
                <th scope="row" className="px-4 py-3.5 text-left align-top text-xs font-semibold uppercase tracking-wide text-muted">
                  {row.label}
                </th>
                {ids.map((id) => (
                  <td key={`${row.label}-${id}`} className="px-4 py-3.5 align-top">
                    {row.render(id)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                Next step
              </th>
              {ids.map((id) => (
                <td key={`cta-${id}`} className="px-4 py-4 align-top">
                  <Link href={`/listings/${id}`}>
                    <Button size="sm" fullWidth>
                      View and book
                    </Button>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="page-shell py-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Compare listings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Review equipment and services side by side: provider, location, price, availability,
            operator, rating, and verification.
          </p>
          <div className="mt-6">
            <ClientOnly fallback={<LoadingState label="Loading comparison..." />}>
              <CompareContent />
            </ClientOnly>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
