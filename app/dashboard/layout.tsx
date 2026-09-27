"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

const farmerNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/bookings", label: "My bookings", icon: "calendar" },
  { href: "/dashboard/saved", label: "Saved", icon: "bookmark" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "wallet" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/dashboard/profile", label: "Profile", icon: "user" },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <RoleGuard allow={["FARMER"]}>
      {user ? (
        <DashboardShell user={user} nav={farmerNav}>
          {children}
        </DashboardShell>
      ) : null}
    </RoleGuard>
  );
}
