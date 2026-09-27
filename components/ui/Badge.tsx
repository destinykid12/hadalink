import type { BookingStatus, PaymentStatus, VerificationStatus } from "@/types/models";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  VERIFICATION_LABELS,
} from "@/lib/format";

type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "soft";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-sand-deep text-ink-soft border-line",
  green: "bg-primary-soft text-primary border-primary/20",
  amber: "bg-warning-soft text-warning border-warning/20",
  red: "bg-danger-soft text-danger border-danger/20",
  blue: "bg-white text-ink-soft border-line-strong",
  soft: "bg-accent-soft text-accent border-accent/20",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const bookingTones: Record<BookingStatus, Tone> = {
  PENDING: "amber",
  CONFIRMED: "green",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  REJECTED: "red",
  CANCELLED: "neutral",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={bookingTones[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

const paymentTones: Record<PaymentStatus, Tone> = {
  PENDING: "amber",
  SUCCESSFUL: "green",
  FAILED: "red",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={paymentTones[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

const verificationTones: Record<VerificationStatus, Tone> = {
  UNSUBMITTED: "neutral",
  PENDING: "amber",
  VERIFIED: "green",
  REJECTED: "red",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge tone={verificationTones[status]}>{VERIFICATION_LABELS[status]}</Badge>;
}

export function VerifiedBadge() {
  return (
    <Badge tone="green">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d="m5 13 4 4 10-10" />
      </svg>
      Verified
    </Badge>
  );
}
