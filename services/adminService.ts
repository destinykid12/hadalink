/**
 * Admin service: user management and marketplace oversight.
 * Authorization note: in production every one of these actions must be
 * protected server-side. Local checks are for prototype UX only.
 */

import { hydrateDatabase } from "@/lib/db";
import { mutate } from "@/lib/db";
import {
  availabilityRepository,
  bookingRepository,
  equipmentRepository,
  farmerRepository,
  listingRepository,
  messageRepository,
  providerRepository,
  savedListingRepository,
  serviceRepository,
  transactionRepository,
  userRepository,
  verificationRepository,
} from "@/repositories";
import type { Result, User, UserStatus } from "@/types/models";
import { notify } from "@/services/notificationService";
import { getCurrentUser, requireRole } from "@/services/authService";

export function listUsers(): User[] {
  hydrateDatabase();
  if (!requireRole(getCurrentUser(), ["ADMIN"]).ok) return [];
  return [...userRepository.findAll()].sort((a, b) => a.name.localeCompare(b.name));
}

export function searchUsers(query: string, role?: string, status?: string): User[] {
  hydrateDatabase();
  if (!requireRole(getCurrentUser(), ["ADMIN"]).ok) return [];
  let users = listUsers();
  if (role && role !== "ALL") users = users.filter((user) => user.role === role);
  if (status && status !== "ALL") users = users.filter((user) => user.status === status);
  const needle = query.trim().toLowerCase();
  if (needle) {
    users = users.filter((user) =>
      [user.name, user.email, user.phone, user.location].join(" ").toLowerCase().includes(needle),
    );
  }
  return users;
}

export function setUserStatus(userId: string, status: UserStatus): Result<User> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["ADMIN"]);
  if (!actor.ok) return actor;
  const user = userRepository.findById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (user.role === "ADMIN") {
    return { ok: false, error: "Admin accounts cannot be suspended from this screen." };
  }
  const updated = userRepository.update(userId, { status });
  if (!updated) return { ok: false, error: "User not found." };

  notify({
    recipientUserId: userId,
    type: status === "SUSPENDED" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED",
    title: status === "SUSPENDED" ? "Account suspended" : "Account reactivated",
    message:
      status === "SUSPENDED"
        ? "Your HadaLink account has been suspended by the admin team."
        : "Your HadaLink account is active again.",
  });

  return { ok: true, data: updated };
}

export function updateUserInfo(userId: string, patch: Partial<Pick<User, "name" | "phone" | "location" | "email">>): Result<User> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["ADMIN"]);
  if (!actor.ok) return actor;
  const user = userRepository.findById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (patch.email && patch.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const clash = userRepository.findOne(
      (other) => other.email.toLowerCase() === patch.email!.trim().toLowerCase(),
    );
    if (clash) return { ok: false, error: "Another account already uses this email." };
    patch.email = patch.email.trim().toLowerCase();
  }
  const updated = userRepository.update(userId, patch);
  return { ok: true, data: updated ?? user };
}

/**
 * Delete a user and clean up dependent records so no broken references remain.
 */
export function deleteUser(userId: string): Result<boolean> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["ADMIN"]);
  if (!actor.ok) return actor;
  const user = userRepository.findById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (user.role === "ADMIN") {
    return { ok: false, error: "Admin accounts cannot be deleted from this screen." };
  }

  mutate(() => {
    const farmer = farmerRepository.findOne((profile) => profile.userId === userId);
    const provider = providerRepository.findOne((profile) => profile.userId === userId);

    if (farmer) {
      bookingRepository
        .findWhere((booking) => booking.farmerId === farmer.id)
        .forEach((booking) => bookingRepository.delete(booking.id));
      farmerRepository.delete(farmer.id);
    }

    if (provider) {
      listingRepository
        .findWhere((listing) => listing.providerId === provider.id)
        .forEach((listing) => {
          equipmentRepository
            .findWhere((record) => record.listingId === listing.id)
            .forEach((record) => equipmentRepository.delete(record.id));
          serviceRepository
            .findWhere((record) => record.listingId === listing.id)
            .forEach((record) => serviceRepository.delete(record.id));
          availabilityRepository
            .findWhere((entry) => entry.listingId === listing.id)
            .forEach((entry) => availabilityRepository.delete(entry.id));
          savedListingRepository
            .findWhere((saved) => saved.listingId === listing.id)
            .forEach((saved) => savedListingRepository.delete(saved.id));
          listingRepository.delete(listing.id);
        });
      bookingRepository
        .findWhere((booking) => booking.providerId === provider.id)
        .forEach((booking) => bookingRepository.delete(booking.id));
      verificationRepository
        .findWhere((request) => request.providerId === provider.id)
        .forEach((request) => verificationRepository.delete(request.id));
      providerRepository.delete(provider.id);
    }

    savedListingRepository
      .findWhere((saved) => saved.userId === userId)
      .forEach((saved) => savedListingRepository.delete(saved.id));
    messageRepository
      .findWhere(
        (message) => message.senderUserId === userId || message.recipientUserId === userId,
      )
      .forEach((message) => messageRepository.delete(message.id));
    transactionRepository
      .findWhere(
        (txn) =>
          (farmer ? txn.farmerId === farmer.id : false) ||
          (provider ? txn.providerId === provider.id : false),
      )
      .forEach((txn) => transactionRepository.delete(txn.id));

    userRepository.delete(userId);
  });

  return { ok: true, data: true };
}

export function adminDeleteListing(listingId: string): Result<boolean> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["ADMIN"]);
  if (!actor.ok) return actor;
  const listing = listingRepository.findById(listingId);
  if (!listing) return { ok: false, error: "Listing not found." };

  mutate(() => {
    equipmentRepository
      .findWhere((record) => record.listingId === listingId)
      .forEach((record) => equipmentRepository.delete(record.id));
    serviceRepository
      .findWhere((record) => record.listingId === listingId)
      .forEach((record) => serviceRepository.delete(record.id));
    availabilityRepository
      .findWhere((entry) => entry.listingId === listingId)
      .forEach((entry) => availabilityRepository.delete(entry.id));
    savedListingRepository
      .findWhere((saved) => saved.listingId === listingId)
      .forEach((saved) => savedListingRepository.delete(saved.id));
    listingRepository.delete(listingId);
  });

  return { ok: true, data: true };
}

export function suspendProvider(providerProfileId: string): Result<boolean> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["ADMIN"]);
  if (!actor.ok) return actor;
  const provider = providerRepository.findById(providerProfileId);
  if (!provider) return { ok: false, error: "Provider not found." };
  return setUserStatus(provider.userId, "SUSPENDED").ok
    ? { ok: true, data: true }
    : { ok: false, error: "Could not suspend provider." };
}

export function reactivateProvider(providerProfileId: string): Result<boolean> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["ADMIN"]);
  if (!actor.ok) return actor;
  const provider = providerRepository.findById(providerProfileId);
  if (!provider) return { ok: false, error: "Provider not found." };
  return setUserStatus(provider.userId, "ACTIVE").ok
    ? { ok: true, data: true }
    : { ok: false, error: "Could not reactivate provider." };
}
