"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatCard } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState, InlineNote } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { getProviderProfile } from "@/services/profileService";
import { listTransactionsForProvider } from "@/services/paymentService";
import { computeProviderStats } from "@/services/analyticsService";
import { bookingRepository } from "@/repositories";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { Transaction } from "@/types/models";

const PAGE_SIZE = 8;

export default function ProviderEarningsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const transactions = useMemo(
    () => (provider ? listTransactionsForProvider(provider.id) : []),
    [provider],
  );
  const stats = useMemo(() => (provider ? computeProviderStats(provider.id) : null), [provider]);
  const [page, setPage] = useState(1);

  if (!hydrated || !stats) return <LoadingState label="Loading earnings..." />;

  const pageCount = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const visible = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<Transaction>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (txn) => <span className="font-medium text-ink">{txn.reference}</span>,
    },
    {
      key: "booking",
      header: "Job",
      render: (txn) => {
        const booking = bookingRepository.findById(txn.bookingId);
        return booking ? (
          <Link href={`/provider/bookings/${booking.id}`} className="text-primary hover:underline">
            {booking.listingTitle}
          </Link>
        ) : (
          <span className="text-muted">Unknown job</span>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (txn) => <span className="text-ink-soft">{formatDate(txn.paidAt ?? txn.createdAt)}</span>,
    },
    {
      key: "gross",
      header: "Gross",
      align: "right",
      render: (txn) => <span className="text-ink">{formatNaira(txn.grossAmount)}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      hideOnMobile: true,
      render: (txn) => <span className="text-ink-soft">- {formatNaira(txn.commission)}</span>,
    },
    {
      key: "net",
      header: "Your share",
      align: "right",
      render: (txn) => <span className="font-semibold text-ink">{formatNaira(txn.providerAmount)}</span>,
    },
    {
      key: "status",
      header: "Payment status",
      render: (txn) => <PaymentStatusBadge status={txn.paymentStatus} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Earnings</h1>
        <p className="mt-1 text-sm text-muted">
          Transaction records for your completed and paid bookings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total earnings" value={formatNaira(stats.earnings)} hint="Successful payments" accent />
        <StatCard label="Commission paid" value={formatNaira(stats.commissionPaid)} hint="HadaLink 5% commission" />
        <StatCard label="Completed jobs" value={stats.completedJobs} />
        <StatCard label="Active bookings" value={stats.confirmedBookings} />
      </div>

      <InlineNote tone="info">
        Earnings are based on simulated payments. On a ₦100,000 transaction the 5% commission is
        ₦5,000 and your share is ₦95,000. No real payments are processed in this prototype.
      </InlineNote>

      {transactions.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="No earnings yet"
          message="Transaction records appear here after jobs are paid for and completed."
        />
      ) : (
        <>
          <Table
            columns={columns}
            rows={visible}
            caption="Provider earnings history"
            emptyMessage="No transactions found."
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Earnings pages" />
        </>
      )}
    </div>
  );
}
