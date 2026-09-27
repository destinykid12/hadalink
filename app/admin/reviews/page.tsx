"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { deleteReview, listAllReviews } from "@/services/reviewService";
import {
  bookingRepository,
  farmerRepository,
  listingRepository,
  providerRepository,
  userRepository,
} from "@/repositories";
import { formatDate } from "@/lib/dates";
import type { Review } from "@/types/models";

export default function AdminReviewsPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const reviews = useMemo(() => listAllReviews(), []);
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <LoadingState label="Loading reviews..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Moderate marketplace reviews. Removing a review recalculates the affected ratings.
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon="star"
          title="No reviews"
          message="Reviews from completed bookings will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const booking = bookingRepository.findById(review.bookingId);
            const farmer = farmerRepository.findById(review.farmerId);
            const provider = providerRepository.findById(review.providerId);
            const listing = listingRepository.findById(review.listingId);
            const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
            return (
              <Card key={review.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingStars value={review.rating} showValue={false} size={14} />
                      <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                    <p className="mt-2 text-xs text-muted">
                      {farmerUser?.name ?? "Farmer"} on {listing?.title ?? "a listing"} | Provider:{" "}
                      {provider?.businessName ?? "Unknown"}
                      {booking ? ` | Booking ${booking.reference}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    icon="trash"
                    onClick={() => setPendingDelete(review)}
                  >
                    Remove review
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this review?"
        message="The review will be deleted and the provider and listing ratings will be recalculated. Use this for inappropriate or inaccurate content only."
        confirmLabel="Remove review"
        danger
        busy={busy}
        onConfirm={() => {
          if (!pendingDelete) return;
          setBusy(true);
          const result = deleteReview(pendingDelete.id);
          setBusy(false);
          setPendingDelete(null);
          if (result.ok) {
            toast.success("Review removed", "Ratings have been recalculated.");
          } else {
            toast.error("Could not remove review", result.error);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
