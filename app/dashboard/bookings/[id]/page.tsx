"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { BookingStatusBadge, PaymentStatusBadge, VerificationBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { RatingStars } from "@/components/ui/RatingStars";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InlineNote, LoadingState, NotFoundState } from "@/components/ui/States";
import { MessageThread } from "@/features/messages/MessageThread";
import { ReviewForm } from "@/features/reviews/ReviewForm";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import { getFarmerProfile } from "@/services/profileService";
import { cancelBooking } from "@/services/bookingService";
import { canReviewBooking } from "@/services/reviewService";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatNaira, PRICING_UNIT_LABELS, LISTING_TYPE_LABELS } from "@/lib/format";

export default function FarmerBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const { user } = useAuth();
  const hydrated = useHydration();
  const booking = useBooking(params.id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const farmer = useMemo(() => (user ? getFarmerProfile(user.id) : undefined), [user]);
  const canReview = useMemo(
    () => (farmer && booking ? canReviewBooking(booking.id, farmer.id) : false),
    [farmer, booking],
  );

  if (!hydrated) return <LoadingState label="Loading booking..." />;
  if (!booking) {
    return (
      <NotFoundState
        title="Booking not found"
        message="This booking does not exist or was removed."
        action={
          <Link href="/dashboard/bookings">
            <Button variant="outline">Back to bookings</Button>
          </Link>
        }
      />
    );
  }

  const transaction = booking.transaction;
  const cancellable = ["PENDING", "CONFIRMED"].includes(booking.status);
  const payable =
    ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status) &&
    (!transaction || transaction.paymentStatus !== "SUCCESSFUL");

  const onCancel = () => {
    setBusy(true);
    const result = cancelBooking(booking.id, "farmer");
    setBusy(false);
    setCancelOpen(false);
    if (!result.ok) {
      toast.error("Could not cancel booking", result.error);
      return;
    }
    toast.success("Booking cancelled", "The provider has been notified and the date was released.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <Icon name="arrow-left" size={15} />
            Back to bookings
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{booking.listingTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {transaction ? <PaymentStatusBadge status={transaction.paymentStatus} /> : null}
            <span className="text-xs text-muted">Reference {booking.reference}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {payable ? (
            <Link href={`/dashboard/bookings/${booking.id}/payment`}>
              <Button icon="wallet">
                {transaction ? "Retry payment" : "Proceed to payment"}
              </Button>
            </Link>
          ) : null}
          {cancellable ? (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel booking
            </Button>
          ) : null}
        </div>
      </div>

      {booking.status === "PENDING" ? (
        <InlineNote tone="warning">
          Your request is waiting for {booking.provider.businessName} to respond. You will receive a
          notification when the provider accepts or rejects it.
        </InlineNote>
      ) : null}
      {booking.status === "CONFIRMED" && !transaction ? (
        <InlineNote tone="warning">
          This booking is confirmed. Continue to the simulated payment step to complete the record.
        </InlineNote>
      ) : null}
      {booking.status === "COMPLETED" && canReview ? (
        <InlineNote tone="success">
          This job is complete. You can now leave a review for {booking.provider.businessName}.
        </InlineNote>
      ) : null}
      {booking.status === "REJECTED" ? (
        <InlineNote tone="warning">
          This request was not accepted.{" "}
          {booking.rejectionReason ? `Provider note: ${booking.rejectionReason}` : ""}
        </InlineNote>
      ) : null}
      {booking.status === "CANCELLED" ? (
        <InlineNote tone="info">
          This booking was cancelled{booking.cancelledBy ? ` by the ${booking.cancelledBy}` : ""}.
        </InlineNote>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Booking summary */}
          <Card>
            <CardHeader title="Booking details" />
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Service date</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDate(booking.date)}</dd>
              </div>
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.location}</dd>
              </div>
              <div>
                <dt className="text-muted">Type</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {LISTING_TYPE_LABELS[booking.listingType]}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Quantity</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {booking.quantity} x {PRICING_UNIT_LABELS[booking.listing.pricingUnit]}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Requested on</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDateTime(booking.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted">Last updated</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDateTime(booking.updatedAt)}</dd>
              </div>
            </dl>
            {booking.notes ? (
              <div className="mt-4 rounded-md border border-line bg-sand p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your notes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{booking.notes}</p>
              </div>
            ) : null}
          </Card>

          {/* Transaction */}
          <Card>
            <CardHeader
              title="Payment record"
              description="All payments in this prototype are simulated. No real money moves."
            />
            {transaction ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">Transaction reference</p>
                    <p className="text-sm font-semibold text-ink">{transaction.reference}</p>
                  </div>
                  <PaymentStatusBadge status={transaction.paymentStatus} />
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Gross amount</dt>
                    <dd className="font-semibold text-ink">{formatNaira(transaction.grossAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">
                      HadaLink commission ({(transaction.commissionRate * 100).toFixed(0)}%)
                    </dt>
                    <dd className="text-ink">{formatNaira(transaction.commission)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2">
                    <dt className="text-muted">Provider amount</dt>
                    <dd className="font-semibold text-ink">{formatNaira(transaction.providerAmount)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted">
                  Method: {transaction.paymentMethod}
                  {transaction.paidAt ? ` | Paid ${formatDateTime(transaction.paidAt)}` : ""}
                </p>
                {transaction.paymentStatus !== "SUCCESSFUL" && payable ? (
                  <Link href={`/dashboard/bookings/${booking.id}/payment`} className="inline-block mt-4">
                    <Button size="sm" variant="outline">
                      {transaction.paymentStatus === "FAILED" ? "Try payment again" : "Complete payment"}
                    </Button>
                  </Link>
                ) : null}
              </>
            ) : (
              <div>
                <p className="text-sm text-muted">No payment has been recorded for this booking yet.</p>
                {payable ? (
                  <Link href={`/dashboard/bookings/${booking.id}/payment`} className="inline-block mt-3">
                    <Button size="sm" icon="wallet">
                      Proceed to payment
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}
          </Card>

          {/* Review */}
          <Card>
            <CardHeader
              title="Review"
              description="Reviews are allowed only after the service is completed."
            />
            {booking.review ? (
              <div>
                <RatingStars value={booking.review.rating} showValue={false} />
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{booking.review.comment}</p>
                <p className="mt-2 text-xs text-muted">
                  Submitted {formatDate(booking.review.createdAt)}
                </p>
              </div>
            ) : canReview ? (
              showReviewForm ? (
                <ReviewForm
                  bookingId={booking.id}
                  farmerProfileId={farmer?.id ?? ""}
                  listingTitle={booking.listingTitle}
                  onDone={() => setShowReviewForm(false)}
                />
              ) : (
                <Button onClick={() => setShowReviewForm(true)}>Leave a review</Button>
              )
            ) : (
              <p className="text-sm text-muted">
                {booking.status === "COMPLETED"
                  ? "You have already reviewed this booking."
                  : "The review form will unlock once this job is marked completed."}
              </p>
            )}
          </Card>

          {/* Messages */}
          {user ? (
            <Card>
              <MessageThread bookingId={booking.id} currentUserId={user.id} />
            </Card>
          ) : null}
        </div>

        {/* Provider sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Provider" />
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booking.provider.user.avatar || "/images/service-team.jpg"}
                alt=""
                className="h-12 w-12 rounded-full border border-line object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-ink">{booking.provider.businessName}</p>
                <p className="text-xs text-muted">{booking.provider.user.name}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <VerificationBadge status={booking.provider.verificationStatus} />
              <RatingStars
                value={booking.provider.rating}
                count={booking.provider.reviewCount}
                size={13}
              />
            </div>
            <div className="mt-4 space-y-2">
              <Link href={`/providers/${booking.provider.id}`} className="block">
                <Button variant="outline" fullWidth size="sm">
                  View provider profile
                </Button>
              </Link>
              <Link href={`/listings/${booking.listingId}`} className="block">
                <Button variant="ghost" fullWidth size="sm">
                  View original listing
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Amount breakdown" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Booking amount</dt>
                <dd className="font-semibold text-ink">{formatNaira(booking.amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  Commission ({(booking.commissionRate * 100).toFixed(0)}%)
                </dt>
                <dd className="text-ink">{formatNaira(booking.commission)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Provider receives</dt>
                <dd className="font-semibold text-ink">{formatNaira(booking.providerAmount)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">
              Simulated transaction example. There is no real payment gateway in this prototype.
            </p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this booking?"
        message={`Cancel your ${booking.listingTitle} booking for ${formatDate(booking.date)}? The provider will be notified and the date will be released.`}
        confirmLabel="Yes, cancel booking"
        danger
        busy={busy}
        onConfirm={onCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
