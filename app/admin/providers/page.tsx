"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { VerificationBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { providerRepository, userRepository } from "@/repositories";
import { reactivateProvider, suspendProvider } from "@/services/adminService";
import { RatingStars } from "@/components/ui/RatingStars";
import type { ProviderProfile } from "@/types/models";

const PAGE_SIZE = 10;

interface ProviderRow extends ProviderProfile {
  userName: string;
  userEmail: string;
  userStatus: string;
  userLocation: string;
}

export default function AdminProvidersPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const [page, setPage] = useState(1);

  const rows = useMemo<ProviderRow[]>(() => {
    return providerRepository
      .findAll()
      .map((provider) => {
        const user = userRepository.findById(provider.userId);
        return {
          ...provider,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "",
          userStatus: user?.status ?? "UNKNOWN",
          userLocation: user?.location ?? "",
        };
      })
      .sort((a, b) => a.businessName.localeCompare(b.businessName));
  }, []);

  if (!hydrated) return <LoadingState label="Loading providers..." />;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: TableColumn<ProviderRow>[] = [
    {
      key: "business",
      header: "Business",
      render: (row) => (
        <div>
          <Link href={`/providers/${row.id}`} className="font-medium text-ink hover:text-primary">
            {row.businessName}
          </Link>
          <p className="text-xs text-muted">{row.userName}</p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      hideOnMobile: true,
      render: (row) => (
        <div>
          <p className="text-ink-soft">{row.userEmail}</p>
          <p className="text-xs text-muted">{row.userLocation}</p>
        </div>
      ),
    },
    {
      key: "verification",
      header: "Verification",
      render: (row) => <VerificationBadge status={row.verificationStatus} />,
    },
    {
      key: "rating",
      header: "Rating",
      render: (row) => (
        <RatingStars value={row.rating} count={row.reviewCount} size={13} />
      ),
    },
    {
      key: "jobs",
      header: "Jobs",
      align: "right",
      render: (row) => <span className="text-ink">{row.completedJobs}</span>,
    },
    {
      key: "account",
      header: "Account",
      render: (row) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            row.userStatus === "ACTIVE"
              ? "border-primary/20 bg-primary-soft text-primary"
              : "border-danger/20 bg-danger-soft text-danger"
          }`}
        >
          {row.userStatus}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          {row.userStatus === "ACTIVE" ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                const result = suspendProvider(row.id);
                if (result.ok) {
                  toast.success("Provider suspended", `${row.businessName} has been suspended.`);
                } else {
                  toast.error("Action failed", result.error);
                }
              }}
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const result = reactivateProvider(row.id);
                if (result.ok) {
                  toast.success("Provider reactivated", `${row.businessName} is active again.`);
                } else {
                  toast.error("Action failed", result.error);
                }
              }}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Providers</h1>
        <p className="mt-1 text-sm text-muted">
          Review equipment and service providers, their verification status, and account state.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="tractor" title="No providers" message="Provider accounts will appear here." />
      ) : (
        <>
          <Table columns={columns} rows={visible} caption="Marketplace providers" />
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Provider pages" />
        </>
      )}
    </div>
  );
}
