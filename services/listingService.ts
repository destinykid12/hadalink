/**
 * Listing service: CRUD, search, filtering, sorting, and display joins.
 * Search runs against the local database exactly as a backend would.
 */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO, todayISODate } from "@/lib/dates";
import {
  availabilityRepository,
  bookingRepository,
  categoryRepository,
  equipmentRepository,
  listingRepository,
  providerRepository,
  reviewRepository,
  savedListingRepository,
  serviceRepository,
  userRepository,
} from "@/repositories";
import type {
  Listing,
  ListingSearchFilters,
  ListingWithRelations,
  PricingUnit,
  ProviderProfile,
  Result,
  User,
} from "@/types/models";
import { notify } from "@/services/notificationService";
import { getCurrentUser, requireRole } from "@/services/authService";

export interface ListingInput {
  title: string;
  categoryId: string;
  type: "EQUIPMENT" | "SERVICE";
  description: string;
  images: string[];
  location: string;
  price: number;
  pricingUnit: PricingUnit;
  condition: "NEW" | "EXCELLENT" | "GOOD" | "FAIR";
  operatorIncluded: boolean;
  terms: string;
  brand?: string;
  model?: string;
  horsepower?: number;
  yearOfManufacture?: number;
  scope?: string;
  durationEstimate?: string;
  deliverables?: string;
}

export function getProviderProfileByUserId(userId: string): ProviderProfile | undefined {
  hydrateDatabase();
  return providerRepository.findOne((profile) => profile.userId === userId);
}

