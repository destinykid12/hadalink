/**
 * Developer/demo tooling.
 * resetDemoData restores the seeded database and is clearly labelled in the UI.
 */

import { getLastError, isStoragePersistent, resetDatabase } from "@/lib/db";
import type { DatabaseShape } from "@/types/models";

export function resetDemoData(): DatabaseShape {
  return resetDatabase();
}

export function storageStatus(): { persistent: boolean; lastError: string | null } {
  return {
    persistent: isStoragePersistent(),
    lastError: getLastError(),
  };
}

export const DEMO_ACCOUNTS = [
  {
    role: "FARMER" as const,
    label: "Farmer demo",
    name: "Amina Bello",
    email: "farmer@hadalink.ng",
    password: "demo1234",
    description: "Search, compare, book, pay, and review.",
  },
  {
    role: "PROVIDER" as const,
    label: "Provider demo",
    name: "Musa Danjuma",
    email: "provider@hadalink.ng",
    password: "demo1234",
    description: "List equipment, manage availability, accept bookings.",
  },
  {
    role: "ADMIN" as const,
    label: "Admin demo",
    name: "Tunde Ogunleye",
    email: "admin@hadalink.ng",
    password: "demo1234",
    description: "Verify providers, manage users, monitor the marketplace.",
  },
];
