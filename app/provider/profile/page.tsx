"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { VerificationBadge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { useToast } from "@/components/ui/Toast";
import { InlineNote, LoadingState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { getProviderProfile, updateProfile } from "@/services/profileService";
import { computeProviderStats } from "@/services/analyticsService";
import { ProfilePhotoPicker } from "@/features/profile/ProfilePhotoPicker";
import { validatePhone, validateRequired, hasErrors, type FieldErrors } from "@/lib/validation";

export default function ProviderProfilePage() {
  const { user, refresh } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const stats = useMemo(() => (provider ? computeProviderStats(provider.id) : null), [provider]);

  const [name, setName] = useState(user?.name ?? "");
  const [businessName, setBusinessName] = useState(provider?.businessName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [description, setDescription] = useState(provider?.description ?? "");
  const [serviceAreas, setServiceAreas] = useState((provider?.serviceAreas ?? []).join(", "));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (!hydrated || !user || !provider || !stats) {
    return <LoadingState label="Loading profile..." />;
  }

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    validateRequired(name, "Your name", nextErrors, "name");
    validateRequired(businessName, "Business name", nextErrors, "businessName");
    validatePhone(phone, nextErrors);
    validateRequired(email, "Email", nextErrors, "email");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const result = updateProfile(user.id, {
      name,
      businessName,
      phone,
      location,
      description,
      serviceAreas: serviceAreas
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean),
    });
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not save profile", result.error);
      return;
    }
    toast.success("Profile updated", "Your business profile has been saved.");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Provider profile</h1>
          <p className="mt-1 text-sm text-muted">
            How farmers see your business across the marketplace.
          </p>
        </div>
        <VerificationBadge status={provider.verificationStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Rating</p>
          <div className="mt-1.5">
            <RatingStars value={stats.averageRating} count={stats.reviewCount} />
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Completed jobs</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{stats.completedJobs}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Active listings</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{stats.activeListings}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Profile photo" description="Choose how your business appears to farmers." />
        <ProfilePhotoPicker
          userId={user.id}
          name={provider.businessName}
          avatar={user.avatar}
          onSaved={refresh}
        />
      </Card>

      <Card>
        <CardHeader title="Business information" />
        <form onSubmit={onSave} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Your name"
              required
              value={name}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Business name"
              required
              value={businessName}
              error={errors.businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              required
              value={phone}
              error={errors.phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              error={errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Input
            label="Location"
            value={location}
            error={errors.location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Textarea
            label="Business description"
            value={description}
            error={errors.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell farmers what you provide, your experience, and how you work."
          />
          <Input
            label="Service areas"
            value={serviceAreas}
            onChange={(e) => setServiceAreas(e.target.value)}
            hint="Comma separated, e.g. Zaria, Kaduna, Kafanchan"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      <InlineNote tone="info">
        Your verification status and ratings are visible to farmers on your profile and listings.
        Complete more jobs to build your reputation on the platform.
      </InlineNote>
    </div>
  );
}
