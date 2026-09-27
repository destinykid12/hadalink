"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatCard, Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookingStatusBadge, VerificationBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState, InlineNote } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { useProviderBookings, useProviderListings, useNotifications } from "@/hooks/useListings";
import { getProviderProfile } from "@/services/profileService";
import { computeProviderStats } from "@/services/analyticsService";
import { formatNaira } from "@/lib/format";
import { relativeTime } from "@/lib/dates";

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();

  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const listings = useProviderListings(provider?.id ?? "");
  const bookings = useProviderBookings(provider?.id ?? "");
  const notifications = useNotifications(user?.id ?? "");
  const stats = useMemo(() => (provider ? computeProviderStats(provider.id) : null), [provider]);

  if (!hydrated || !user || !provider || !stats) {
    return <LoadingState label="Loading your provider dashboard..." />;
  }

  const pending = bookings.filter((booking) => booking.status === "PENDING").slice(0, 4);
  const active = bookings
    .filter((booking) => ["CONFIRMED", "IN_PROGRESS"].includes(booking.status))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{provider.businessName}</h1>
          <p className="mt-1 text-sm text-muted">{user.location}</p>
          <div className="mt-2">
            <VerificationBadge status={provider.verificationStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/provider/listings/new">
            <Button icon="plus">Add listing</Button>
          </Link>
          <Link href="/provider/bookings">
            <Button variant="outline" icon="calendar">
              Manage bookings
            </Button>
          </Link>
        </div>
      </div>

      {provider.verificationStatus !== "VERIFIED" ? (
        <InlineNote tone="warning">
          Your verification status is {provider.verificationStatus.toLowerCase()}.{" "}
          <Link href="/provider/verification" className="font-medium text-primary underline">
            Submit or review your verification details
          </Link>{" "}
          to build trust with farmers.
        </InlineNote>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total listings" value={stats.totalListings} hint={`${stats.activeListings} active`} />
        <StatCard label="Booking requests" value={stats.bookingRequests} accent hint="Waiting for your response" />
        <StatCard label="Completed jobs" value={stats.completedJobs} />
        <StatCard label="Earnings" value={formatNaira(stats.earnings)} hint="After commission, simulated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending requests */}
        <Card>
          <CardHeader
            title="Booking requests"
            action={
              <Link href="/provider/bookings" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            }
          />
          {pending.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No pending requests"
              message="New booking requests from farmers will appear here."
            />
          ) : (
            <ul className="space-y-3">
              {pending.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3.5 py-3">
                  <div>
                    <Link
                      href={`/provider/bookings/${booking.id}`}
                      className="text-sm font-medium text-ink hover:text-primary"
                    >
                      {booking.listingTitle}
                    </Link>
                    <p className="text-xs text-muted">
                      {booking.farmer.user.name} | {booking.date}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Active jobs */}
        <Card>
          <CardHeader title="Confirmed and active jobs" />
          {active.length === 0 ? (
            <EmptyState
              icon="tools"
              title="No active jobs"
              message="Accepted bookings will appear here until they are completed."
            />
          ) : (
            <ul className="space-y-3">
              {active.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3.5 py-3">
                  <div>
                    <Link
                      href={`/provider/bookings/${booking.id}`}
                      className="text-sm font-medium text-ink hover:text-primary"
                    >
                      {booking.listingTitle}
                    </Link>
                    <p className="text-xs text-muted">
                      {booking.farmer.user.name} | {formatNaira(booking.amount)}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Listings overview */}
        <Card>
          <CardHeader
            title="Your listings"
            action={
              <Link href="/provider/listings" className="text-sm font-medium text-primary hover:underline">
                Manage
              </Link>
            }
          />
          {listings.length === 0 ? (
            <EmptyState
              icon="tractor"
              title="No listings yet"
              message="Create your first listing so farmers can find your equipment."
              action={
                <Link href="/provider/listings/new">
                  <Button size="sm">Add listing</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {listings.slice(0, 5).map((listing) => (
                <li key={listing.id} className="flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/listings/${listing.id}`} className="text-sm font-medium text-ink hover:text-primary">
                      {listing.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {formatNaira(listing.price)} | {listing.status === "ACTIVE" ? "Active" : "Disabled"}
                    </p>
                  </div>
                  <Link href={`/provider/listings/${listing.id}/edit`}>
                    <Button variant="ghost" size="sm" icon="edit">
                      Edit
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader
            title="Recent notifications"
            action={
              <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            }
          />
          {notifications.length === 0 ? (
            <p className="text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-line-strong" : "bg-accent"}`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.message} | {relativeTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Reviews summary */}
      <Card>
        <CardHeader
          title="Reputation"
          description="Ratings come from completed bookings on the platform."
          action={
            <Link href="/provider/reviews">
              <Button variant="outline" size="sm">
                View reviews
              </Button>
            </Link>
          }
        />
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Average rating</p>
            <p className="text-2xl font-semibold text-ink">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "No ratings yet"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Reviews</p>
            <p className="text-2xl font-semibold text-ink">{stats.reviewCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Commission paid</p>
            <p className="text-2xl font-semibold text-ink">{formatNaira(stats.commissionPaid)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
