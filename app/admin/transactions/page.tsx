"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState, InlineNote } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import {
  bookingRepository,
  farmerRepository,
  providerRepository,
  settingsRepository,
  transactionRepository,
  userRepository,
} from "@/repositories";
import { formatDate } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { PaymentStatus, Transaction } from "@/types/models";

const PAGE_SIZE = 10;

interface TxnRow extends Transaction {
  bookingReference: string;
  farmerName: string;
  providerName: string;
}

export default function AdminTransactionsPage() {
  const hydrated = useHydration();
  useDatabase();
  const [filter, setFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const commissionRate = settingsRepository.get().commissionRate;

  const rows = useMemo<TxnRow[]>(() => {
    let all = transactionRepository.findAll().map((txn) => {
      const booking = bookingRepository.findById(txn.bookingId);
      const farmer = farmerRepository.findById(txn.farmerId);
      const provider = providerRepository.findById(txn.providerId);
      return {
        ...txn,
        bookingReference: booking?.reference ?? "Unknown",
        farmerName: farmer ? userRepository.findById(farmer.userId)?.name ?? "Unknown" : "Unknown",
        providerName: provider?.businessName ?? "Unknown",
      };
    });
    if (filter !== "ALL") all = all.filter((txn) => txn.paymentStatus === filter);
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filter]);

  const totals = useMemo(() => {
    const successful = transactionRepository.findWhere((txn) => txn.paymentStatus === "SUCCESSFUL");
    return {
      volume: successful.reduce((sum, txn) => sum + txn.grossAmount, 0),
      commission: successful.reduce((sum, txn) => sum + txn.commission, 0),
      count: transactionRepository.count(),
    };
  }, []);

  if (!hydrated) return <LoadingState label="Loading transactions..." />;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<TxnRow>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (row) => <span className="font-medium text-ink">{row.reference}</span>,
    },
    {
      key: "booking",
      header: "Booking",
      render: (row) => <span className="text-ink-soft">{row.bookingReference}</span>,
    },
    {
      key: "parties",
      header: "Farmer / Provider",
      hideOnMobile: true,
      render: (row) => (
        <div>
          <p className="text-ink">{row.farmerName}</p>
          <p className="text-xs text-muted">{row.providerName}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      render: (row) => <span className="text-ink-soft">{formatDate(row.paidAt ?? row.createdAt)}</span>,
    },
    {
      key: "gross",
      header: "Gross",
      align: "right",
      render: (row) => <span className="text-ink">{formatNaira(row.grossAmount)}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      render: (row) => <span className="font-semibold text-primary">{formatNaira(row.commission)}</span>,
    },
    {
      key: "status",
      header: "Payment status",
      render: (row) => <PaymentStatusBadge status={row.paymentStatus} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Transactions</h1>
        <p className="mt-1 text-sm text-muted">
          Simulated payment records and HadaLink commission across the marketplace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Successful transaction volume" value={formatNaira(totals.volume)} accent />
        <StatCard label="HadaLink commission earned" value={formatNaira(totals.commission)} hint={`${(commissionRate * 100).toFixed(0)}% commission rate`} />
        <StatCard label="Transaction records" value={totals.count} hint="All payment statuses" />
      </div>

      <InlineNote tone="info">
        All payments in this prototype are simulated. Commission is configurable in platform
        settings and is recalculated per transaction.
      </InlineNote>

      <div className="max-w-xs">
        <Select
          label="Filter by payment status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as PaymentStatus | "ALL");
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All payments" },
            { value: "SUCCESSFUL", label: "Successful" },
            { value: "PENDING", label: "Pending" },
            { value: "FAILED", label: "Failed" },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="No transactions found"
          message="No transaction records match the selected filter."
          action={
            <Button variant="outline" onClick={() => setFilter("ALL")}>
              Show all transactions
            </Button>
          }
        />
      ) : (
        <>
          <Table columns={columns} rows={visible} caption="All marketplace transactions" />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Transaction pages" />
        </>
      )}
    </div>
  );
}
