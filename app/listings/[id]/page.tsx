"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { RatingStars } from "@/components/ui/RatingStars";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, LoadingState, NotFoundState, InlineNote } from "@/components/ui/States";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { BookingRequestPanel } from "@/features/bookings/BookingRequestPanel";
import { toggleCompare, useCompareIds } from "@/features/listings/compareStore";
import { CompareBar } from "@/features/listings/CompareBar";
import { useListing } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import { listReviewsForListing } from "@/services/reviewService";
import { isSaved, toggleSaved } from "@/services/savedService";
import { listAvailability } from "@/services/listingService";
import {
  CONDITION_LABELS,
  LISTING_TYPE_LABELS,
  PRICING_UNIT_LABELS,
  formatNaira,
} from "@/lib/format";
import { formatDate } from "@/lib/dates";

function ListingDetailContent({ listingId }: { listingId: string }) {
  const listing = useListing(listingId);
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const compareIds = useCompareIds();
  const [activeImage, setActiveImage] = useState(0);

  const reviews = useMemo(() => (listing ? listReviewsForListing(listing.id) : []), [listing]);
  const availability = useMemo(() => (listing ? listAvailability(listing.id) : []), [listing]);
  const saved = useMemo(
    () => (user && listing ? isSaved(user.id, listing.id) : false),
    [user, listing],
  );

  if (!listing) {
    return (
      <NotFoundState
        title="Listing not found"
        message="This listing does not exist or was removed by its provider."
        action={
          <Link href="/equipment">
            <Button variant="outline">Back to listings</Button>
          </Link>
        }
      />
    );
  }

  const inCompare = compareIds.includes(listing.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* Images */}
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="h-64 border-b border-line bg-sand-deep sm:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.images[activeImage] ?? "/images/farm-scene.jpg"}
              alt={`${listing.title} photo ${activeImage + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
          {listing.images.length > 1 ? (
            <div className="flex gap-2 p-3">
              {listing.images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show photo ${index + 1}`}
                  className={`h-16 w-24 overflow-hidden rounded-md border-2 ${
                    index === activeImage ? "border-primary" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={listing.type === "EQUIPMENT" ? "green" : "soft"}>
              {LISTING_TYPE_LABELS[listing.type]}
            </Badge>
            <Badge tone="neutral">{listing.category.name}</Badge>
            {listing.operatorIncluded ? <Badge tone="blue">Operator included</Badge> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {listing.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Icon name="pin" size={15} /> {listing.location}
            </span>
            <RatingStars value={listing.rating} count={listing.reviewCount} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-bold text-ink">{formatNaira(listing.price)}</p>
            <p className="rounded-md bg-sand-deep px-2.5 py-1 text-sm text-ink-soft">
              {PRICING_UNIT_LABELS[listing.pricingUnit]}
            </p>
            <Button
              variant="outline"
              size="sm"
              icon="bookmark"
              onClick={() => {
                if (!user) {
                  toast.info("Log in to save listings");
                  return;
                }
                const result = toggleSaved(user.id, listing.id);
                if (result.ok) {
                  toast.success(result.data ? "Listing saved" : "Listing removed from saved");
                  router.refresh();
                }
              }}
              aria-pressed={saved}
            >
              {saved ? "Saved" : "Save listing"}
            </Button>
            <Button
              variant={inCompare ? "secondary" : "outline"}
              size="sm"
              icon="compare"
              aria-pressed={inCompare}
              onClick={() => {
                const result = toggleCompare(listing.id);
                if (!result.ok) toast.error("Compare list is full", result.message);
              }}
            >
              {inCompare ? "In compare list" : "Add to compare"}
            </Button>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardHeader title="About this listing" />
          <p className="text-sm leading-relaxed text-ink-soft">{listing.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Condition</dt>
              <dd className="mt-0.5 font-medium text-ink">{CONDITION_LABELS[listing.condition]}</dd>
            </div>
            <div>
              <dt className="text-muted">Operator</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {listing.operatorIncluded ? "Included" : "Not included"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Pricing unit</dt>
              <dd className="mt-0.5 font-medium text-ink">{PRICING_UNIT_LABELS[listing.pricingUnit]}</dd>
            </div>
            {listing.equipment ? (
              <>
                <div>
                  <dt className="text-muted">Brand</dt>
                  <dd className="mt-0.5 font-medium text-ink">{listing.equipment.brand || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Model</dt>
                  <dd className="mt-0.5 font-medium text-ink">{listing.equipment.model || "Not specified"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Horsepower</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {listing.equipment.horsepower > 0 ? `${listing.equipment.horsepower} hp` : "Not specified"}
                  </dd>
                </div>
              </>
            ) : null}
            {listing.service ? (
              <>
                <div>
                  <dt className="text-muted">Estimated duration</dt>
                  <dd className="mt-0.5 font-medium text-ink">{listing.service.durationEstimate}</dd>
                </div>
                <div>
                  <dt className="text-muted">Deliverables</dt>
                  <dd className="mt-0.5 font-medium text-ink">{listing.service.deliverables}</dd>
                </div>
              </>
            ) : null}
          </dl>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader title="Terms" />
          <p className="text-sm leading-relaxed text-ink-soft">{listing.terms}</p>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader
            title="Availability"
            description="Dates with bookings or provider blocks. You can pick any other date in the booking form."
          />
          {availability.length === 0 ? (
            <p className="text-sm text-muted">
              No blocked dates recorded. Most dates are available: pick your date in the booking form.
            </p>
          ) : (
            <ul className="space-y-2">
              {availability.slice(0, 8).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border border-line px-3.5 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 text-ink">
                    <Icon name="calendar" size={15} />
                    {formatDate(entry.date)}
                  </span>
                  <Badge tone={entry.status === "BOOKED" ? "amber" : "red"}>
                    {entry.status === "BOOKED" ? "Booked" : "Unavailable"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader
            title="Reviews"
            description="Only farmers with completed bookings can leave reviews."
          />
          {reviews.length === 0 ? (
            <EmptyState
              icon="message"
              title="No reviews yet"
              message="This listing has not been reviewed yet. Reviews appear after completed bookings."
            />
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <RatingStars value={review.rating} showValue={false} size={14} />
                    <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader title="Request this listing" description="Choose your date and send a request." />
          <ClientOnly fallback={<LoadingState label="Preparing booking form..." />}>
            <BookingRequestPanel listing={listing} user={user} />
          </ClientOnly>
        </Card>

        {/* Provider card */}
        <Card>
          <CardHeader title="Provider" />
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.provider.user.avatar || "/images/service-team.jpg"}
              alt=""
              className="h-12 w-12 rounded-full border border-line object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-ink">{listing.provider.businessName}</p>
              <p className="text-xs text-muted">{listing.provider.user.location}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <VerificationBadge status={listing.provider.verificationStatus} />
            <RatingStars value={listing.provider.rating} count={listing.provider.reviewCount} size={13} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{listing.provider.description}</p>
          <div className="mt-4 space-y-2">
            <Link href={`/providers/${listing.provider.id}`} className="block">
              <Button variant="outline" fullWidth>
                View provider profile
              </Button>
            </Link>
            {user && listing.provider.user.id !== user.id ? (
              <Button
                variant="ghost"
                fullWidth
                icon="message"
                onClick={() => {
                  toast.info(
                    "Messaging opens from a booking",
                    "Contact the provider after you send a booking request so the conversation stays tied to the job.",
                  );
                }}
              >
                Contact provider
              </Button>
            ) : null}
          </div>
        </Card>

        <InlineNote tone="info">
          Prices are set by providers. HadaLink does not guarantee the cheapest price or
          availability, and verification is not a physical inspection.
        </InlineNote>
      </div>

      <CompareBar />
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="page-shell py-8">
          <div className="mb-5">
            <Link href="/equipment" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <Icon name="arrow-left" size={15} />
              Back to listings
            </Link>
          </div>
          <ClientOnly fallback={<LoadingState label="Loading listing..." />}>
            <ListingDetailContent listingId={params.id} />
          </ClientOnly>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
