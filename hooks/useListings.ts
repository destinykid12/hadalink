"use client";

/** Data hooks for listings, bookings, notifications, and messaging. */

import { useMemo, useState } from "react";
import { useDatabase } from "@/hooks/useDatabase";
import {
  getListingWithRelations,
  listListingsWithRelations,
  providerListings,
  searchListings,
} from "@/services/listingService";
import {
  getBooking,
  listAllBookings,
  listBookingsForFarmer,
  listBookingsForProvider,
} from "@/services/bookingService";
import {
  listForUser,
  unreadCount as unreadCountService,
} from "@/services/notificationService";
import { listThreadsForUser } from "@/services/messageService";
import { listSaved } from "@/services/savedService";
import type { ListingSearchFilters } from "@/types/models";

export function useListingSearch(initial: ListingSearchFilters = {}) {
  useDatabase();
  const [filters, setFilters] = useState<ListingSearchFilters>(initial);
  const results = useMemo(() => searchListings(filters), [filters]);
  return { filters, setFilters, results };
}

export function useAllListings() {
  useDatabase();
  return useMemo(() => listListingsWithRelations(), []);
}

export function useListing(id: string) {
  useDatabase();
  return useMemo(() => getListingWithRelations(id), [id]);
}

export function useProviderListings(providerProfileId: string) {
  useDatabase();
  return useMemo(() => providerListings(providerProfileId), [providerProfileId]);
}

export function useFarmerBookings(farmerProfileId: string) {
  useDatabase();
  return useMemo(() => listBookingsForFarmer(farmerProfileId), [farmerProfileId]);
}

export function useProviderBookings(providerProfileId: string) {
  useDatabase();
  return useMemo(() => listBookingsForProvider(providerProfileId), [providerProfileId]);
}

export function useAllBookings() {
  useDatabase();
  return useMemo(() => listAllBookings(), []);
}

export function useBooking(id: string) {
  useDatabase();
  return useMemo(() => getBooking(id), [id]);
}

export function useNotifications(userId: string) {
  useDatabase();
  return useMemo(() => listForUser(userId), [userId]);
}

export function useUnreadNotifications(userId: string) {
  useDatabase();
  return useMemo(() => unreadCountService(userId), [userId]);
}

export function useThreads(userId: string) {
  useDatabase();
  return useMemo(() => listThreadsForUser(userId), [userId]);
}

export function useSavedListings(userId: string) {
  useDatabase();
  return useMemo(() => listSaved(userId), [userId]);
}
