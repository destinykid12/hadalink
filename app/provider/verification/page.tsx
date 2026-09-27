"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { VerificationBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { InlineNote, LoadingState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { getProviderProfile } from "@/services/profileService";
import {
  getVerificationForProvider,
  submitVerification,
} from "@/services/verificationService";
import { validatePhone, validateRequired, hasErrors, type FieldErrors } from "@/lib/validation";
import { formatDate } from "@/lib/dates";

export default function ProviderVerificationPage() {
  const { user } = useAuth();
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const provider = useMemo(() => (user ? getProviderProfile(user.id) : undefined), [user]);
  const request = useMemo(
    () => (provider ? getVerificationForProvider(provider.id) : undefined),
    [provider],
  );

  const [businessName, setBusinessName] = useState(provider?.businessName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [identificationInfo, setIdentificationInfo] = useState("");
  const [equipmentInfo, setEquipmentInfo] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (!hydrated || !user || !provider) {
    return <LoadingState label="Loading verification..." />;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    validateRequired(businessName, "Business name", nextErrors, "businessName");
    validatePhone(phone, nextErrors);
    validateRequired(location, "Location", nextErrors, "location");
    validateRequired(identificationInfo, "Identification information", nextErrors, "identificationInfo");
    validateRequired(equipmentInfo, "Equipment information", nextErrors, "equipmentInfo");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const result = submitVerification({
      providerProfileId: provider.id,
      businessName,
      phone,
      location,
      identificationInfo,
      equipmentInfo,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not submit verification", result.error);
      return;
    }
    toast.success(
      "Verification submitted",
      "The HadaLink admin team will review your documents.",
    );
    setIdentificationInfo("");
    setEquipmentInfo("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Provider verification</h1>
        <p className="mt-1 text-sm text-muted">
          Submit your business and equipment information for review. Verified providers build more
          trust with farmers.
        </p>
        <div className="mt-2">
          <VerificationBadge status={provider.verificationStatus} />
        </div>
      </div>

      <InlineNote tone="info">
        Verification reviews the documents and business information you submit. It is not a
        physical inspection of your equipment, and it does not guarantee booking volume.
      </InlineNote>

      {request ? (
        <Card>
          <CardHeader
            title="Your latest verification request"
            description={`Submitted ${formatDate(request.submittedAt)}`}
          />
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Business name</dt>
              <dd className="mt-0.5 font-medium text-ink">{request.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="mt-0.5 font-medium text-ink">{request.phone}</dd>
            </div>
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="mt-0.5 font-medium text-ink">{request.location}</dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-0.5">
                <VerificationBadge status={request.status === "VERIFIED" ? "VERIFIED" : request.status === "REJECTED" ? "REJECTED" : "PENDING"} />
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Identification / business information</dt>
              <dd className="mt-0.5 text-ink-soft">{request.identificationInfo}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Equipment / service information</dt>
              <dd className="mt-0.5 text-ink-soft">{request.equipmentInfo}</dd>
            </div>
            {request.reviewNote ? (
              <div className="sm:col-span-2">
                <dt className="text-muted">Reviewer note</dt>
                <dd className="mt-0.5 text-ink-soft">{request.reviewNote}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      ) : null}

      {provider.verificationStatus === "PENDING" ? (
        <InlineNote tone="warning">
          Your verification is pending review. You can keep using the platform while you wait.
        </InlineNote>
      ) : (
        <Card>
          <CardHeader
            title="Submit verification information"
            description="Provide the details the HadaLink team needs to review your business."
          />
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Business / provider name"
                required
                value={businessName}
                error={errors.businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label="Phone"
                required
                value={phone}
                error={errors.phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Input
              label="Location"
              required
              value={location}
              error={errors.location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Textarea
              label="Identification / business information"
              required
              value={identificationInfo}
              error={errors.identificationInfo}
              onChange={(e) => setIdentificationInfo(e.target.value)}
              placeholder="e.g. CAC registration number, business name registration, or owner identity details."
            />
            <Textarea
              label="Equipment / service information"
              required
              value={equipmentInfo}
              error={errors.equipmentInfo}
              onChange={(e) => setEquipmentInfo(e.target.value)}
              placeholder="e.g. Two tractors, one combine harvester, four trained operators. Service records available."
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Submitting..." : "Submit for review"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
