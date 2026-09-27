"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState, InlineNote } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useDatabase";
import { useDatabase } from "@/hooks/useDatabase";
import { getFarmerProfile } from "@/services/profileService";
import { listTransactionsForFarmer } from "@/services/paymentService";
import { bookingRepository } from "@/repositories";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { Transaction } from "@/types/models";

const PAGE_SIZE = 8;

export default function FarmerTransactionsPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const farmer = useMemo(() => (user ? getFarmerProfile(user.id) : undefined), [user]);
  const transactions = useMemo(
    () => (farmer ? listTransactionsForFarmer(farmer.id) : []),
    [farmer],
  );
  const [page, setPage] = useState(1);

  if (!hydrated) return <LoadingState label="Loading transactions..." />;

  const total = transactions
    .filter((txn) => txn.paymentStatus === "SUCCESSFUL")
    .reduce((sum, txn) => sum + txn.grossAmount, 0);

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
      header: "Booking",
      render: (txn) => {
        const booking = bookingRepository.findById(txn.bookingId);
        return booking ? (
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className="text-primary hover:underline"
          >
            {booking.listingTitle}
          </Link>
        ) : (
          <span className="text-muted">Unknown booking</span>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      render: (txn) => <span className="text-ink-soft">{formatDate(txn.paidAt ?? txn.createdAt)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (txn) => <span className="font-semibold text-ink">{formatNaira(txn.grossAmount)}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      hideOnMobile: true,
      render: (txn) => <span className="text-ink-soft">{formatNaira(txn.commission)}</span>,
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
        <h1 className="text-2xl font-bold tracking-tight text-ink">Transactions</h1>
        <p className="mt-1 text-sm text-muted">
          Your simulated payment history. Total successful payments: {formatNaira(total)}
        </p>
      </div>

      <InlineNote tone="info">
        Every payment on this prototype is simulated. Records persist in your browser and behave
        like a real payment ledger.
      </InlineNote>

      {transactions.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="No transactions yet"
          message="Transactions appear here after you complete a simulated payment on a booking."
        />
      ) : (
        <>
          <Table
            columns={columns}
            rows={visible}
            caption="Farmer transaction history"
            emptyMessage="No transactions found."
          />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Transaction pages" />
        </>
      )}
    </div>
  );
}
