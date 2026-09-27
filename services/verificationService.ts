/** Provider verification workflow (simulated document review). */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import {
  providerRepository,
  userRepository,
  verificationRepository,
} from "@/repositories";
import type { Result, VerificationRequest } from "@/types/models";
import { notify } from "@/services/notificationService";

export interface SubmitVerificationInput {
  providerProfileId: string;
  businessName: string;
  phone: string;
  location: string;
  identificationInfo: string;
  equipmentInfo: string;
}

export function submitVerification(input: SubmitVerificationInput): Result<VerificationRequest> {
  hydrateDatabase();
  const provider = providerRepository.findById(input.providerProfileId);
  if (!provider) return { ok: false, error: "Provider profile not found." };

  const existing = verificationRepository.findOne(
    (request) => request.providerId === provider.id && request.status === "PENDING",
  );
  if (existing) {
    return { ok: false, error: "You already have a verification request waiting for review." };
  }

  if (!input.businessName.trim() || !input.phone.trim() || !input.identificationInfo.trim()) {
    return { ok: false, error: "Please complete all required verification fields." };
  }

  const now = nowISO();
  const request = verificationRepository.create({
    id: createId("ver"),
    providerId: provider.id,
    businessName: input.businessName.trim(),
    phone: input.phone.trim(),
    location: input.location.trim(),
    identificationInfo: input.identificationInfo.trim(),
    equipmentInfo: input.equipmentInfo.trim(),
    status: "PENDING",
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  providerRepository.update(provider.id, { verificationStatus: "PENDING" });

  // Notify admins.
  userRepository
    .findWhere((user) => user.role === "ADMIN" && user.status === "ACTIVE")
    .forEach((admin) => {
      notify({
        recipientUserId: admin.id,
        type: "VERIFICATION_SUBMITTED",
        title: "New verification request",
        message: `${input.businessName.trim()} submitted verification documents for review.`,
        link: "/admin/verifications",
      });
    });

  return { ok: true, data: request };
}

export function reviewVerification(
  requestId: string,
  decision: "VERIFIED" | "REJECTED",
  note: string,
): Result<VerificationRequest> {
  hydrateDatabase();
  const request = verificationRepository.findById(requestId);
  if (!request) return { ok: false, error: "Verification request not found." };
  if (request.status !== "PENDING") {
    return { ok: false, error: "This request has already been reviewed." };
  }

  const now = nowISO();
  const updated = verificationRepository.update(requestId, {
    status: decision,
    reviewedAt: now,
    reviewNote: note.trim(),
  });
  if (!updated) return { ok: false, error: "Verification request not found." };

  providerRepository.update(request.providerId, {
    verificationStatus: decision,
  });

  const provider = providerRepository.findById(request.providerId);
  const providerUser = provider ? userRepository.findById(provider.userId) : null;
  if (providerUser) {
    notify({
      recipientUserId: providerUser.id,
      type: decision === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
      title: decision === "VERIFIED" ? "Verification approved" : "Verification not approved",
      message:
        decision === "VERIFIED"
          ? `${request.businessName} is now a verified provider on HadaLink.`
          : `Your verification request was not approved. ${note.trim()}`.trim(),
      link: "/provider/verification",
    });
  }

  return { ok: true, data: updated };
}

export function listVerificationRequests(): VerificationRequest[] {
  hydrateDatabase();
  return [...verificationRepository.findAll()].sort((a, b) =>
    a.status === "PENDING" && b.status !== "PENDING"
      ? -1
      : b.status === "PENDING" && a.status !== "PENDING"
        ? 1
        : b.submittedAt.localeCompare(a.submittedAt),
  );
}

export function getVerificationForProvider(providerProfileId: string): VerificationRequest | undefined {
  hydrateDatabase();
  return verificationRepository
    .findWhere((request) => request.providerId === providerProfileId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
}
