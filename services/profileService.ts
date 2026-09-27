/** Profile management for farmers, providers, and admins. */

import { hydrateDatabase } from "@/lib/db";
import {
  farmerRepository,
  providerRepository,
  userRepository,
} from "@/repositories";
import type { FarmerProfile, ProviderProfile, Result, User } from "@/types/models";

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  farmName?: string;
  farmSize?: number;
  farmLocation?: string;
  preferredServices?: string[];
  businessName?: string;
  description?: string;
  serviceAreas?: string[];
}

export function updateProfile(userId: string, input: UpdateProfileInput): Result<User> {
  hydrateDatabase();
  const user = userRepository.findById(userId);
  if (!user) return { ok: false, error: "User not found." };

  const userPatch: Partial<User> = {};
  if (input.name !== undefined && input.name.trim()) userPatch.name = input.name.trim();
  if (input.phone !== undefined && input.phone.trim()) userPatch.phone = input.phone.trim();
  if (input.location !== undefined && input.location.trim()) userPatch.location = input.location.trim();
  if (input.avatar !== undefined && input.avatar.trim()) userPatch.avatar = input.avatar.trim();

  const updated = userRepository.update(userId, userPatch);
  if (!updated) return { ok: false, error: "User not found." };

  const farmer = farmerRepository.findOne((profile) => profile.userId === userId);
  if (farmer) {
    const farmerPatch: Partial<FarmerProfile> = {};
    if (input.farmName !== undefined) farmerPatch.farmName = input.farmName.trim();
    if (input.farmSize !== undefined && input.farmSize >= 0) farmerPatch.farmSize = input.farmSize;
    if (input.farmLocation !== undefined) farmerPatch.farmLocation = input.farmLocation.trim();
    if (input.preferredServices !== undefined) farmerPatch.preferredServices = input.preferredServices;
    if (Object.keys(farmerPatch).length > 0) farmerRepository.update(farmer.id, farmerPatch);
  }

  const provider = providerRepository.findOne((profile) => profile.userId === userId);
  if (provider) {
    const providerPatch: Partial<ProviderProfile> = {};
    if (input.businessName !== undefined && input.businessName.trim()) {
      providerPatch.businessName = input.businessName.trim();
    }
    if (input.description !== undefined) providerPatch.description = input.description.trim();
    if (input.serviceAreas !== undefined) providerPatch.serviceAreas = input.serviceAreas;
    if (Object.keys(providerPatch).length > 0) providerRepository.update(provider.id, providerPatch);
  }

  return { ok: true, data: updated };
}

export function getFarmerProfile(userId: string): FarmerProfile | undefined {
  hydrateDatabase();
  return farmerRepository.findOne((profile) => profile.userId === userId);
}

export function getProviderProfile(userId: string): ProviderProfile | undefined {
  hydrateDatabase();
  return providerRepository.findOne((profile) => profile.userId === userId);
}

export function changePassword(userId: string, currentPassword: string, newPassword: string): Result<boolean> {
  hydrateDatabase();
  const user = userRepository.findById(userId);
  if (!user) return { ok: false, error: "User not found." };
  if (user.password !== currentPassword) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  if (newPassword.length < 6) {
    return { ok: false, error: "New password must be at least 6 characters." };
  }
  userRepository.update(userId, { password: newPassword });
  return { ok: true, data: true };
}
