/**
 * Booking service: the core marketplace workflow.
 *
 * PENDING -> CONFIRMED | REJECTED | CANCELLED
 * CONFIRMED -> IN_PROGRESS | COMPLETED | CANCELLED
 * IN_PROGRESS -> COMPLETED | CANCELLED
 * REJECTED / CANCELLED / COMPLETED are terminal.
 */

import { hydrateDatabase, mutate } from "@/lib/db";
import { createId, createReference } from "@/lib/ids";
import { nowISO, todayISODate } from "@/lib/dates";
import {
  availabilityRepository,
  bookingRepository,
  farmerRepository,
  listingRepository,
  providerRepository,
  reviewRepository,
  settingsRepository,
  transactionRepository,
  userRepository,
} from "@/repositories";
import type {
  Booking,
  BookingStatus,
  BookingWithRelations,
  Listing,
  Result,
} from "@/types/models";
import { notify } from "@/services/notificationService";
import { ensureTransactionForBooking } from "@/services/paymentService";
import { getCurrentUser, requireRole } from "@/services/authService";

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function joinBooking(booking: Booking): BookingWithRelations {
  hydrateDatabase();
  const farmer = farmerRepository.findById(booking.farmerId);
  const provider = providerRepository.findById(booking.providerId);
  const listing = listingRepository.findById(booking.listingId);

  const review = reviewRepository.findOne((record) => record.bookingId === booking.id);
  const transaction = transactionRepository.findOne((record) => record.bookingId === booking.id);

  const farmerUser = farmer ? userRepository.findById(farmer.userId) : undefined;
  const providerUser = provider ? userRepository.findById(provider.userId) : undefined;

  return {
    ...booking,
    farmer: {
      ...(farmer ?? {
        id: booking.farmerId,
        userId: "unknown",
        farmName: "Unknown farm",
        farmSize: 0,
        farmLocation: booking.location,
        preferredServices: [],
        createdAt: "",
        updatedAt: "",
      }),
      user: farmerUser ?? {
        id: "unknown",
        role: "FARMER" as const,
        name: "Unknown farmer",
        email: "",
        phone: "",
        password: "",
        location: "",
        avatar: "",
        status: "ACTIVE" as const,
        createdAt: "",
        updatedAt: "",
      },
    },
    provider: {
      ...(provider ?? {
        id: booking.providerId,
        userId: "unknown",
        businessName: "Unknown provider",
        description: "",
        verificationStatus: "UNSUBMITTED" as const,
        rating: 0,
        reviewCount: 0,
        completedJobs: 0,
        serviceAreas: [],
        createdAt: "",
        updatedAt: "",
      }),
      user: providerUser ?? {
        id: "unknown",
        role: "PROVIDER" as const,
        name: "Unknown provider",
        email: "",
        phone: "",
        password: "",
        location: "",
        avatar: "",
        status: "ACTIVE" as const,
        createdAt: "",
        updatedAt: "",
      },
    },
    listing: listing ?? {
      id: booking.listingId,
      providerId: booking.providerId,
      title: booking.listingTitle,
      categoryId: "",
      type: booking.listingType,
      description: "",
      images: [],
      location: booking.location,
      price: booking.amount,
      pricingUnit: "FIXED",
      condition: "GOOD",
      operatorIncluded: true,
      terms: "",
      status: "ACTIVE",
      rating: 0,
      reviewCount: 0,
      createdAt: "",
      updatedAt: "",
    },
    review,
    transaction,
  };
}

