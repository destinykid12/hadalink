"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatCard, Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { BookingCard } from "@/features/bookings/BookingCard";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { useFarmerBookings, useNotifications, useSavedListings } from "@/hooks/useListings";
import { getFarmerProfile } from "@/services/profileService";
import { computeFarmerStats } from "@/services/analyticsService";
import { relativeTime } from "@/lib/dates";
import { formatNaira } from "@/lib/format";

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();

  const farmer = useMemo(() => (user ? getFarmerProfile(user.id) : undefined), [user]);
  const bookings = useFarmerBookings(farmer?.id ?? "");
  const saved = useSavedListings(user?.id ?? "");
  const notifications = useNotifications(user?.id ?? "");
  const stats = useMemo(
    () => (farmer ? computeFarmerStats(farmer.id) : null),
    [farmer],
  );

  if (!hydrated || !user || !farmer || !stats) return <LoadingState label="Loading your dashboard..." />;

  const upcoming = bookings
    .filter((booking) => ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(booking.status))
    .slice(0, 4);
  const completed = bookings.filter((booking) => booking.status === "COMPLETED").slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Hello, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted">
          {farmer.farmName} | {farmer.farmSize} hectares | {farmer.farmLocation}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming bookings" value={stats.upcomingBookings} hint="Confirmed and active work" />
        <StatCard label="Pending requests" value={stats.pendingRequests} hint="Waiting for provider response" />
        <StatCard label="Completed bookings" value={stats.completedBookings} accent />
        <StatCard label="Total spent" value={formatNaira(stats.totalSpent)} hint="Simulated payments" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/equipment">
          <Button icon="search">Find equipment</Button>
        </Link>
        <Link href="/services">
          <Button variant="outline" icon="tools">
            Find services
          </Button>
        </Link>
        <Link href="/dashboard/saved">
          <Button variant="outline" icon="bookmark">
            Saved listings ({saved.length})
          </Button>
        </Link>
      </div>

      {/* Bookings */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Your bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="calendar"
              title="You don't have any bookings yet."
              message="Search equipment or services and send your first booking request."
              action={
                <Link href="/equipment">
                  <Button>Find equipment</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                href={`/dashboard/bookings/${booking.id}`}
                perspective="farmer"
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent activity + notifications */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" description="Your latest completed jobs." />
          {completed.length === 0 ? (
            <p className="text-sm text-muted">Completed jobs will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {completed.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{booking.listingTitle}</p>
                    <p className="text-xs text-muted">
                      Completed with {booking.provider.businessName}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Notifications"
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

      {/* Saved listings preview */}
      {saved.length > 0 ? (
        <Card>
          <CardHeader
            title="Saved listings"
            description="Your shortlist of equipment and services."
            action={
              <Link href="/dashboard/saved">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            }
          />
          <ul className="space-y-2">
            {saved.slice(0, 3).map((listing) => (
              <li key={listing.id} className="flex items-center justify-between rounded-md border border-line px-3.5 py-2.5">
                <div>
                  <Link href={`/listings/${listing.id}`} className="text-sm font-medium text-ink hover:text-primary">
                    {listing.title}
                  </Link>
                  <p className="text-xs text-muted">{listing.location}</p>
                </div>
                <Icon name="chevron-right" size={16} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
