"use client";

import { useMemo, useState } from "react";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { BookingCard } from "@/features/bookings/BookingCard";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useDatabase";
import { useProviderBookings } from "@/hooks/useListings";
import { getProviderProfile } from "@/services/profileService";
import { BOOKING_STATUS_LABELS } from "@/lib/format";
import type { BookingStatus } from "@/types/models";

const FILTERS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All bookings" },
  { value: "PENDING", label: BOOKING_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: BOOKING_STATUS_LABELS.CONFIRMED },
  { value: "IN_PROGRESS", label: BOOKING_STATUS_LABELS.IN_PROGRESS },
  { value: "COMPLETED", label: BOOKING_STATUS_LABELS.COMPLETED },
  { value: "REJECTED", label: BOOKING_STATUS_LABELS.REJECTED },
  { value: "CANCELLED", label: BOOKING_STATUS_LABELS.CANCELLED },
];

export default function ProviderBookingsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const bookings = useProviderBookings(provider?.id ?? "");
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");

  if (!hydrated) return <LoadingState label="Loading bookings..." />;

  const visible = filter === "ALL" ? bookings : bookings.filter((booking) => booking.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
        <p className="mt-1 text-sm text-muted">
          Accept or reject requests, manage active jobs, and mark work completed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter bookings by status">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              filter === option.value
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-white text-ink-soft hover:bg-sand-deep"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No bookings here"
          message={
            filter === "ALL"
              ? "Booking requests from farmers will appear here."
              : `No bookings with the status "${FILTERS.find((option) => option.value === filter)?.label}".`
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              href={`/provider/bookings/${booking.id}`}
              perspective="provider"
            />
          ))}
        </div>
      )}
    </div>
  );
}
