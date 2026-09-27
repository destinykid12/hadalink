"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { InlineNote } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import {
  validateEmail,
  validateNumber,
  validatePassword,
  validatePhone,
  validateRequired,
  hasErrors,
  type FieldErrors,
} from "@/lib/validation";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { signup } = useAuth();

  const initialRole = params.get("role") === "PROVIDER" ? "PROVIDER" : "FARMER";
  const [role, setRole] = useState<"FARMER" | "PROVIDER">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors: FieldErrors = {};
    validateRequired(name, "Full name", nextErrors, "name");
    validateEmail(email, nextErrors);
    validatePhone(phone, nextErrors);
    validatePassword(password, nextErrors);
    validateRequired(location, "Location", nextErrors, "location");
    if (role === "FARMER") {
      validateRequired(farmName, "Farm name", nextErrors, "farmName");
      validateNumber(farmSize, "Farm size", nextErrors, "farmSize", { min: 0 });
    } else {
      validateRequired(businessName, "Business name", nextErrors, "businessName");
    }
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const result = signup({
      name,
      email,
      phone,
      password,
      location,
      role,
      farmName,
      farmSize: farmSize ? Number(farmSize) : 0,
      farmLocation: farmLocation || location,
      businessName,
      description,
    });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast.success("Account created", "Welcome to HadaLink. Your local session is now active.");
    router.push(role === "PROVIDER" ? "/provider" : "/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-xl rounded-lg border border-line bg-white p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Create your HadaLink account</h1>
      <p className="mt-1.5 text-sm text-muted">
        Prototype signup: accounts are stored in this browser only.
      </p>

      <div className="mt-5">
        <InlineNote tone="info">
          I am a: {" "}
          <span className="inline-flex gap-2 align-middle">
            <button
              type="button"
              onClick={() => setRole("FARMER")}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                role === "FARMER"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line text-ink-soft hover:bg-sand-deep"
              }`}
            >
              Farmer
            </button>
            <button
              type="button"
              onClick={() => setRole("PROVIDER")}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                role === "PROVIDER"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line text-ink-soft hover:bg-sand-deep"
              }`}
            >
              Equipment provider
            </button>
          </span>
        </InlineNote>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {formError ? (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <Input
          label="Full name"
          required
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Amina Bello"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            error={errors.email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.ng"
          />
          <Input
            label="Phone"
            type="tel"
            required
            value={phone}
            error={errors.phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0803 123 4567"
            hint="Nigerian format, e.g. 0803 123 4567 or +234 803 123 4567"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            required
            value={password}
            error={errors.password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <Input
            label="Location"
            required
            value={location}
            error={errors.location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. Zaria, Kaduna State"
          />
        </div>

        {role === "FARMER" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Farm name"
                required
                value={farmName}
                error={errors.farmName}
                onChange={(event) => setFarmName(event.target.value)}
                placeholder="e.g. Bello Family Farm"
              />
              <Input
                label="Farm size (hectares)"
                type="number"
                min={0}
                required
                value={farmSize}
                error={errors.farmSize}
                onChange={(event) => setFarmSize(event.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <Input
              label="Farm location"
              value={farmLocation}
              error={errors.farmLocation}
              onChange={(event) => setFarmLocation(event.target.value)}
              placeholder="e.g. Samaru, Zaria, Kaduna State"
              hint="Optional if the same as your location."
            />
          </>
        ) : (
          <>
            <Input
              label="Business name"
              required
              value={businessName}
              error={errors.businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="e.g. Danjuma Agro Equipment"
            />
            <Textarea
              label="Business description"
              value={description}
              error={errors.description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell farmers what equipment or services you provide and the areas you cover."
            />
            <p className="text-xs text-muted">
              After signup you can submit your business documents for verification from your
              provider dashboard.
            </p>
          </>
        )}

        <Button type="submit" fullWidth size="lg" disabled={busy}>
          {busy ? "Creating account..." : `Create ${role === "FARMER" ? "farmer" : "provider"} account`}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense fallback={<p className="text-sm text-muted">Loading signup form...</p>}>
          <SignupForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
