"use client";

import Link from "next/link";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/dates";
import { formatNaira, LISTING_TYPE_LABELS } from "@/lib/format";
import type { BookingWithRelations } from "@/types/models";

export function BookingCard({
  booking,
  href,
  perspective,
}: {
  booking: BookingWithRelations;
  href: string;
  perspective: "farmer" | "provider";
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-line bg-white p-4 shadow-card transition-colors hover:border-primary/40 hover:bg-primary-soft/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {booking.transaction ? (
              <PaymentStatusBadge status={booking.transaction.paymentStatus} />
            ) : null}
            <span className="text-xs text-muted">{booking.reference}</span>
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-ink">{booking.listingTitle}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Icon name="pin" size={13} />
            <span className="truncate">{booking.location}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Icon name="calendar" size={13} />
            {formatDate(booking.date)}
            <span className="text-line-strong">|</span>
            {perspective === "farmer"
              ? booking.provider.businessName
              : booking.farmer.user.name}
            <span className="text-line-strong">|</span>
            {LISTING_TYPE_LABELS[booking.listingType]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-ink">{formatNaira(booking.amount)}</p>
          <p className="mt-1 text-xs text-muted">View details</p>
        </div>
      </div>
    </Link>
  );
}
