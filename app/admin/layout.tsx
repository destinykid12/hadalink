"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "chart" },
  { href: "/admin/users", label: "Users", icon: "user" },
  { href: "/admin/providers", label: "Providers", icon: "tractor" },
  { href: "/admin/verifications", label: "Verifications", icon: "shield" },
  { href: "/admin/listings", label: "Listings", icon: "image" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/transactions", label: "Transactions", icon: "wallet" },
  { href: "/admin/reviews", label: "Reviews", icon: "star" },
  { href: "/admin/categories", label: "Categories", icon: "tools" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <RoleGuard allow={["ADMIN"]}>
      {user ? (
        <DashboardShell user={user} nav={adminNav}>
          {children}
        </DashboardShell>
      ) : null}
    </RoleGuard>
  );
}
