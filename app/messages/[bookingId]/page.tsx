"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { BookingStatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { LoadingState, NotFoundState } from "@/components/ui/States";
import { MessageThread } from "@/features/messages/MessageThread";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useListings";
import { useHydration } from "@/hooks/useDatabase";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";

function ThreadContent() {
  const params = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const hydrated = useHydration();
  const booking = useBooking(params.bookingId);

  if (!hydrated || !user) return <LoadingState label="Loading conversation..." />;
  if (!booking) {
    return (
      <NotFoundState
        title="Conversation not found"
        message="This booking does not exist, so there is no conversation to show."
        action={
          <Link href="/messages">
            <Button variant="outline">Back to messages</Button>
          </Link>
        }
      />
    );
  }

  const backHref = user.role === "PROVIDER" ? "/provider/bookings" : "/dashboard/bookings";
  const detailHref =
    user.role === "PROVIDER"
      ? `/provider/bookings/${booking.id}`
      : `/dashboard/bookings/${booking.id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <Icon name="arrow-left" size={15} />
          Back to bookings
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {booking.listingTitle}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BookingStatusBadge status={booking.status} />
              <span className="text-xs text-muted">Booking {booking.reference}</span>
            </div>
          </div>
          <Link href={detailHref}>
            <Button variant="outline" size="sm">
              Open booking
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Booking context"
          description="Messages are tied to this booking so both sides keep a record of the arrangement."
        />
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Date</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDate(booking.date)}</dd>
          </div>
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="mt-0.5 font-medium text-ink">{booking.location}</dd>
          </div>
          <div>
            <dt className="text-muted">Amount</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatNaira(booking.amount)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <MessageThread bookingId={booking.id} currentUserId={user.id} />
      </Card>
    </div>
  );
}

export default function MessageThreadPage() {
  return (
    <RoleGuard allow={["FARMER", "PROVIDER", "ADMIN"]}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="page-shell py-8">
            <ThreadContent />
          </div>
        </main>
        <SiteFooter />
      </div>
    </RoleGuard>
  );
}