export function joinListing(listing: Listing): ListingWithRelations {
  const provider = providerRepository.findById(listing.providerId);
  const providerUser = provider ? userRepository.findById(provider.userId) : undefined;
  const category = categoryRepository.findById(listing.categoryId);
  const equipment = equipmentRepository.findOne((record) => record.listingId === listing.id);
  const service = serviceRepository.findOne((record) => record.listingId === listing.id);

  const availability = availabilityRepository.findWhere((entry) => entry.listingId === listing.id);
  const activeStatuses = ["PENDING", "CONFIRMED", "IN_PROGRESS"];
  const bookedFromBookings = bookingRepository
    .findWhere((booking) => booking.listingId === listing.id && activeStatuses.includes(booking.status))
    .map((booking) => booking.date);

  const unavailableDates = availability
    .filter((entry) => entry.status === "UNAVAILABLE")
    .map((entry) => entry.date);
  const bookedDates = Array.from(
    new Set([
      ...availability.filter((entry) => entry.status === "BOOKED").map((entry) => entry.date),
      ...bookedFromBookings,
    ]),
  );

  const today = todayISODate();
  const nextAvailableDate = bookedDates
    .concat(unavailableDates)
    .filter((date) => date >= today)
    .sort()
    .reduce<string | null>((blocked, date, index, all) => {
      if (blocked !== null) return blocked;
      const previous = index > 0 ? all[index - 1] : null;
      if (previous === null && date > today) return today;
      return null;
    }, null);

  const fallbackUser: User = providerUser ?? {
    id: "unknown",
    role: "PROVIDER",
    name: "Unknown provider",
    email: "",
    phone: "",
    password: "",
    location: "",
    avatar: "",
    status: "ACTIVE",
    createdAt: "",
    updatedAt: "",
  };

  return {
    ...listing,
    provider: {
      ...(provider ?? {
        id: listing.providerId,
        userId: fallbackUser.id,
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
      user: fallbackUser,
    },
    category: category ?? {
      id: listing.categoryId,
      name: "Other",
      slug: "other",
      description: "",
      listingType: "BOTH" as const,
      icon: "wrench",
      createdAt: "",
      updatedAt: "",
    },
    equipment,
    service,
    nextAvailableDate,
    bookedDates,
    unavailableDates,
  };
}

export function listListingsWithRelations(): ListingWithRelations[] {
  hydrateDatabase();
  return listingRepository.findAll().map(joinListing);
}

export function getListingWithRelations(id: string): ListingWithRelations | undefined {
  hydrateDatabase();
  const listing = listingRepository.findById(id);
  return listing ? joinListing(listing) : undefined;
}

export function scoreRelevance(listing: ListingWithRelations, query: string): number {
  if (!query.trim()) return 1;
  const needle = query.toLowerCase().trim();
  const haystacks: [string, number][] = [
    [listing.title, 5],
    [listing.category.name, 4],
    [listing.description, 2],
    [listing.location, 3],
    [listing.provider.businessName, 3],
    [listing.type === "EQUIPMENT" ? "equipment service" : "service equipment", 1],
  ];
  let score = 0;
  for (const [text, weight] of haystacks) {
    const value = text.toLowerCase();
    if (value.includes(needle)) score += weight;
    else if (needle.split(/\s+/).some((word) => word.length > 2 && value.includes(word))) {
      score += weight / 2;
    }
  }
  return score;
}

export function searchListings(filters: ListingSearchFilters): ListingWithRelations[] {
  hydrateDatabase();
  let results = listListingsWithRelations().filter((listing) => listing.status === "ACTIVE");

  if (filters.type && filters.type !== "ALL") {
    results = results.filter((listing) => listing.type === filters.type);
  }
  if (filters.categoryId) {
    results = results.filter((listing) => listing.categoryId === filters.categoryId);
  }
  if (filters.location) {
    const needle = filters.location.toLowerCase().trim();
    results = results.filter((listing) =>
      [listing.location, listing.provider.businessName, ...listing.provider.serviceAreas]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }
  if (typeof filters.minPrice === "number" && !Number.isNaN(filters.minPrice)) {
    results = results.filter((listing) => listing.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number" && !Number.isNaN(filters.maxPrice)) {
    results = results.filter((listing) => listing.price <= filters.maxPrice!);
  }
  if (filters.operatorRequired) {
    results = results.filter((listing) => listing.operatorIncluded);
  }
  if (filters.verifiedOnly) {
    results = results.filter((listing) => listing.provider.verificationStatus === "VERIFIED");
  }
  if (filters.availableOnly) {
    const today = todayISODate();
    results = results.filter((listing) => {
      const soonBlocked = listing.bookedDates.includes(today) || listing.unavailableDates.includes(today);
      return !soonBlocked && (listing.nextAvailableDate === null || listing.nextAvailableDate >= today);
    });
  }

  const query = filters.query?.trim() ?? "";
  if (query) {
    results = results.filter((listing) => scoreRelevance(listing, query) > 0);
  }

  const sort = filters.sort ?? "RELEVANCE";
  results.sort((a, b) => {
    switch (sort) {
      case "PRICE_LOW":
        return a.price - b.price;
      case "PRICE_HIGH":
        return b.price - a.price;
      case "NEWEST":
        return b.createdAt.localeCompare(a.createdAt);
      case "RATING":
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case "RELEVANCE":
      default:
        return scoreRelevance(b, query) - scoreRelevance(a, query) || a.price - b.price;
    }
  });

  return results;
}

export function createListing(providerProfileId: string, input: ListingInput): Result<Listing> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["PROVIDER"]);
  if (!actor.ok) return actor;
  const provider = providerRepository.findById(providerProfileId);
  if (!provider) return { ok: false, error: "Provider profile not found." };
  if (provider.userId !== actor.data.id) {
    return { ok: false, error: "You can only create listings for your own provider profile." };
  }
  if (!input.title.trim()) return { ok: false, error: "Listing title is required." };
  if (!input.description.trim()) return { ok: false, error: "Listing description is required." };
  if (input.price <= 0) return { ok: false, error: "Price must be greater than zero." };
  if (!categoryRepository.findById(input.categoryId)) {
    return { ok: false, error: "Please choose a valid category." };
  }

  const now = nowISO();
  const listing = listingRepository.create({
    id: createId("lst"),
    providerId: providerProfileId,
    title: input.title.trim(),
    categoryId: input.categoryId,
    type: input.type,
    description: input.description.trim(),
    images: input.images.length ? input.images : ["/images/farm-scene.jpg"],
    location: input.location.trim(),
    price: input.price,
    pricingUnit: input.pricingUnit,
    condition: input.condition,
    operatorIncluded: input.operatorIncluded,
    terms: input.terms.trim(),
    status: "ACTIVE",
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  if (input.type === "EQUIPMENT") {
    equipmentRepository.create({
      id: createId("eqp"),
      listingId: listing.id,
      brand: input.brand ?? "",
      model: input.model ?? "",
      horsepower: input.horsepower ?? 0,
      yearOfManufacture: input.yearOfManufacture ?? new Date().getFullYear(),
      createdAt: now,
      updatedAt: now,
    });
  } else {
    serviceRepository.create({
      id: createId("srv"),
      listingId: listing.id,
      scope: input.scope ?? input.description.trim(),
      durationEstimate: input.durationEstimate ?? "To be agreed with the provider",
      includesOperator: input.operatorIncluded,
      deliverables: input.deliverables ?? "Agreed with the farmer before work starts.",
      createdAt: now,
      updatedAt: now,
    });
  }

  return { ok: true, data: listing };
}

export function updateListing(listingId: string, input: Partial<ListingInput>): Result<Listing> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["PROVIDER", "ADMIN"]);
  if (!actor.ok) return actor;
  const listing = listingRepository.findById(listingId);
  if (!listing) return { ok: false, error: "Listing not found." };
  if (actor.data.role === "PROVIDER") {
    const own = providerRepository.findOne((profile) => profile.userId === actor.data.id);
    if (!own || own.id !== listing.providerId) {
      return { ok: false, error: "You can only edit your own listings." };
    }
  }
  if (typeof input.price === "number" && input.price <= 0) {
    return { ok: false, error: "Price must be greater than zero." };
  }

  const updated = listingRepository.update(listingId, {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.images !== undefined ? { images: input.images } : {}),
    ...(input.location !== undefined ? { location: input.location.trim() } : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.pricingUnit !== undefined ? { pricingUnit: input.pricingUnit } : {}),
    ...(input.condition !== undefined ? { condition: input.condition } : {}),
    ...(input.operatorIncluded !== undefined ? { operatorIncluded: input.operatorIncluded } : {}),
    ...(input.terms !== undefined ? { terms: input.terms.trim() } : {}),
  });
  if (!updated) return { ok: false, error: "Listing not found." };

  const equipment = equipmentRepository.findOne((record) => record.listingId === listingId);
  if (equipment) {
    equipmentRepository.update(equipment.id, {
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.horsepower !== undefined ? { horsepower: input.horsepower } : {}),
      ...(input.yearOfManufacture !== undefined ? { yearOfManufacture: input.yearOfManufacture } : {}),
    });
  }
  const service = serviceRepository.findOne((record) => record.listingId === listingId);
  if (service) {
    serviceRepository.update(service.id, {
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.durationEstimate !== undefined ? { durationEstimate: input.durationEstimate } : {}),
      ...(input.deliverables !== undefined ? { deliverables: input.deliverables } : {}),
    });
  }

  return { ok: true, data: updated };
}