export function listBookingsForFarmer(farmerProfileId: string): BookingWithRelations[] {
  hydrateDatabase();
  return bookingRepository
    .findWhere((booking) => booking.farmerId === farmerProfileId)
    .map(joinBooking)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listBookingsForProvider(providerProfileId: string): BookingWithRelations[] {
  hydrateDatabase();
  return bookingRepository
    .findWhere((booking) => booking.providerId === providerProfileId)
    .map(joinBooking)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBooking(id: string): BookingWithRelations | undefined {
  hydrateDatabase();
  const booking = bookingRepository.findById(id);
  return booking ? joinBooking(booking) : undefined;
}

export function listAllBookings(): BookingWithRelations[] {
  hydrateDatabase();
  return bookingRepository.findAll().map(joinBooking)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function amountFor(listing: Listing, quantity: number): number {
  if (listing.pricingUnit === "FIXED" || listing.pricingUnit === "PER_JOB") {
    return listing.price;
  }
  return listing.price * Math.max(1, quantity);
}

export interface CreateBookingInput {
  farmerProfileId: string;
  listingId: string;
  date: string;
  location: string;
  notes: string;
  quantity: number;
}

export function createBooking(input: CreateBookingInput): Result<Booking> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["FARMER"]);
  if (!actor.ok) return actor;
  const listing = listingRepository.findById(input.listingId);
  if (!listing || listing.status !== "ACTIVE") {
    return { ok: false, error: "This listing is not available for booking." };
  }
  const farmer = farmerRepository.findById(input.farmerProfileId);
  if (!farmer) return { ok: false, error: "Farmer profile not found." };

  const date = input.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Please choose a valid service date." };
  }
  if (date < todayISODate()) {
    return { ok: false, error: "The service date cannot be in the past." };
  }

  // Availability and conflict checks (double booking prevention).
  const unavailable = availabilityRepository.findOne(
    (entry) => entry.listingId === listing.id && entry.date === date && entry.status === "UNAVAILABLE",
  );
  if (unavailable) {
    return {
      ok: false,
      error: `This date is unavailable: ${unavailable.note ? `${unavailable.note}. ` : ""}Please pick another date.`,
    };
  }

  const clash = bookingRepository.findWhere(
    (booking) =>
      booking.listingId === listing.id &&
      booking.date === date &&
      ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status),
  );
  if (clash.length > 0) {
    return {
      ok: false,
      error: "Another booking already holds this date. Please choose a different date.",
    };
  }

  const amount = amountFor(listing, input.quantity);
  const commissionRate = settingsRepository.get().commissionRate;
  const commission = Math.round(amount * commissionRate);
  const now = nowISO();

  const booking = bookingRepository.create({
    id: createId("bkg"),
    reference: createReference("HL"),
    farmerId: farmer.id,
    providerId: listing.providerId,
    listingId: listing.id,
    listingTitle: listing.title,
    listingType: listing.type,
    date,
    location: input.location.trim(),
    notes: input.notes.trim(),
    quantity: Math.max(1, input.quantity),
    amount,
    commissionRate,
    commission,
    providerAmount: amount - commission,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  });

  // PENDING requests already hold the date to prevent double booking.
  mutate(() => {
    availabilityRepository.create({
      id: createId("avl"),
      listingId: listing.id,
      date,
      status: "BOOKED",
      note: `Booking ${booking.reference}`,
      createdAt: now,
      updatedAt: now,
    });
  });

  const farmerUser = userRepository.findById(farmer.userId);
  const provider = providerRepository.findById(listing.providerId);
  const providerUser = provider ? userRepository.findById(provider.userId) : null;

  if (farmerUser) {
    notify({
      recipientUserId: farmerUser.id,
      type: "BOOKING_SUBMITTED",
      title: "Booking request sent",
      message: `Your request for ${listing.title} was sent. Reference ${booking.reference}.`,
      link: `/dashboard/bookings/${booking.id}`,
    });
  }
  if (providerUser) {
    notify({
      recipientUserId: providerUser.id,
      type: "NEW_BOOKING_REQUEST",
      title: "New booking request",
      message: `${farmerUser?.name ?? "A farmer"} requested ${listing.title} for ${date}. Reference ${booking.reference}.`,
      link: `/provider/bookings/${booking.id}`,
    });
  }

  return { ok: true, data: booking };
}

interface TransitionOptions {
  rejectionReason?: string;
  cancelledBy?: "farmer" | "provider" | "admin";
}

function transition(bookingId: string, to: BookingStatus, options: TransitionOptions = {}): Result<Booking> {
  hydrateDatabase();
  const booking = bookingRepository.findById(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };

  if (!canTransition(booking.status, to)) {
    return {
      ok: false,
      error: `A ${booking.status.toLowerCase().replace("_", " ")} booking cannot become ${to.toLowerCase().replace("_", " ")}.`,
    };
  }

  const now = nowISO();
  const patch: Partial<Booking> = { status: to, updatedAt: now };
  if (to === "CONFIRMED") patch.acceptedAt = now;
  if (to === "COMPLETED") patch.completedAt = now;
  if (to === "CANCELLED") {
    patch.cancelledAt = now;
    patch.cancelledBy = options.cancelledBy ?? "farmer";
  }
  if (to === "REJECTED" && options.rejectionReason) {
    patch.rejectionReason = options.rejectionReason;
  }

  const updated = bookingRepository.update(bookingId, patch);
  if (!updated) return { ok: false, error: "Booking not found." };

  // Rejected or cancelled bookings must release the date.
  if (to === "REJECTED" || to === "CANCELLED") {
    mutate(() => {
      availabilityRepository
        .findWhere((entry) => entry.listingId === booking.listingId && entry.date === booking.date)
        .forEach((entry) => {
          if (entry.note?.includes(booking.reference) || entry.status === "BOOKED") {
            availabilityRepository.delete(entry.id);
          }
        });
    });
  }

  // Completed jobs feed provider stats and enable reviews.
  if (to === "COMPLETED") {
    const provider = providerRepository.findById(booking.providerId);
    if (provider) {
      providerRepository.update(provider.id, {
        completedJobs: provider.completedJobs + 1,
      });
    }
  }

  // Notify both sides about the status change.
  const farmer = farmerRepository.findById(booking.farmerId);
  const providerProfile = providerRepository.findById(booking.providerId);
  const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
  const providerUser = providerProfile ? userRepository.findById(providerProfile.userId) : null;

  const messages: Record<string, { type: Parameters<typeof notify>[0]["type"]; title: string; message: string }> = {
    CONFIRMED: {
      type: "BOOKING_ACCEPTED",
      title: "Booking confirmed",
      message: `${providerProfile?.businessName ?? "The provider"} accepted your booking for ${booking.listingTitle}.`,
    },
    REJECTED: {
      type: "BOOKING_REJECTED",
      title: "Booking not accepted",
      message: `${providerProfile?.businessName ?? "The provider"} could not accept your booking for ${booking.listingTitle}.${options.rejectionReason ? ` Reason: ${options.rejectionReason}` : ""}`,
    },
    CANCELLED: {
      type: "BOOKING_CANCELLED",
      title: "Booking cancelled",
      message: `Booking ${booking.reference} for ${booking.listingTitle} was cancelled.`,
    },
    COMPLETED: {
      type: "BOOKING_COMPLETED",
      title: "Service completed",
      message: `${booking.listingTitle} was marked as completed. You can now leave a review.`,
    },
    IN_PROGRESS: {
      type: "BOOKING_IN_PROGRESS",
      title: "Job started",
      message: `${booking.listingTitle} is now in progress.`,
    },
  };

  const entry = messages[to];
  if (entry && farmerUser) {
    notify({
      recipientUserId: farmerUser.id,
      type: entry.type,
      title: entry.title,
      message: entry.message,
      link: `/dashboard/bookings/${booking.id}`,
    });
  }
  if (entry && providerUser && to !== "REJECTED") {
    notify({
      recipientUserId: providerUser.id,
      type: entry.type,
      title: entry.title,
      message: `Booking ${booking.reference}: ${entry.message}`,
      link: `/provider/bookings/${booking.id}`,
    });
  }

  return { ok: true, data: updated };
}

