"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, LoadingState, NotFoundState } from "@/components/ui/States";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { ListingCard } from "@/features/listings/ListingCard";
import { providerRepository, userRepository, listingRepository } from "@/repositories";
import { joinListing } from "@/services/listingService";
import { listReviewsForProvider } from "@/services/reviewService";
import { computeProviderStats } from "@/services/analyticsService";
import { formatDate } from "@/lib/dates";
import { useAuth } from "@/hooks/useAuth";

function ProviderContent({ providerId }: { providerId: string }) {
  const { user } = useAuth();
  const provider = useMemo(() => providerRepository.findById(providerId), [providerId]);

  const providerUser = useMemo(
    () => (provider ? userRepository.findById(provider.userId) : undefined),
    [provider],
  );
  const listings = useMemo(
    () =>
      provider
        ? listingRepository
            .findWhere((listing) => listing.providerId === provider.id)
            .map(joinListing)
        : [],
    [provider],
  );
  const reviews = useMemo(
    () => (provider ? listReviewsForProvider(provider.id) : []),
    [provider],
  );
  const stats = useMemo(
    () => (provider ? computeProviderStats(provider.id) : null),
    [provider],
  );

  if (!provider || !providerUser || !stats) {
    return (
      <NotFoundState
        title="Provider not found"
        message="This provider profile does not exist or was removed."
        action={
          <Link href="/equipment">
            <Button variant="outline">Back to listings</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={providerUser.avatar || "/images/service-team.jpg"}
            alt={`${provider.businessName} profile photo`}
            className="h-24 w-24 rounded-lg border border-line object-cover"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{provider.businessName}</h1>
              <VerificationBadge status={provider.verificationStatus} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="pin" size={14} /> {providerUser.location}
            </p>
            <div className="mt-2">
              <RatingStars value={provider.rating} count={provider.reviewCount} />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{provider.description}</p>
            {provider.serviceAreas.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-line bg-sand px-2.5 py-1 text-xs text-ink-soft"
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/equipment">
                <Button variant="outline" size="sm">
                  Browse marketplace
                </Button>
              </Link>
              {user ? (
                <Link href="/messages">
                  <Button variant="ghost" size="sm" icon="message">
                    Messages
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={stats.activeListings} />
        <StatCard label="Completed jobs" value={stats.completedJobs} />
        <StatCard label="Average rating" value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "No ratings"} />
        <StatCard label="Reviews" value={stats.reviewCount} />
      </div>

      {/* Listings */}
      <section>
        <h2 className="text-lg font-semibold text-ink">Listings from this provider</h2>
        {listings.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="tractor"
              title="No active listings"
              message="This provider has no visible listings right now."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold text-ink">Farmer reviews</h2>
        {reviews.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="message"
              title="No reviews yet"
              message="Reviews appear here after completed bookings."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-center justify-between">
                  <RatingStars value={review.rating} showValue={false} size={15} />
                  <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProviderProfilePage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="page-shell py-8">
          <ClientOnly fallback={<LoadingState label="Loading provider profile..." />}>
            <ProviderContent providerId={params.id} />
          </ClientOnly>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
