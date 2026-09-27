"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, NotFoundState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import {
  deleteUser,
  setUserStatus,
  updateUserInfo,
} from "@/services/adminService";
import {
  farmerRepository,
  providerRepository,
  userRepository,
  bookingRepository,
  listingRepository,
} from "@/repositories";
import { formatDate } from "@/lib/dates";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const hydrated = useHydration();
  useDatabase();

  const user = useMemo(() => userRepository.findById(params.id), [params.id]);
  const farmer = useMemo(
    () => (user ? farmerRepository.findOne((profile) => profile.userId === user.id) : undefined),
    [user],
  );
  const provider = useMemo(
    () => (user ? providerRepository.findOne((profile) => profile.userId === user.id) : undefined),
    [user],
  );
  const relatedBookings = useMemo(() => {
    if (!user) return [];
    if (farmer) return bookingRepository.findWhere((booking) => booking.farmerId === farmer.id);
    if (provider) return bookingRepository.findWhere((booking) => booking.providerId === provider.id);
    return [];
  }, [user, farmer, provider]);
  const relatedListings = useMemo(
    () => (provider ? listingRepository.findWhere((listing) => listing.providerId === provider.id) : []),
    [provider],
  );

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <LoadingState label="Loading user..." />;
  if (!user) {
    return (
      <NotFoundState
        title="User not found"
        message="This user does not exist or was deleted."
        action={
          <Link href="/admin/users">
            <Button variant="outline">Back to users</Button>
          </Link>
        }
      />
    );
  }

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = updateUserInfo(user.id, { name, phone, location, email });
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not save user", result.error);
      return;
    }
    toast.success("User updated", "The account information was saved.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <Icon name="arrow-left" size={15} />
            Back to users
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">{user.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={user.role === "ADMIN" ? "soft" : user.role === "PROVIDER" ? "green" : "blue"}>
              {user.role}
            </Badge>
            <Badge tone={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</Badge>
            {provider ? <VerificationBadge status={provider.verificationStatus} /> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role !== "ADMIN" ? (
            <>
              <Button
                variant={user.status === "ACTIVE" ? "danger" : "outline"}
                onClick={() => {
                  const next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                  const result = setUserStatus(user.id, next);
                  if (result.ok) {
                    toast.success(next === "SUSPENDED" ? "User suspended" : "User reactivated", user.name);
                  } else {
                    toast.error("Action failed", result.error);
                  }
                }}
              >
                {user.status === "ACTIVE" ? "Suspend user" : "Reactivate user"}
              </Button>
              <Button variant="danger" icon="trash" onClick={() => setDeleteOpen(true)}>
                Delete user
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account information" description="Edit appropriate user details." />
          <form onSubmit={onSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Profile details" />
          {farmer ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Farm name</dt>
                <dd className="font-medium text-ink">{farmer.farmName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Farm size</dt>
                <dd className="text-ink">{farmer.farmSize} hectares</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Farm location</dt>
                <dd className="text-right text-ink">{farmer.farmLocation}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Preferred services</dt>
                <dd className="text-right text-ink">
                  {farmer.preferredServices.length ? farmer.preferredServices.join(", ") : "None set"}
                </dd>
              </div>
            </dl>
          ) : provider ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Business name</dt>
                <dd className="font-medium text-ink">{provider.businessName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Rating</dt>
                <dd className="text-ink">
                  {provider.rating > 0 ? `${provider.rating.toFixed(1)} (${provider.reviewCount} reviews)` : "No ratings"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Completed jobs</dt>
                <dd className="text-ink">{provider.completedJobs}</dd>
              </div>
              <div>
                <dt className="text-muted">Description</dt>
                <dd className="mt-1 text-ink-soft">{provider.description || "No description yet."}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">Admin account. No marketplace profile.</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div>
              <p className="text-muted">Joined</p>
              <p className="font-medium text-ink">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted">Related records</p>
              <p className="font-medium text-ink">
                {relatedBookings.length} bookings, {relatedListings.length} listings
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this user?"
        message={`Deleting ${user.name} removes their profile, listings, bookings, messages, and saved records. This cannot be undone.`}
        confirmLabel="Delete user"
        danger
        busy={busy}
        onConfirm={() => {
          setBusy(true);
          const result = deleteUser(user.id);
          setBusy(false);
          setDeleteOpen(false);
          if (!result.ok) {
            toast.error("Could not delete user", result.error);
            return;
          }
          toast.success("User deleted", "All related records were cleaned up.");
          router.push("/admin/users");
          router.refresh();
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
