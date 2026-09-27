"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LoadingState, UnauthorizedState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useMounted } from "@/hooks/useDatabase";
import type { Role } from "@/types/models";

/**
 * Centralized UI-level role gate for protected areas.
 * Note for production: this is convenience only. Every service call must
 * also be authorized server-side once a backend exists.
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const mounted = useMounted();
  const router = useRouter();

  const homeFor = (role: Role) =>
    role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/dashboard";

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login");
    }
  }, [mounted, user, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="page-shell flex-1 py-16">
          <LoadingState label="Checking your session..." />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="page-shell flex-1 py-16">
          <UnauthorizedState
            message="Please log in to view this page."
            action={
              <Link href="/login">
                <Button>Go to login</Button>
              </Link>
            }
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="page-shell flex-1 py-16">
          <UnauthorizedState
            message={`This area is for ${allow.join(" and ").toLowerCase()} accounts. You are logged in as a ${user.role.toLowerCase()}.`}
            action={
              <Link href={homeFor(user.role)}>
                <Button>Go to my dashboard</Button>
              </Link>
            }
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
