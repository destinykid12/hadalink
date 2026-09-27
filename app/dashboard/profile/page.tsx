"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { InlineNote, LoadingState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useHydration, useDatabase } from "@/hooks/useDatabase";
import { getFarmerProfile, updateProfile, changePassword } from "@/services/profileService";
import { listCategories } from "@/services/categoryService";
import { ProfilePhotoPicker } from "@/features/profile/ProfilePhotoPicker";
import { validateEmail, validateNumber, validatePhone, validateRequired, hasErrors, type FieldErrors } from "@/lib/validation";

export default function FarmerProfilePage() {
  const { user, refresh } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();

  const farmer = useMemo(() => (user ? getFarmerProfile(user.id) : undefined), [user]);
  const categories = useMemo(() => listCategories(), []);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [farmName, setFarmName] = useState(farmer?.farmName ?? "");
  const [farmSize, setFarmSize] = useState(String(farmer?.farmSize ?? 0));
  const [farmLocation, setFarmLocation] = useState(farmer?.farmLocation ?? "");
  const [preferred, setPreferred] = useState<string[]>(farmer?.preferredServices ?? []);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  if (!hydrated || !user || !farmer) return <LoadingState label="Loading profile..." />;

  const togglePreferred = (categoryName: string) => {
    setPreferred((current) =>
      current.includes(categoryName)
        ? current.filter((item) => item !== categoryName)
        : [...current, categoryName],
    );
  };

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    validateRequired(name, "Full name", nextErrors, "name");
    validatePhone(phone, nextErrors);
    validateEmail(email, nextErrors);
    validateRequired(farmName, "Farm name", nextErrors, "farmName");
    validateNumber(farmSize, "Farm size", nextErrors, "farmSize", { min: 0 });
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const result = updateProfile(user.id, {
      name,
      phone,
      location,
      farmName,
      farmSize: Number(farmSize),
      farmLocation,
      preferredServices: preferred,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not save profile", result.error);
      return;
    }
    toast.success("Profile updated", "Your changes were saved.");
    refresh();
  };

  const onPassword = (event: FormEvent) => {
    event.preventDefault();
    setPwError(null);
    setPwBusy(true);
    const result = changePassword(user.id, currentPassword, newPassword);
    setPwBusy(false);
    if (!result.ok) {
      setPwError(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Password updated", "Use the new password the next time you log in.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Profile settings</h1>
        <p className="mt-1 text-sm text-muted">
          Keep your contact and farm information up to date so providers know where to work.
        </p>
      </div>

      <Card>
        <CardHeader title="Profile photo" description="Choose how you appear to providers on bookings and reviews." />
        <ProfilePhotoPicker
          userId={user.id}
          name={user.name}
          avatar={user.avatar}
          onSaved={refresh}
        />
      </Card>

      <Card>
        <CardHeader title="Personal information" />
        <form onSubmit={onSave} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
            <Input label="Phone" required value={phone} error={errors.phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" required value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Location" value={location} error={errors.location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <Input label="Farm name" required value={farmName} error={errors.farmName} onChange={(e) => setFarmName(e.target.value)} />
            <Input
              label="Farm size (hectares)"
              type="number"
              min={0}
              value={farmSize}
              error={errors.farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
            />
          </div>
          <Input
            label="Farm location"
            value={farmLocation}
            error={errors.farmLocation}
            onChange={(e) => setFarmLocation(e.target.value)}
            hint="Where the work usually happens, e.g. Samaru, Zaria, Kaduna State."
          />

          <fieldset>
            <legend className="text-sm font-medium text-ink">Preferred services</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => togglePreferred(category.name)}
                  aria-pressed={preferred.includes(category.name)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${
                    preferred.includes(category.name)
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-line text-ink-soft hover:bg-sand-deep"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Change password" description="Simulated authentication for the prototype." />
        <form onSubmit={onPassword} noValidate className="space-y-4">
          {pwError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              {pwError}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              hint="At least 6 characters."
            />
          </div>
          <Button type="submit" variant="outline" disabled={pwBusy}>
            {pwBusy ? "Updating..." : "Update password"}
          </Button>
        </form>
      </Card>

      <InlineNote tone="info">
        Accounts in this prototype are stored in your browser only. A production release would use
        secure server-side authentication and authorization.
      </InlineNote>
    </div>
  );
}
