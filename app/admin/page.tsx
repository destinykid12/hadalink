"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatCard, Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { LoadingState, InlineNote, EmptyState } from "@/components/ui/States";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { computeAdminStats } from "@/services/analyticsService";
import { settingsRepository, verificationRepository, bookingRepository, transactionRepository } from "@/repositories";
import { formatNaira } from "@/lib/format";
import { relativeTime } from "@/lib/dates";

export default function AdminDashboardPage() {
  const hydrated = useHydration();
  useDatabase();
  const stats = useMemo(() => computeAdminStats(), []);
  const commissionRate = settingsRepository.get().commissionRate;

  const pendingVerifications = useMemo(
    () => verificationRepository.findWhere((request) => request.status === "PENDING"),
    [],
  );
  const recentBookings = useMemo(
    () =>
      [...bookingRepository.findAll()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [],
  );

  if (!hydrated) return <LoadingState label="Loading admin dashboard..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Marketplace overview</h1>
        <p className="mt-1 text-sm text-muted">
          Live numbers calculated from the local database, not hard-coded.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} hint={`${stats.totalFarmers} farmers, ${stats.totalProviders} providers`} />
        <StatCard label="Total listings" value={stats.totalListings} hint={`${stats.activeListings} active`} />
        <StatCard label="Total bookings" value={stats.totalBookings} hint={`${stats.pendingBookings} pending, ${stats.completedBookings} completed`} />
        <StatCard label="Transaction value" value={formatNaira(stats.totalTransactionValue)} hint="Successful simulated payments" accent />
        <StatCard label="HadaLink commission" value={formatNaira(stats.totalCommission)} hint={`${(commissionRate * 100).toFixed(0)}% of successful transactions`} />
        <StatCard label="Pending verifications" value={stats.pendingVerifications} hint="Providers waiting for review" />
        <StatCard label="Confirmed bookings" value={stats.confirmedBookings} hint="Confirmed and in progress" />
        <StatCard label="Completed bookings" value={stats.completedBookings} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Verification queue"
            description="Providers waiting for document review."
            action={
              <Link href="/admin/verifications">
                <Button variant="outline" size="sm">
                  Review all
                </Button>
              </Link>
            }
          />
          {pendingVerifications.length === 0 ? (
            <EmptyState
              icon="shield"
              title="Queue is clear"
              message="There are no verification requests waiting for review."
            />
          ) : (
            <ul className="space-y-3">
              {pendingVerifications.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-line px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{request.businessName}</p>
                    <p className="text-xs text-muted">
                      {request.location} | Submitted {relativeTime(request.submittedAt)}
                    </p>
                  </div>
                  <Link href="/admin/verifications">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent bookings"
            action={
              <Link href="/admin/bookings">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            }
          />
          {recentBookings.length === 0 ? (
            <EmptyState icon="calendar" title="No bookings" message="Bookings will appear here." />
          ) : (
            <ul className="space-y-3">
              {recentBookings.map((booking) => {
                const txn = transactionRepository.findOne((t) => t.bookingId === booking.id);
                return (
                  <li key={booking.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{booking.listingTitle}</p>
                      <p className="text-xs text-muted">
                        {booking.reference} | {formatNaira(booking.amount)} |{" "}
                        {relativeTime(booking.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <BookingStatusBadge status={booking.status} />
                      {txn ? <PaymentStatusBadge status={txn.paymentStatus} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <InlineNote tone="info">
        This prototype stores all data in the browser (localStorage). Every number on this screen is
        computed from the local database at render time.
      </InlineNote>
    </div>
  );
}
