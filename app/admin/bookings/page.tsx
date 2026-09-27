"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { bookingRepository, transactionRepository, farmerRepository, providerRepository, userRepository } from "@/repositories";
import { formatDate } from "@/lib/dates";
import { formatNaira, BOOKING_STATUS_LABELS } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types/models";

const PAGE_SIZE = 10;

interface BookingRow extends Booking {
  farmerName: string;
  providerName: string;
  paymentStatus: string;
}

export default function AdminBookingsPage() {
  const hydrated = useHydration();
  useDatabase();
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const rows = useMemo<BookingRow[]>(() => {
    let all = bookingRepository.findAll().map((booking) => {
      const farmer = farmerRepository.findById(booking.farmerId);
      const provider = providerRepository.findById(booking.providerId);
      const txn = transactionRepository.findOne((t) => t.bookingId === booking.id);
      return {
        ...booking,
        farmerName: farmer ? userRepository.findById(farmer.userId)?.name ?? "Unknown" : "Unknown",
        providerName: provider?.businessName ?? "Unknown",
        paymentStatus: txn?.paymentStatus ?? "No payment",
      };
    });
    if (filter !== "ALL") all = all.filter((booking) => booking.status === filter);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filter]);

  if (!hydrated) return <LoadingState label="Loading bookings..." />;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<BookingRow>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (row) => <span className="font-medium text-ink">{row.reference}</span>,
    },
    {
      key: "listing",
      header: "Listing",
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.listingTitle}</p>
          <p className="text-xs text-muted">{formatDate(row.date)}</p>
        </div>
      ),
    },
    {
      key: "farmer",
      header: "Farmer",
      hideOnMobile: true,
      render: (row) => <span className="text-ink-soft">{row.farmerName}</span>,
    },
    {
      key: "provider",
      header: "Provider",
      hideOnMobile: true,
      render: (row) => <span className="text-ink-soft">{row.providerName}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => <span className="font-medium text-ink">{formatNaira(row.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <BookingStatusBadge status={row.status} />,
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) =>
        row.paymentStatus === "No payment" ? (
          <span className="text-xs text-muted">{row.paymentStatus}</span>
        ) : (
          <PaymentStatusBadge status={row.paymentStatus as "PENDING" | "SUCCESSFUL" | "FAILED"} />
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <span className="text-xs text-muted">
          Commission {formatNaira(row.commission)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Bookings</h1>
        <p className="mt-1 text-sm text-muted">
          Monitor every booking arranged through the marketplace.
        </p>
      </div>

      <div className="max-w-xs">
        <Select
          label="Filter by status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as BookingStatus | "ALL");
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All bookings" },
            ...(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"] as BookingStatus[]).map(
              (status) => ({ value: status, label: BOOKING_STATUS_LABELS[status] }),
            ),
          ]}
        />
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {rows.length} booking{rows.length === 1 ? "" : "s"} found
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No bookings found"
          message="No bookings match the selected filter."
          action={
            <Button variant="outline" onClick={() => setFilter("ALL")}>
              Show all bookings
            </Button>
          }
        />
      ) : (
        <>
          <Table columns={columns} rows={visible} caption="All marketplace bookings" />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Booking pages" />
        </>
      )}
    </div>
  );
}
