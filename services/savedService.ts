/** Saved listings service for farmers. */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import { savedListingRepository } from "@/repositories";
import type { ListingWithRelations, Result } from "@/types/models";
import { joinListing } from "@/services/listingService";
import { listingRepository } from "@/repositories";

export function isSaved(userId: string, listingId: string): boolean {
  hydrateDatabase();
  return !!savedListingRepository.findOne(
    (saved) => saved.userId === userId && saved.listingId === listingId,
  );
}

export function toggleSaved(userId: string, listingId: string): Result<boolean> {
  hydrateDatabase();
  const existing = savedListingRepository.findOne(
    (saved) => saved.userId === userId && saved.listingId === listingId,
  );
  if (existing) {
    savedListingRepository.delete(existing.id);
    return { ok: true, data: false };
  }
  const now = nowISO();
  savedListingRepository.create({
    id: createId("sav"),
    userId,
    listingId,
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true, data: true };
}

export function removeSaved(userId: string, listingId: string): Result<boolean> {
  hydrateDatabase();
  const existing = savedListingRepository.findOne(
    (saved) => saved.userId === userId && saved.listingId === listingId,
  );
  if (!existing) return { ok: false, error: "Saved listing not found." };
  savedListingRepository.delete(existing.id);
  return { ok: true, data: true };
}

export function listSaved(userId: string): ListingWithRelations[] {
  hydrateDatabase();
  return savedListingRepository
    .findWhere((saved) => saved.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((saved) => listingRepository.findById(saved.listingId))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))
    .map(joinListing);
}
