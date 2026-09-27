/**
 * Simulated payment service.
 * There is no real payment gateway. Every payment here is simulated and
 * labelled as such in the UI. Records persist in localStorage.
 */

import { hydrateDatabase } from "@/lib/db";
import { createId, createReference } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import {
  bookingRepository,
  farmerRepository,
  providerRepository,
  settingsRepository,
  transactionRepository,
  userRepository,
} from "@/repositories";
import type { PaymentStatus, Result, Transaction } from "@/types/models";
import { notify } from "@/services/notificationService";
import { getCurrentUser, requireRole } from "@/services/authService";

export interface SimulatePaymentInput {
  bookingId: string;
  outcome: Extract<PaymentStatus, "SUCCESSFUL" | "FAILED" | "PENDING">;
  method?: string;
}

/**
 * Create or update the transaction for a booking with a simulated outcome.
 * Booking must be CONFIRMED or later.
 */
export function simulatePayment(input: SimulatePaymentInput): Result<Transaction> {
  hydrateDatabase();
  const actor = requireRole(getCurrentUser(), ["FARMER", "ADMIN"]);
  if (!actor.ok) return actor;
  const booking = bookingRepository.findById(input.bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (actor.data.role === "FARMER") {
    const farmer = farmerRepository.findById(booking.farmerId);
    if (!farmer || farmer.userId !== actor.data.id) {
      return { ok: false, error: "You can only pay for your own bookings." };
    }
  }
  if (booking.status === "REJECTED" || booking.status === "CANCELLED" || booking.status === "PENDING") {
    return {
      ok: false,
      error: "Payment can only be made for confirmed or active bookings.",
    };
  }

  const now = nowISO();
  const existing = transactionRepository.findOne((txn) => txn.bookingId === booking.id);

  let transaction: Transaction;
  if (existing) {
    const updated = transactionRepository.update(existing.id, {
      paymentStatus: input.outcome,
      paymentMethod: input.method ?? existing.paymentMethod,
      paidAt: input.outcome === "SUCCESSFUL" ? now : existing.paidAt,
    });
    transaction = updated ?? existing;
  } else {
    transaction = transactionRepository.create({
      id: createId("txn"),
      reference: createReference("PAY"),
      bookingId: booking.id,
      farmerId: booking.farmerId,
      providerId: booking.providerId,
      listingId: booking.listingId,
      grossAmount: booking.amount,
      commissionRate: booking.commissionRate,
      commission: booking.commission,
      providerAmount: booking.providerAmount,
      paymentStatus: input.outcome,
      paymentMethod: input.method ?? "Simulated bank transfer",
      paidAt: input.outcome === "SUCCESSFUL" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });
  }

  const farmer = farmerRepository.findById(booking.farmerId);
  const provider = providerRepository.findById(booking.providerId);
  const farmerUser = farmer ? userRepository.findById(farmer.userId) : null;
  const providerUser = provider ? userRepository.findById(provider.userId) : null;

  const amountLabel = `₦${booking.amount.toLocaleString("en-NG")}`;

  if (farmerUser) {
    const farmerCopy: Record<string, { type: Parameters<typeof notify>[0]["type"]; title: string; message: string }> = {
      SUCCESSFUL: {
        type: "PAYMENT_SUCCESSFUL",
        title: "Payment successful",
        message: `Simulated payment of ${amountLabel} for ${booking.listingTitle} was successful.`,
      },
      FAILED: {
        type: "PAYMENT_FAILED",
        title: "Payment failed",
        message: `Simulated payment of ${amountLabel} for ${booking.listingTitle} failed. You can try again.`,
      },
      PENDING: {
        type: "PAYMENT_PENDING",
        title: "Payment pending",
        message: `Simulated payment of ${amountLabel} for ${booking.listingTitle} is pending confirmation.`,
      },
    };
    const copy = farmerCopy[input.outcome];
    notify({
      recipientUserId: farmerUser.id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      link: "/dashboard/transactions",
    });
  }

  if (providerUser && input.outcome === "SUCCESSFUL") {
    notify({
      recipientUserId: providerUser.id,
      type: "PAYMENT_RECEIVED",
      title: "Payment recorded",
      message: `Simulated payment of ${amountLabel} for booking ${booking.reference} was successful. Your share is ₦${booking.providerAmount.toLocaleString("en-NG")}.`,
      link: "/provider/earnings",
    });
  }

  return { ok: true, data: transaction };
}

/** Guarantee a transaction exists once a booking is completed. */
export function ensureTransactionForBooking(bookingId: string): Transaction | null {
  hydrateDatabase();
  const booking = bookingRepository.findById(bookingId);
  if (!booking) return null;
  const existing = transactionRepository.findOne((txn) => txn.bookingId === bookingId);
  if (existing) return existing;

  const now = nowISO();
  return transactionRepository.create({
    id: createId("txn"),
    reference: createReference("PAY"),
    bookingId: booking.id,
    farmerId: booking.farmerId,
    providerId: booking.providerId,
    listingId: booking.listingId,
    grossAmount: booking.amount,
    commissionRate: booking.commissionRate,
    commission: booking.commission,
    providerAmount: booking.providerAmount,
    paymentStatus: "PENDING",
    paymentMethod: "Simulated bank transfer",
    createdAt: now,
    updatedAt: now,
  });
}

export function getTransactionForBooking(bookingId: string): Transaction | undefined {
  hydrateDatabase();
  return transactionRepository.findOne((txn) => txn.bookingId === bookingId);
}

export function listTransactionsForFarmer(farmerProfileId: string): Transaction[] {
  hydrateDatabase();
  return transactionRepository
    .findWhere((txn) => txn.farmerId === farmerProfileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listTransactionsForProvider(providerProfileId: string): Transaction[] {
  hydrateDatabase();
  return transactionRepository
    .findWhere((txn) => txn.providerId === providerProfileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllTransactions(): Transaction[] {
  hydrateDatabase();
  return [...transactionRepository.findAll()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export interface CommissionBreakdown {
  gross: number;
  rate: number;
  commission: number;
  providerAmount: number;
}

export function commissionBreakdown(gross: number): CommissionBreakdown {
  const rate = settingsRepository.get().commissionRate;
  const commission = Math.round(gross * rate);
  return { gross, rate, commission, providerAmount: gross - commission };
}
