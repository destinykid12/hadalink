"use client";

import { useMounted } from "@/hooks/useDatabase";

/**
 * Renders children only after client mount.
 * Used around local-database content so server HTML and client state
 * never disagree during hydration.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useMounted();
  return mounted ? <>{children}</> : <>{fallback}</>;
}
