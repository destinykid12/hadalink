/**
 * Typed repositories for every local collection.
 * The UI and services depend on these abstractions, never on localStorage.
 */

import { createRepository } from "@/repositories/base";
import { getDatabase, mutate } from "@/lib/db";
import type {
  AppNotification,
  AppSettings,
  AvailabilityEntry,
  Booking,
  Category,
  EquipmentProfile,
  FarmerProfile,
  Listing,
  Message,
  ProviderProfile,
  Review,
  SavedListing,
  ServiceProfile,
  Transaction,
  User,
  VerificationRequest,
} from "@/types/models";

export const userRepository = createRepository<"users">("users");
export const farmerRepository = createRepository<"farmers">("farmers");
export const providerRepository = createRepository<"providers">("providers");
export const equipmentRepository = createRepository<"equipment">("equipment");
export const serviceRepository = createRepository<"services">("services");
export const categoryRepository = createRepository<"categories">("categories");
export const listingRepository = createRepository<"listings">("listings");
export const availabilityRepository = createRepository<"availability">("availability");
export const bookingRepository = createRepository<"bookings">("bookings");
export const reviewRepository = createRepository<"reviews">("reviews");
export const transactionRepository = createRepository<"transactions">("transactions");
export const notificationRepository = createRepository<"notifications">("notifications");
export const messageRepository = createRepository<"messages">("messages");
export const savedListingRepository = createRepository<"savedListings">("savedListings");
export const verificationRepository = createRepository<"verificationRequests">("verificationRequests");

/** Settings is a singleton document rather than a collection. */
export const settingsRepository = {
  get(): AppSettings {
    return getDatabase().settings;
  },
  update(patch: Partial<AppSettings>): AppSettings {
    let next: AppSettings = getDatabase().settings;
    mutate((draft) => {
      next = { ...draft.settings, ...patch };
      draft.settings = next;
    });
    return next;
  },
};

export type {
  AppNotification,
  AvailabilityEntry,
  Booking,
  Category,
  EquipmentProfile,
  FarmerProfile,
  Listing,
  Message,
  ProviderProfile,
  Review,
  SavedListing,
  ServiceProfile,
  Transaction,
  User,
  VerificationRequest,
};
