"use client";

import { useMemo } from "react";
import { LoadingState } from "@/components/ui/States";
import { ListingForm } from "@/features/listings/ListingForm";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useDatabase";
import { getProviderProfile } from "@/services/profileService";

export default function NewListingPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);

  if (!hydrated || !provider) return <LoadingState label="Preparing listing form..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Create a listing</h1>
        <p className="mt-1 text-sm text-muted">
          Your listing appears in farmer search as soon as you create it.
        </p>
      </div>
      <ListingForm providerProfileId={provider.id} />
    </div>
  );
}
