"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { getProviderProfile } from "@/services/profileService";
import { listReviewsForProvider } from "@/services/reviewService";
import { bookingRepository, farmerRepository, userRepository } from "@/repositories";
import { formatDate } from "@/lib/dates";

const PAGE_SIZE = 6;

export default function ProviderReviewsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const reviews = useMemo(
    () => (provider ? listReviewsForProvider(provider.id) : []),
    [provider],
  );
  const [page, setPage] = useState(1);

  if (!hydrated) return <LoadingState label="Loading reviews..." />;

  const pageCount = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const visible = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Feedback from farmers after completed jobs. Your rating updates automatically.
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon="star"
          title="No reviews yet"
          message="Reviews appear here after farmers rate completed jobs."
        />
      ) : (
        <>
          <div className="space-y-4">
            {visible.map((review) => {
              const booking = bookingRepository.findById(review.bookingId);
              const farmer = farmerRepository.findById(review.farmerId);
              const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
              return (
                <Card key={review.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {farmerUser?.name ?? "Farmer"}
                        {booking ? ` | ${booking.listingTitle}` : ""}
                      </p>
                      <div className="mt-1">
                        <RatingStars value={review.rating} showValue={false} size={14} />
                      </div>
                    </div>
                    <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                </Card>
              );
            })}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Review pages" />
        </>
      )}
    </div>
  );
}