export function setListingStatus(listingId: string, status: "ACTIVE" | "INACTIVE"): Result<Listing> {
  hydrateDatabase();
  const updated = listingRepository.update(listingId, { status });
  if (!updated) return { ok: false, error: "Listing not found." };
  return { ok: true, data: updated };
}

/**
 * Delete a listing and clean up dependent records so no broken references
 * remain (saved listings, availability blocks, spec sheets).
 */
export function deleteListing(listingId: string): Result<boolean> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["PROVIDER", "ADMIN"]);
  if (!actor.ok) return actor;
  const listing = listingRepository.findById(listingId);
  if (!listing) return { ok: false, error: "Listing not found." };
  if (actor.data.role === "PROVIDER") {
    const own = providerRepository.findOne((profile) => profile.userId === actor.data.id);
    if (!own || own.id !== listing.providerId) {
      return { ok: false, error: "You can only delete your own listings." };
    }
  }

  const activeBookings = bookingRepository.findWhere(
    (booking) =>
      booking.listingId === listingId && ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status),
  );
  if (activeBookings.length > 0) {
    return {
      ok: false,
      error: "This listing has active bookings. Resolve or cancel them before deleting the listing.",
    };
  }

  listingRepository.delete(listingId);
  equipmentRepository.findWhere((record) => record.listingId === listingId).forEach((record) => {
    equipmentRepository.delete(record.id);
  });
  serviceRepository.findWhere((record) => record.listingId === listingId).forEach((record) => {
    serviceRepository.delete(record.id);
  });
  availabilityRepository.findWhere((entry) => entry.listingId === listingId).forEach((entry) => {
    availabilityRepository.delete(entry.id);
  });
  // Saved listings must not point at deleted listings.
  savedListingRepository
    .findWhere((saved) => saved.listingId === listingId)
    .forEach((saved) => {
      savedListingRepository.delete(saved.id);
    });

  // Reviews stay for history but deleted listings disappear from active search.
  return { ok: true, data: true };
}