function assertProviderOwnsBooking(bookingId: string): Result<Booking> {
  const actor = requireRole(getCurrentUser(), ["PROVIDER", "ADMIN"]);
  if (!actor.ok) return actor;
  const booking = bookingRepository.findById(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (actor.data.role === "PROVIDER") {
    const own = providerRepository.findOne((profile) => profile.userId === actor.data.id);
    if (!own || own.id !== booking.providerId) {
      return { ok: false, error: "You can only manage bookings for your own listings." };
    }
  }
  return { ok: true, data: booking };
}

function assertFarmerOwnsBooking(bookingId: string): Result<Booking> {
  const actor = requireRole(getCurrentUser(), ["FARMER", "ADMIN"]);
  if (!actor.ok) return actor;
  const booking = bookingRepository.findById(bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (actor.data.role === "FARMER") {
    const own = farmerRepository.findOne((profile) => profile.userId === actor.data.id);
    if (!own || own.id !== booking.farmerId) {
      return { ok: false, error: "You can only cancel your own bookings." };
    }
  }
  return { ok: true, data: booking };
}

export function confirmBooking(bookingId: string): Result<Booking> {
  const guard = assertProviderOwnsBooking(bookingId);
  if (!guard.ok) return guard;
  return transition(bookingId, "CONFIRMED");
}

export function rejectBooking(bookingId: string, reason: string): Result<Booking> {
  const guard = assertProviderOwnsBooking(bookingId);
  if (!guard.ok) return guard;
  return transition(bookingId, "REJECTED", { rejectionReason: reason });
}

export function cancelBooking(
  bookingId: string,
  cancelledBy: "farmer" | "provider" | "admin",
): Result<Booking> {
  if (cancelledBy === "farmer") {
    const guard = assertFarmerOwnsBooking(bookingId);
    if (!guard.ok) return guard;
  } else {
    const guard = assertProviderOwnsBooking(bookingId);
    if (!guard.ok) return guard;
  }
  return transition(bookingId, "CANCELLED", { cancelledBy });
}

export function startBooking(bookingId: string): Result<Booking> {
  const guard = assertProviderOwnsBooking(bookingId);
  if (!guard.ok) return guard;
  return transition(bookingId, "IN_PROGRESS");
}

export function completeBooking(bookingId: string): Result<Booking> {
  hydrateDatabase();
  const guard = assertProviderOwnsBooking(bookingId);
  if (!guard.ok) return guard;
  const result = transition(bookingId, "COMPLETED");
  if (!result.ok) return result;

  // Data consistency rule: completed bookings must have a transaction record.
  ensureTransactionForBooking(bookingId);

  const booking = bookingRepository.findById(bookingId);
  const farmer = booking ? farmerRepository.findById(booking.farmerId) : null;
  const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
  if (booking && farmerUser) {
    notify({
      recipientUserId: farmerUser.id,
      type: "REVIEW_AVAILABLE",
      title: "Leave a review",
      message: `Your ${booking.listingTitle} job is complete. Share how it went.`,
      link: `/dashboard/bookings/${booking.id}`,
    });
  }
  return result;
}
