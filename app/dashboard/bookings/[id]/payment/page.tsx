"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { InlineNote, LoadingState, NotFoundState } from "@/components/ui/States";
import { useBooking } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import { simulatePayment } from "@/services/paymentService";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { PaymentStatus } from "@/types/models";

type SimOutcome = Extract<PaymentStatus, "SUCCESSFUL" | "FAILED" | "PENDING">;

export default function BookingPaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydration();
  const booking = useBooking(params.id);
  const [outcome, setOutcome] = useState<SimOutcome>("SUCCESSFUL");
  const [method, setMethod] = useState("Simulated bank transfer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingTxn = booking?.transaction;

  const summary = useMemo(() => {
    if (!booking) return null;
    return {
      gross: booking.amount,
      commission: booking.commission,
      commissionRate: booking.commissionRate,
      providerAmount: booking.providerAmount,
    };
  }, [booking]);

  if (!hydrated) return <LoadingState label="Loading payment..." />;
  if (!booking || !summary) {
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

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = simulatePayment({ bookingId: booking.id, outcome, method });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (outcome === "SUCCESSFUL") {
      toast.success("Payment successful (simulated)", "The transaction record has been created.");
    } else if (outcome === "FAILED") {
      toast.error("Payment failed (simulated)", "You can try again from the booking page.");
    } else {
      toast.info("Payment pending (simulated)", "The transaction is recorded as pending.");
    }
    router.push(`/dashboard/bookings/${booking.id}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <Icon name="arrow-left" size={15} />
          Back to booking
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Simulated payment</h1>
        <p className="mt-1 text-sm text-muted">
          Booking {booking.reference} | {booking.listingTitle}
        </p>
      </div>

      <InlineNote tone="warning">
        This is a simulated payment flow. There is no real payment gateway and no money will move.
        Choose an outcome below to create a realistic payment record for the demo.
      </InlineNote>

      {/* Payment summary */}
      <Card>
        <CardHeader title="Payment summary" description={`Service date: ${formatDate(booking.date)}`} />
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Provider</dt>
            <dd className="font-medium text-ink">{booking.provider.businessName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Gross amount</dt>
            <dd className="font-semibold text-ink">{formatNaira(summary.gross)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">
              HadaLink commission ({(summary.commissionRate * 100).toFixed(0)}%)
            </dt>
            <dd className="text-ink">{formatNaira(summary.commission)}</dd>
          </div>
          <div className="flex justify-between rounded-md border border-primary/25 bg-primary-soft px-3 py-2">
            <dt className="text-primary">Provider amount</dt>
            <dd className="font-semibold text-primary">{formatNaira(summary.providerAmount)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Example: on a ₦100,000 transaction, a 5% commission is ₦5,000 and the provider receives
          ₦95,000. Your booking is calculated the same way.
        </p>
      </Card>

      {/* Simulated payment form */}
      <Card>
        <CardHeader
          title="Complete payment"
          description="Choose the simulated outcome and method, then confirm."
        />
        <form onSubmit={onSubmit} className="space-y-5">
          {error ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <fieldset>
            <legend className="text-sm font-medium text-ink">Payment method (simulated)</legend>
            <div className="mt-2 space-y-2">
              {["Simulated bank transfer", "Simulated card payment", "Simulated mobile money"].map(
                (option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm ${
                      method === option
                        ? "border-primary bg-primary-soft text-ink"
                        : "border-line text-ink-soft hover:bg-sand"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option}
                      checked={method === option}
                      onChange={() => setMethod(option)}
                      className="h-4 w-4 border-line-strong text-primary focus:ring-primary"
                    />
                    {option}
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-ink">Simulated outcome (for the demo)</legend>
            <div className="mt-2 space-y-2">
              {[
                {
                  value: "SUCCESSFUL" as SimOutcome,
                  label: "Payment successful",
                  hint: "Creates a successful transaction record.",
                },
                {
                  value: "PENDING" as SimOutcome,
                  label: "Payment pending",
                  hint: "Records the transaction as awaiting confirmation.",
                },
                {
                  value: "FAILED" as SimOutcome,
                  label: "Payment failed",
                  hint: "Simulates a failed payment you can retry later.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3.5 py-2.5 ${
                    outcome === option.value
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:bg-sand"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-outcome"
                    value={option.value}
                    checked={outcome === option.value}
                    onChange={() => setOutcome(option.value)}
                    className="mt-0.5 h-4 w-4 border-line-strong text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="block text-xs text-muted">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-md border border-line bg-sand p-3.5 text-sm">
            <p className="font-medium text-ink">
              You are paying {formatNaira(summary.gross)} (simulated)
            </p>
            <p className="mt-1 text-xs text-muted">
              {existingTxn
                ? `Existing record ${existingTxn.reference} will be updated with this outcome.`
                : "A transaction record will be created and stored in this browser."}
            </p>
          </div>

          <Button type="submit" size="lg" fullWidth disabled={busy} icon="wallet">
            {busy ? "Processing (simulated)..." : `Confirm simulated payment of ${formatNaira(summary.gross)}`}
          </Button>
        </form>
      </Card>
    </div>
  );
}
