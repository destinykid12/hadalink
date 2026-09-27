"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, NotFoundState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ListingForm } from "@/features/listings/ListingForm";
import { AvailabilityManager } from "@/features/listings/AvailabilityManager";
import { useAuth } from "@/hooks/useAuth";
import { useHydration } from "@/hooks/useDatabase";
import { useListing } from "@/hooks/useListings";
import { getProviderProfile } from "@/services/profileService";
import { deleteListing } from "@/services/listingService";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const hydrated = useHydration();
  const listing = useListing(params.id);
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <LoadingState label="Loading listing..." />;
  if (!listing || !provider) {
    return (
      <NotFoundState
        title="Listing not found"
        message="This listing does not exist or does not belong to you."
        action={
          <Link href="/provider/listings">
            <Button variant="outline">Back to listings</Button>
          </Link>
        }
      />
    );
  }

  const isOwner = listing.providerId === provider.id;

  const onDelete = () => {
    setBusy(true);
    const result = deleteListing(listing.id);
    setBusy(false);
    setDeleteOpen(false);
    if (!result.ok) {
      toast.error("Could not delete listing", result.error);
      return;
    }
    toast.success("Listing deleted", "The listing was removed from search results.");
    router.push("/provider/listings");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/provider/listings"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <Icon name="arrow-left" size={15} />
          Back to listings
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Edit listing</h1>
            <p className="mt-1 text-sm text-muted">{listing.title}</p>
          </div>
          <Button variant="danger" icon="trash" onClick={() => setDeleteOpen(true)}>
            Delete listing
          </Button>
        </div>
      </div>

      {isOwner ? (
        <>
          <ListingForm providerProfileId={provider.id} existing={listing} />
          <AvailabilityManager providerProfileId={provider.id} listingId={listing.id} />
        </>
      ) : (
        <NotFoundState
          title="Not your listing"
          message="You can only edit listings that belong to your provider account."
          action={
            <Link href="/provider/listings">
              <Button variant="outline">Back to listings</Button>
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this listing?"
        message={`"${listing.title}" will be permanently removed from search results and saved lists. Active bookings block deletion until they are resolved.`}
        confirmLabel="Delete listing"
        danger
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
