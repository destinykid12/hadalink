"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { InlineNote } from "@/components/ui/States";
import { createBooking } from "@/services/bookingService";
import { commissionBreakdown } from "@/services/paymentService";
import { getFarmerProfile } from "@/services/profileService";
import { formatNaira, PRICING_UNIT_LABELS } from "@/lib/format";
import { addDays, formatDate, todayISODate } from "@/lib/dates";
import { validateDate, validateNumber, validateRequired, hasErrors, type FieldErrors } from "@/lib/validation";
import type { ListingWithRelations, User } from "@/types/models";

/**
 * Booking request flow:
 * date -> quantity/service details -> farm location -> notes -> review -> submit.
 */
export function BookingRequestPanel({ listing, user }: { listing: ListingWithRelations; user: User | null }) {
  const router = useRouter();
  const toast = useToast();
  const farmerProfile = useMemo(() => (user ? getFarmerProfile(user.id) : undefined), [user]);

  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState(
    listing.pricingUnit === "PER_HECTARE" || listing.pricingUnit === "PER_HOUR" || listing.pricingUnit === "PER_DAY"
      ? "2"
      : "1",
  );
  const [location, setLocation] = useState(farmerProfile?.farmLocation ?? "");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const quantityNum = Number(quantity) || 1;
  const estimatedAmount =
    listing.pricingUnit === "FIXED" || listing.pricingUnit === "PER_JOB"
      ? listing.price
      : listing.price * quantityNum;
  const breakdown = commissionBreakdown(estimatedAmount);

  const dateBlockedReason = useMemo(() => {
    if (!date) return null;
    if (listing.unavailableDates.includes(date)) {
      return "This date is marked unavailable by the provider (for example maintenance or prior commitments).";
    }
    if (listing.bookedDates.includes(date)) {
      return "This date is already held by another booking. Please choose a different date.";
    }
    return null;
  }, [date, listing]);

  const minDate = todayISODate();
  const maxDate = addDays(todayISODate(), 180);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!user) {
      toast.info("Log in to request a booking", "Create a free farmer account to continue.");
      router.push("/login");
      return;
    }
    if (user.role !== "FARMER") {
      setFormError("Only farmer accounts can request bookings. Switch to the farmer demo to try this.");
      return;
    }
    if (!farmerProfile) {
      setFormError("We could not find your farmer profile. Please complete your profile first.");
      return;
    }

    const nextErrors: FieldErrors = {};
    validateDate(date, "Service date", nextErrors, "date");
    validateNumber(quantity, "Quantity", nextErrors, "quantity", { min: 1, integer: true });
    validateRequired(location, "Farm location", nextErrors, "location");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    if (dateBlockedReason) {
      setErrors({ date: dateBlockedReason });
      return;
    }

    setErrors({});
    setBusy(true);
    const result = createBooking({
      farmerProfileId: farmerProfile.id,
      listingId: listing.id,
      date,
      location,
      notes,
      quantity: quantityNum,
    });
    setBusy(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    toast.success("Booking request sent", `Reference ${result.data.reference}. The provider has been notified.`);
    router.push(`/dashboard/bookings/${result.data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <Input
        label="Service date"
        type="date"
        required
        min={minDate}
        max={maxDate}
        value={date}
        error={errors.date}
        hint={`Pick a date from ${formatDate(minDate)}. Blocked dates are refused with a clear explanation.`}
        onChange={(event) => setDate(event.target.value)}
      />
      {date && !dateBlockedReason ? (
        <InlineNote tone="success">{formatDate(date)} is available for this listing.</InlineNote>
      ) : null}
      {dateBlockedReason ? (
        <InlineNote tone="warning">{dateBlockedReason}</InlineNote>
      ) : null}

      <Input
        label={
          listing.pricingUnit === "PER_HECTARE"
            ? "Area to work (hectares)"
            : listing.pricingUnit === "PER_HOUR"
              ? "Number of hours"
              : listing.pricingUnit === "PER_DAY"
                ? "Number of days"
                : "Quantity"
        }
        type="number"
        min={1}
        step={1}
        required
        value={quantity}
        error={errors.quantity}
        disabled={listing.pricingUnit === "FIXED" || listing.pricingUnit === "PER_JOB"}
        hint={
          listing.pricingUnit === "FIXED" || listing.pricingUnit === "PER_JOB"
            ? `${PRICING_UNIT_LABELS[listing.pricingUnit]}: quantity is fixed at 1.`
            : `Total = ${formatNaira(listing.price)} x quantity.`
        }
        onChange={(event) => setQuantity(event.target.value)}
      />

      <Input
        label="Farm or job location"
        required
        value={location}
        error={errors.location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Village, town, and state where the work will happen"
      />

      <Textarea
        label="Notes for the provider"
        value={notes}
        error={errors.notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Describe the job: farm size, crop, access notes, anything the provider should know."
      />

      <div className="rounded-lg border border-line bg-sand p-4">
        <h3 className="text-sm font-semibold text-ink">Request summary</h3>
        <dl className="mt-2.5 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Listing</dt>
            <dd className="text-right font-medium text-ink">{listing.title}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Provider</dt>
            <dd className="text-right font-medium text-ink">{listing.provider.businessName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Date</dt>
            <dd className="text-right font-medium text-ink">{date ? formatDate(date) : "Not selected"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5">
            <dt className="text-muted">Estimated amount</dt>
            <dd className="text-right font-semibold text-ink">{formatNaira(estimatedAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">
              Includes HadaLink commission ({(breakdown.rate * 100).toFixed(0)}%)
            </dt>
            <dd className="text-right text-ink">{formatNaira(breakdown.commission)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted">
          The provider confirms or rejects this request. Payment is simulated after confirmation.
        </p>
      </div>

      {!user ? (
        <Button
          size="lg"
          fullWidth
          onClick={() => router.push("/login")}
        >
          Log in to request a booking
        </Button>
      ) : (
        <Button type="submit" size="lg" fullWidth disabled={busy || !!dateBlockedReason}>
          {busy ? "Sending request..." : "Review and submit request"}
        </Button>
      )}
    </form>
  );
}