export interface AvailabilityInput {
  date: string;
  status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
  note?: string;
}

export function setAvailability(providerProfileId: string, listingId: string, input: AvailabilityInput): Result<boolean> {
  hydrateDatabase();
  const listing = listingRepository.findById(listingId);
  if (!listing) return { ok: false, error: "Listing not found." };
  if (listing.providerId !== providerProfileId) {
    return { ok: false, error: "You can only manage availability for your own listings." };
  }

  // Active bookings always win over manual availability edits.
  const activeOnDate = bookingRepository.findWhere(
    (booking) =>
      booking.listingId === listingId &&
      booking.date === input.date &&
      ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status),
  );
  if (activeOnDate.length > 0) {
    return {
      ok: false,
      error: "There is an active booking on this date. Resolve the booking first.",
    };
  }

  const existing = availabilityRepository.findOne(
    (entry) => entry.listingId === listingId && entry.date === input.date,
  );

  if (input.status === "AVAILABLE") {
    if (existing) availabilityRepository.delete(existing.id);
  } else if (existing) {
    availabilityRepository.update(existing.id, {
      status: input.status,
      note: input.note ?? existing.note,
    });
  } else {
    const now = nowISO();
    availabilityRepository.create({
      id: createId("avl"),
      listingId,
      date: input.date,
      status: input.status,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { ok: true, data: true };
}

export function listAvailability(listingId: string) {
  hydrateDatabase();
  return availabilityRepository
    .findWhere((entry) => entry.listingId === listingId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function recomputeListingRating(listingId: string): void {
  hydrateDatabase();
  const reviews = reviewRepository.findWhere((review) => review.listingId === listingId);
  const rating = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;
  listingRepository.update(listingId, { rating, reviewCount: reviews.length });
}

export function recomputeProviderRating(providerProfileId: string): void {
  hydrateDatabase();
  const reviews = reviewRepository.findWhere((review) => review.providerId === providerProfileId);
  const rating = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : 0;
  providerRepository.update(providerProfileId, { rating, reviewCount: reviews.length });
}

export function providerListings(providerProfileId: string): ListingWithRelations[] {
  hydrateDatabase();
  return listingRepository
    .findWhere((listing) => listing.providerId === providerProfileId)
    .map(joinListing)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function notifyProviderNewRequest(provider: ProviderProfile, listingTitle: string, reference: string): void {
  const user = userRepository.findById(provider.userId);
  if (!user) return;
  notify({
    recipientUserId: user.id,
    type: "NEW_BOOKING_REQUEST",
    title: "New booking request",
    message: `A farmer requested ${listingTitle}. Reference ${reference}.`,
    link: "/provider/bookings",
  });
}
