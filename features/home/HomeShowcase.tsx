"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { Button } from "@/components/ui/Button";
import { searchListings } from "@/services/listingService";
import { listCategories } from "@/services/categoryService";
import { countVerifiedProviders, computeAdminStats } from "@/services/analyticsService";
import { LISTING_TYPE_LABELS, priceWithUnit } from "@/lib/format";

export function HomeHeroStats() {
  const stats = computeAdminStats();
  const verifiedProviders = countVerifiedProviders();
  return (
    <>
      <span className="flex items-center gap-2">
        <Icon name="check" size={16} className="text-primary" />
        {stats.totalListings} demo listings live
      </span>
      <span className="flex items-center gap-2">
        <Icon name="check" size={16} className="text-primary" />
        {verifiedProviders} verified providers
      </span>
      <span className="flex items-center gap-2">
        <Icon name="check" size={16} className="text-primary" />
        Booking, comparison, and reviews built in
      </span>
    </>
  );
}

export function HomeShowcase() {
  const featured = searchListings({ sort: "RATING" }).slice(0, 6);
  const categories = listCategories();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Available equipment and services
          </h2>
          <p className="mt-2 text-base text-muted">
            A sample of what farmers are finding on HadaLink right now.
          </p>
        </div>
        <Link href="/equipment">
          <Button variant="outline" iconAfter="arrow-right">
            Browse everything
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((listing) => (
          <article key={listing.id} className="overflow-hidden rounded-lg border border-line">
            <div className="h-40 overflow-hidden border-b border-line bg-sand-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing.images[0] ?? "/images/farm-scene.jpg"}
                alt={`${listing.title} available in ${listing.location}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={listing.type === "EQUIPMENT" ? "green" : "soft"}>
                  {LISTING_TYPE_LABELS[listing.type]}
                </Badge>
                <RatingStars value={listing.rating} count={listing.reviewCount} size={13} />
              </div>
              <h3 className="mt-2 text-base font-semibold text-ink">
                <Link href={`/listings/${listing.id}`} className="hover:text-primary">
                  {listing.title}
                </Link>
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Icon name="pin" size={13} /> {listing.location}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <p className="text-sm font-semibold text-ink">
                  {priceWithUnit(listing.price, listing.pricingUnit)}
                </p>
                {listing.provider.verificationStatus === "VERIFIED" ? <VerifiedBadge /> : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Browse by category
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/equipment?category=${category.slug}`}
              className="rounded-full border border-line-strong bg-white px-4 py-2 text-sm text-ink-soft hover:border-primary hover:bg-primary-soft hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
