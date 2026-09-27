"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

const providerNav: NavItem[] = [
  { href: "/provider", label: "Overview", icon: "home" },
  { href: "/provider/listings", label: "My listings", icon: "tractor" },
  { href: "/provider/bookings", label: "Bookings", icon: "calendar" },
  { href: "/provider/earnings", label: "Earnings", icon: "wallet" },
  { href: "/provider/reviews", label: "Reviews", icon: "star" },
  { href: "/provider/customers", label: "Customers", icon: "user" },
  { href: "/provider/verification", label: "Verification", icon: "shield" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/provider/profile", label: "Profile", icon: "settings" },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <RoleGuard allow={["PROVIDER"]}>
      {user ? (
        <DashboardShell user={user} nav={providerNav}>
          {children}
        </DashboardShell>
      ) : null}
    </RoleGuard>
  );
}
