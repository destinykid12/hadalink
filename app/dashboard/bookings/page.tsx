"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { BookingCard } from "@/features/bookings/BookingCard";
import { useAuth } from "@/hooks/useAuth";
import { useFarmerBookings } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import { getFarmerProfile } from "@/services/profileService";
import type { BookingStatus } from "@/types/models";
import { BOOKING_STATUS_LABELS } from "@/lib/format";

const FILTERS: { value: BookingStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All bookings" },
  { value: "PENDING", label: BOOKING_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: BOOKING_STATUS_LABELS.CONFIRMED },
  { value: "IN_PROGRESS", label: BOOKING_STATUS_LABELS.IN_PROGRESS },
  { value: "COMPLETED", label: BOOKING_STATUS_LABELS.COMPLETED },
  { value: "REJECTED", label: BOOKING_STATUS_LABELS.REJECTED },
  { value: "CANCELLED", label: BOOKING_STATUS_LABELS.CANCELLED },
];

export default function FarmerBookingsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  const farmer = useMemo(() => (user ? getFarmerProfile(user.id) : undefined), [user]);
  const bookings = useFarmerBookings(farmer?.id ?? "");
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");

  if (!hydrated) return <LoadingState label="Loading bookings..." />;

  const visible = filter === "ALL" ? bookings : bookings.filter((booking) => booking.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">My bookings</h1>
        <p className="mt-1 text-sm text-muted">Track every request, booking, and completed job.</p>
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
          title="You don't have any bookings yet."
          message={
            filter === "ALL"
              ? "Search equipment or services and send your first booking request."
              : `No bookings with the status "${FILTERS.find((option) => option.value === filter)?.label}".`
          }
          action={
            <Link href="/equipment">
              <Button>Find equipment</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              href={`/dashboard/bookings/${booking.id}`}
              perspective="farmer"
            />
          ))}
        </div>
      )}
    </div>
  );
}
