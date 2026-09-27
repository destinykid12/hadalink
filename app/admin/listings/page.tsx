"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { listingRepository, categoryRepository, providerRepository } from "@/repositories";
import { adminDeleteListing } from "@/services/adminService";
import { setListingStatus } from "@/services/listingService";
import { formatNaira, LISTING_TYPE_LABELS } from "@/lib/format";
import type { Listing } from "@/types/models";

const PAGE_SIZE = 10;

interface ListingRow extends Listing {
  categoryName: string;
  providerName: string;
}

export default function AdminListingsPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ListingRow | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo<ListingRow[]>(() => {
    let all = listingRepository.findAll().map((listing) => {
      const category = categoryRepository.findById(listing.categoryId);
      const provider = providerRepository.findById(listing.providerId);
      return {
        ...listing,
        categoryName: category?.name ?? "Unknown",
        providerName: provider?.businessName ?? "Unknown",
      };
    });
    if (status !== "ALL") all = all.filter((listing) => listing.status === status);
    if (type !== "ALL") all = all.filter((listing) => listing.type === type);
    const needle = query.trim().toLowerCase();
    if (needle) {
      all = all.filter((listing) =>
        [listing.title, listing.location, listing.providerName, listing.categoryName]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [query, status, type]);

  if (!hydrated) return <LoadingState label="Loading listings..." />;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<ListingRow>[] = [
    {
      key: "title",
      header: "Listing",
      render: (row) => (
        <div>
          <Link href={`/listings/${row.id}`} className="font-medium text-ink hover:text-primary">
            {row.title}
          </Link>
          <p className="text-xs text-muted">
            {LISTING_TYPE_LABELS[row.type]} | {row.categoryName}
          </p>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (row) => <span className="text-ink-soft">{row.providerName}</span>,
    },
    {
      key: "location",
      header: "Location",
      hideOnMobile: true,
      render: (row) => <span className="text-ink-soft">{row.location}</span>,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (row) => <span className="font-medium text-ink">{formatNaira(row.price)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "ACTIVE" ? "green" : "neutral"}>
          {row.status === "ACTIVE" ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
              const result = setListingStatus(row.id, next);
              if (result.ok) {
                toast.success(
                  next === "ACTIVE" ? "Listing enabled" : "Listing disabled",
                  row.title,
                );
              } else {
                toast.error("Action failed", result.error);
              }
            }}
          >
            {row.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setPendingDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Listings</h1>
        <p className="mt-1 text-sm text-muted">
          Search, filter, enable, disable, or delete marketplace listings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Search listings"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Title, provider, location..."
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All types" },
            { value: "EQUIPMENT", label: "Equipment" },
            { value: "SERVICE", label: "Services" },
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Disabled" },
          ]}
        />
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {rows.length} listing{rows.length === 1 ? "" : "s"} found
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon="image"
          title="No listings found"
          message="Try a different search term or filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("ALL");
                setType("ALL");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <Table columns={columns} rows={visible} caption="All marketplace listings" />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Listing pages" />
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this listing?"
        message={`"${pendingDelete?.title ?? ""}" will be removed from the marketplace along with its availability and saved references.`}
        confirmLabel="Delete listing"
        danger
        busy={busy}
        onConfirm={() => {
          if (!pendingDelete) return;
          setBusy(true);
          const result = adminDeleteListing(pendingDelete.id);
          setBusy(false);
          setPendingDelete(null);
          if (result.ok) {
            toast.success("Listing deleted", "The listing was removed from the marketplace.");
          } else {
            toast.error("Could not delete listing", result.error);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
