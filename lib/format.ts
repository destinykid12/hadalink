import type {
  BookingStatus,
  EquipmentCondition,
  ListingType,
  PaymentStatus,
  PricingUnit,
  VerificationStatus,
} from "@/types/models";

/** Formatting helpers for display copy and labels. */

export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₦${safe.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function formatNairaCompact(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (safe >= 1_000_000) return `₦${(safe / 1_000_000).toFixed(1)}M`;
  if (safe >= 1_000) return `₦${(safe / 1_000).toFixed(0)}k`;
  return `₦${safe.toLocaleString("en-NG")}`;
}

export const PRICING_UNIT_LABELS: Record<PricingUnit, string> = {
  FIXED: "Fixed price",
  PER_HOUR: "Per hour",
  PER_HECTARE: "Per hectare",
  PER_DAY: "Per day",
  PER_JOB: "Per job",
};

export function priceWithUnit(price: number, unit: PricingUnit): string {
  return `${formatNaira(price)} ${PRICING_UNIT_LABELS[unit].toLowerCase()}`;
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  SUCCESSFUL: "Payment successful",
  FAILED: "Payment failed",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  UNSUBMITTED: "Not submitted",
  PENDING: "Verification pending",
  VERIFIED: "Verified provider",
  REJECTED: "Verification rejected",
};

export const CONDITION_LABELS: Record<EquipmentCondition, string> = {
  NEW: "New",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  EQUIPMENT: "Equipment",
  SERVICE: "Service",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
