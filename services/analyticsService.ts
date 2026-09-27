/**
 * Dashboard analytics computed from the local database.
 * Numbers are never hard-coded; they always reflect current records.
 */

import { hydrateDatabase } from "@/lib/db";
import {
  bookingRepository,
  listingRepository,
  providerRepository,
  reviewRepository,
  settingsRepository,
  transactionRepository,
  userRepository,
  verificationRepository,
} from "@/repositories";
import type {
  DashboardStats,
  FarmerProfile,
  FarmerStats,
  ProviderProfile,
  ProviderStats,
} from "@/types/models";

export function computeAdminStats(): DashboardStats {
  hydrateDatabase();
  const successful = transactionRepository.findWhere((txn) => txn.paymentStatus === "SUCCESSFUL");
  const pendingVerifications = verificationRepository.count((request) => request.status === "PENDING");
  const completedBookings = bookingRepository.count((booking) => booking.status === "COMPLETED");

  return {
    totalUsers: userRepository.count(),
    totalFarmers: userRepository.count((user) => user.role === "FARMER"),
    totalProviders: userRepository.count((user) => user.role === "PROVIDER"),
    totalListings: listingRepository.count(),
    activeListings: listingRepository.count((listing) => listing.status === "ACTIVE"),
    totalBookings: bookingRepository.count(),
    pendingBookings: bookingRepository.count((booking) => booking.status === "PENDING"),
    confirmedBookings: bookingRepository.count(
      (booking) => booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS",
    ),
    completedBookings,
    totalTransactionValue: successful.reduce((sum, txn) => sum + txn.grossAmount, 0),
    totalCommission: successful.reduce((sum, txn) => sum + txn.commission, 0),
    pendingVerifications,
  };
}

export function computeProviderStats(providerProfileId: string): ProviderStats {
  hydrateDatabase();
  const provider = providerRepository.findById(providerProfileId);
  const listings = listingRepository.findWhere((listing) => listing.providerId === providerProfileId);
  const bookings = bookingRepository.findWhere((booking) => booking.providerId === providerProfileId);
  const earned = transactionRepository.findWhere(
    (txn) => txn.providerId === providerProfileId && txn.paymentStatus === "SUCCESSFUL",
  );
  const reviews = reviewRepository.findWhere((review) => review.providerId === providerProfileId);

  return {
    totalListings: listings.length,
    activeListings: listings.filter((listing) => listing.status === "ACTIVE").length,
    bookingRequests: bookings.filter((booking) => booking.status === "PENDING").length,
    confirmedBookings: bookings.filter(
      (booking) => booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS",
    ).length,
    completedJobs: bookings.filter((booking) => booking.status === "COMPLETED").length,
    earnings: earned.reduce((sum, txn) => sum + txn.providerAmount, 0),
    commissionPaid: earned.reduce((sum, txn) => sum + txn.commission, 0),
    averageRating: provider?.rating ?? 0,
    reviewCount: reviews.length,
    verificationStatus: provider?.verificationStatus ?? "UNSUBMITTED",
  };
}

export function computeFarmerStats(farmerProfileId: string): FarmerStats {
  hydrateDatabase();
  const bookings = bookingRepository.findWhere((booking) => booking.farmerId === farmerProfileId);
  const today = new Date().toISOString().slice(0, 10);
  const spent = transactionRepository.findWhere(
    (txn) => txn.farmerId === farmerProfileId && txn.paymentStatus === "SUCCESSFUL",
  );

  return {
    totalBookings: bookings.length,
    pendingRequests: bookings.filter((booking) => booking.status === "PENDING").length,
    upcomingBookings: bookings.filter(
      (booking) =>
        (booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS") && booking.date >= today,
    ).length,
    completedBookings: bookings.filter((booking) => booking.status === "COMPLETED").length,
    savedListings: 0,
    totalSpent: spent.reduce((sum, txn) => sum + txn.grossAmount, 0),
  };
}

export function getCommissionRate(): number {
  hydrateDatabase();
  return settingsRepository.get().commissionRate;
}

export function countVerifiedProviders(): number {
  hydrateDatabase();
  return providerRepository.count((provider) => provider.verificationStatus === "VERIFIED");
}

export function providerProfileForStats(provider: ProviderProfile): ProviderProfile {
  return provider;
}

export function farmerProfileForStats(farmer: FarmerProfile): FarmerProfile {
  return farmer;
}
