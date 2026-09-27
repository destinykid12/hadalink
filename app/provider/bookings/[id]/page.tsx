"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InlineNote, LoadingState, NotFoundState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { MessageThread } from "@/features/messages/MessageThread";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  rejectBooking,
  startBooking,
} from "@/services/bookingService";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatNaira, LISTING_TYPE_LABELS } from "@/lib/format";

export default function ProviderBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const hydrated = useHydration();
  const booking = useBooking(params.id);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <LoadingState label="Loading booking..." />;
  if (!booking) {
    return (
      <NotFoundState
        title="Booking not found"
        message="This booking does not exist or was removed."
        action={
          <Link href="/provider/bookings">
            <Button variant="outline">Back to bookings</Button>
          </Link>
        }
      />
    );
  }

  const run = (
    action: () => { ok: boolean; error?: string },
    successTitle: string,
    successMessage: string,
  ) => {
    setBusy(true);
    const result = action();
    setBusy(false);
    if (!result.ok) {
      toast.error("Action failed", result.error ?? "Unknown error");
      return false;
    }
    toast.success(successTitle, successMessage);
    router.refresh();
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/provider/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <Icon name="arrow-left" size={15} />
            Back to bookings
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{booking.listingTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {booking.transaction ? <PaymentStatusBadge status={booking.transaction.paymentStatus} /> : null}
            <span className="text-xs text-muted">Reference {booking.reference}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {booking.status === "PENDING" ? (
            <>
              <Button
                icon="check"
                disabled={busy}
                onClick={() =>
                  run(
                    () => confirmBooking(booking.id),
                    "Booking accepted",
                    `${booking.farmer.user.name} has been notified.`,
                  )
                }
              >
                Accept booking
              </Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
            </>
          ) : null}
          {booking.status === "CONFIRMED" ? (
            <>
              <Button
                icon="clock"
                disabled={busy}
                onClick={() =>
                  run(
                    () => startBooking(booking.id),
                    "Job started",
                    "The booking is now in progress.",
                  )
                }
              >
                Mark in progress
              </Button>
              <Button icon="check" onClick={() => setCompleteOpen(true)}>
                Mark completed
              </Button>
            </>
          ) : null}
          {booking.status === "IN_PROGRESS" ? (
            <Button icon="check" onClick={() => setCompleteOpen(true)}>
              Mark completed
            </Button>
          ) : null}
          {["PENDING", "CONFIRMED"].includes(booking.status) ? (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              Cancel booking
            </Button>
          ) : null}
        </div>
      </div>

      {booking.status === "PENDING" ? (
        <InlineNote tone="warning">
          Review the request details before accepting. Accepting holds the date and notifies the
          farmer right away.
        </InlineNote>
      ) : null}
      {booking.status === "COMPLETED" ? (
        <InlineNote tone="success">
          This job is complete. A transaction record is available and the farmer can now review
          your service.
        </InlineNote>
      ) : null}
      {booking.status === "REJECTED" ? (
        <InlineNote tone="info">
          You rejected this request. {booking.rejectionReason ? `Note: ${booking.rejectionReason}` : ""}
        </InlineNote>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Request details" />
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Farmer</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.farmer.user.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Farm</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.farmer.farmName}</dd>
              </div>
              <div>
                <dt className="text-muted">Service date</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDate(booking.date)}</dd>
              </div>
              <div>
                <dt className="text-muted">Work location</dt>
                <dd className="mt-0.5 font-medium text-ink">{booking.location}</dd>
              </div>
              <div>
                <dt className="text-muted">Type</dt>
                <dd className="mt-0.5 font-medium text-ink">
                  {LISTING_TYPE_LABELS[booking.listingType]}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Requested on</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDateTime(booking.createdAt)}</dd>
              </div>
            </dl>
            {booking.notes ? (
              <div className="mt-4 rounded-md border border-line bg-sand p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Farmer notes
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{booking.notes}</p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader
              title="Earnings for this job"
              description="Simulated transaction values. HadaLink commission is deducted on successful payment."
            />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Booking amount</dt>
                <dd className="font-semibold text-ink">{formatNaira(booking.amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  HadaLink commission ({(booking.commissionRate * 100).toFixed(0)}%)
                </dt>
                <dd className="text-ink">- {formatNaira(booking.commission)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">You receive</dt>
                <dd className="font-semibold text-primary">{formatNaira(booking.providerAmount)}</dd>
              </div>
            </dl>
            {booking.transaction ? (
              <p className="mt-3 text-xs text-muted">
                Payment status: {booking.transaction.paymentStatus.toLowerCase()} | Reference{" "}
                {booking.transaction.reference}
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted">
                No payment record yet. The farmer completes the simulated payment after you confirm.
              </p>
            )}
          </Card>

          {user ? (
            <Card>
              <MessageThread bookingId={booking.id} currentUserId={user.id} />
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Farmer" />
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={booking.farmer.user.avatar || "/images/farm-scene.jpg"}
                alt=""
                className="h-12 w-12 rounded-full border border-line object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-ink">{booking.farmer.user.name}</p>
                <p className="text-xs text-muted">{booking.farmer.user.phone}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Farm size</dt>
                <dd className="text-ink">{booking.farmer.farmSize} hectares</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Farm location</dt>
                <dd className="text-right text-ink">{booking.farmer.farmLocation}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Listing" />
            <Link href={`/listings/${booking.listingId}`} className="block">
              <Button variant="outline" fullWidth size="sm">
                View listing
              </Button>
            </Link>
            <Link href={`/provider/listings/${booking.listingId}/edit`} className="mt-2 block">
              <Button variant="ghost" fullWidth size="sm" icon="edit">
                Edit listing
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Reject modal */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject this booking request"
        description="The farmer will be notified with your reason."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Keep request
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                const reason = rejectReason.trim() || "Provider is not available on this date.";
                if (run(() => rejectBooking(booking.id, reason), "Request rejected", "The farmer has been notified.")) {
                  setRejectOpen(false);
                  setRejectReason("");
                }
              }}
            >
              Reject request
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason (shared with the farmer)"
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="e.g. Our equipment is already committed on that date."
        />
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this booking?"
        message={`Cancel ${booking.farmer.user.name}'s booking for ${formatDate(booking.date)}? The farmer will be notified and the date will be released.`}
        confirmLabel="Yes, cancel"
        danger
        busy={busy}
        onConfirm={() => {
          if (run(() => cancelBooking(booking.id, "provider"), "Booking cancelled", "The farmer has been notified.")) {
            setCancelOpen(false);
          }
        }}
        onCancel={() => setCancelOpen(false)}
      />

      <ConfirmDialog
        open={completeOpen}
        title="Mark this job as completed?"
        message="Marking this job completed creates a transaction record and unlocks the farmer review form."
        confirmLabel="Mark completed"
        busy={busy}
        onConfirm={() => {
          if (run(() => completeBooking(booking.id), "Job completed", "The farmer can now leave a review.")) {
            setCompleteOpen(false);
          }
        }}
        onCancel={() => setCompleteOpen(false)}
      />
    </div>
  );
}
