"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import {
  listVerificationRequests,
  reviewVerification,
} from "@/services/verificationService";
import { providerRepository } from "@/repositories";
import { formatDate } from "@/lib/dates";
import type { VerificationRequest } from "@/types/models";

export default function AdminVerificationsPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const requests = useMemo(() => listVerificationRequests(), []);
  const [active, setActive] = useState<VerificationRequest | null>(null);
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <LoadingState label="Loading verification requests..." />;

  const pending = requests.filter((request) => request.status === "PENDING");
  const reviewed = requests.filter((request) => request.status !== "PENDING");

  const openReview = (request: VerificationRequest, next: "VERIFIED" | "REJECTED") => {
    setActive(request);
    setDecision(next);
    setNote(next === "VERIFIED" ? "Documents and business details confirmed." : "");
  };

  const submit = () => {
    if (!active) return;
    setBusy(true);
    const result = reviewVerification(active.id, decision, note);
    setBusy(false);
    if (!result.ok) {
      toast.error("Review failed", result.error);
      return;
    }
    toast.success(
      decision === "VERIFIED" ? "Provider approved" : "Verification rejected",
      `${active.businessName} has been notified.`,
    );
    setActive(null);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Provider verifications</h1>
        <p className="mt-1 text-sm text-muted">
          Review submitted business and equipment information. Verification is document review,
          not physical inspection.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink">Waiting for review ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon="shield"
              title="Queue is clear"
              message="There are no verification requests waiting for review."
            />
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {pending.map((request) => {
              const provider = providerRepository.findById(request.providerId);
              return (
                <Card key={request.id}>
                  <CardHeader
                    title={request.businessName}
                    description={`${request.location} | Submitted ${formatDate(request.submittedAt)}`}
                  />
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Phone</dt>
                      <dd className="mt-0.5 font-medium text-ink">{request.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Current provider status</dt>
                      <dd className="mt-0.5">
                        <VerificationBadge status={provider?.verificationStatus ?? "UNSUBMITTED"} />
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
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" icon="check" onClick={() => openReview(request, "VERIFIED")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openReview(request, "REJECTED")}>
                      Reject
                    </Button>
                    <a href={`/providers/${request.providerId}`} className="inline-flex">
                      <Button size="sm" variant="outline">
                        View provider profile
                      </Button>
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">Review history</h2>
        {reviewed.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon="info" title="No reviews yet" message="Reviewed requests will appear here." />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {reviewed.map((request) => (
              <Card key={request.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{request.businessName}</p>
                    <p className="text-xs text-muted">
                      Submitted {formatDate(request.submittedAt)}
                      {request.reviewedAt ? ` | Reviewed ${formatDate(request.reviewedAt)}` : ""}
                    </p>
                    {request.reviewNote ? (
                      <p className="mt-1.5 text-sm text-ink-soft">{request.reviewNote}</p>
                    ) : null}
                  </div>
                  <VerificationBadge status={request.status === "VERIFIED" ? "VERIFIED" : "REJECTED"} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={decision === "VERIFIED" ? "Approve provider" : "Reject verification"}
        description={
          active
            ? `${active.businessName}: the provider will be notified with your note.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button variant={decision === "VERIFIED" ? "primary" : "danger"} onClick={submit} disabled={busy}>
              {busy ? "Saving..." : decision === "VERIFIED" ? "Approve provider" : "Reject request"}
            </Button>
          </>
        }
      >
        <Textarea
          label="Note to the provider"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            decision === "VERIFIED"
              ? "e.g. Business registration and equipment list confirmed."
              : "e.g. The identification document was unclear. Please resubmit."
          }
        />
        <div className="mt-3">
          <Badge tone={decision === "VERIFIED" ? "green" : "red"}>
            Decision: {decision === "VERIFIED" ? "Approve" : "Reject"}
          </Badge>
          <button
            type="button"
            className="ml-2 text-xs font-medium text-primary underline"
            onClick={() => setDecision(decision === "VERIFIED" ? "REJECTED" : "VERIFIED")}
          >
            Switch decision
          </button>
        </div>
      </Modal>
    </div>
  );
}
