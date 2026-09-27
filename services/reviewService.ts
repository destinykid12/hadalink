/** Review service. Reviews are allowed only after a completed booking. */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import {
  bookingRepository,
  providerRepository,
  reviewRepository,
  userRepository,
} from "@/repositories";
import type { Result, Review } from "@/types/models";
import { notify } from "@/services/notificationService";
import {
  recomputeListingRating,
  recomputeProviderRating,
} from "@/services/listingService";
import { getCurrentUser, requireRole } from "@/services/authService";

export interface CreateReviewInput {
  bookingId: string;
  farmerProfileId: string;
  rating: number;
  comment: string;
}

export function createReview(input: CreateReviewInput): Result<Review> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["FARMER"]);
  if (!actor.ok) return actor;
  const booking = bookingRepository.findById(input.bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.farmerId !== input.farmerProfileId) {
    return { ok: false, error: "You can only review your own bookings." };
  }
  if (booking.status !== "COMPLETED") {
    return {
      ok: false,
      error: "Reviews can only be left after the service is completed.",
    };
  }
  const existing = reviewRepository.findOne((review) => review.bookingId === input.bookingId);
  if (existing) {
    return { ok: false, error: "You have already reviewed this booking." };
  }
  const rating = Math.round(input.rating);
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Rating must be between 1 and 5." };
  }
  if (!input.comment.trim()) {
    return { ok: false, error: "Please add a short comment with your rating." };
  }

  const now = nowISO();
  const review = reviewRepository.create({
    id: createId("rev"),
    bookingId: booking.id,
    farmerId: booking.farmerId,
    providerId: booking.providerId,
    listingId: booking.listingId,
    rating,
    comment: input.comment.trim(),
    createdAt: now,
    updatedAt: now,
  });

  recomputeListingRating(booking.listingId);
  recomputeProviderRating(booking.providerId);

  const providerProfile = providerRepository.findById(booking.providerId);
  if (providerProfile) {
    const providerUser = userRepository.findById(providerProfile.userId);
    if (providerUser) {
      notify({
        recipientUserId: providerUser.id,
        type: "NEW_REVIEW",
        title: "New review received",
        message: `A farmer left a ${rating} star review on ${booking.listingTitle}.`,
        link: "/provider/reviews",
      });
    }
  }

  return { ok: true, data: review };
}

export function listReviewsForProvider(providerProfileId: string): Review[] {
  hydrateDatabase();
  return reviewRepository
    .findWhere((review) => review.providerId === providerProfileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listReviewsForListing(listingId: string): Review[] {
  hydrateDatabase();
  return reviewRepository
    .findWhere((review) => review.listingId === listingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllReviews(): Review[] {
  hydrateDatabase();
  return [...reviewRepository.findAll()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function canReviewBooking(bookingId: string, farmerProfileId: string): boolean {
  hydrateDatabase();
  const booking = bookingRepository.findById(bookingId);
  if (!booking || booking.status !== "COMPLETED" || booking.farmerId !== farmerProfileId) {
    return false;
  }
  return !reviewRepository.findOne((review) => review.bookingId === bookingId);
}

/** Admin moderation: remove inappropriate reviews and recompute ratings. */
export function deleteReview(reviewId: string): Result<boolean> {
  hydrateDatabase();
  const review = reviewRepository.findById(reviewId);
  if (!review) return { ok: false, error: "Review not found." };
  reviewRepository.delete(reviewId);
  recomputeListingRating(review.listingId);
  recomputeProviderRating(review.providerId);
  return { ok: true, data: true };
}
