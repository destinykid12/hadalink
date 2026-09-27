"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { getProviderProfile } from "@/services/profileService";
import { bookingRepository, farmerRepository, userRepository } from "@/repositories";
import { formatNaira } from "@/lib/format";

const PAGE_SIZE = 8;

interface CustomerRow {
  id: string;
  farmerUserId: string;
  name: string;
  phone: string;
  farmName: string;
  farmLocation: string;
  jobs: number;
  totalValue: number;
  lastBookingId: string;
}

export default function ProviderCustomersPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const [page, setPage] = useState(1);

  const customers = useMemo<CustomerRow[]>(() => {
    if (!provider) return [];
    const map = new Map<string, CustomerRow>();
    bookingRepository
      .findWhere((booking) => booking.providerId === provider.id)
      .forEach((booking) => {
        const farmer = farmerRepository.findById(booking.farmerId);
        if (!farmer) return;
        const farmerUser = userRepository.findById(farmer.userId);
        const existing = map.get(farmer.id);
        if (existing) {
          existing.jobs += 1;
          existing.totalValue += booking.amount;
          existing.lastBookingId = booking.id;
        } else {
          map.set(farmer.id, {
            id: farmer.id,
            farmerUserId: farmer.userId,
            name: farmerUser?.name ?? "Farmer",
            phone: farmerUser?.phone ?? "",
            farmName: farmer.farmName,
            farmLocation: farmer.farmLocation,
            jobs: 1,
            totalValue: booking.amount,
            lastBookingId: booking.id,
          });
        }
      });
    return [...map.values()].sort((a, b) => b.totalValue - a.totalValue);
  }, [provider]);

  if (!hydrated) return <LoadingState label="Loading customers..." />;

  const pageCount = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const visible = customers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Farmers who have booked your equipment or services.
        </p>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon="user"
          title="No customers yet"
          message="Farmers who book your listings will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((customer) => (
              <Card key={customer.id}>
                <div className="flex items-start gap-3">
                  <Avatar name={customer.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{customer.name}</p>
                    <p className="text-xs text-muted">{customer.farmName}</p>
                    <p className="text-xs text-muted">{customer.farmLocation}</p>
                    <p className="text-xs text-muted">{customer.phone}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-ink-soft">
                        {customer.jobs} booking{customer.jobs === 1 ? "" : "s"} |{" "}
                        {formatNaira(customer.totalValue)}
                      </p>
                      <Link href={`/provider/bookings/${customer.lastBookingId}`}>
                        <Button variant="ghost" size="sm">
                          Last job
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} label="Customer pages" />
        </>
      )}
    </div>
  );
}
