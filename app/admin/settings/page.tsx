"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InlineNote, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import { settingsRepository } from "@/repositories";
import { resetDemoData, storageStatus } from "@/services/demoService";
import { validateNumber, hasErrors, type FieldErrors } from "@/lib/validation";
import { formatNaira } from "@/lib/format";

export default function AdminSettingsPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const { refresh } = useAuth();
  const settings = settingsRepository.get();
  const status = storageStatus();

  const [commission, setCommission] = useState(String(settings.commissionRate * 100));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  if (!hydrated) return <LoadingState label="Loading settings..." />;

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    validateNumber(commission, "Commission rate", nextErrors, "commission", { min: 0, max: 50 });
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    settingsRepository.update({ commissionRate: Number(commission) / 100 });
    setBusy(false);
    toast.success("Settings saved", `Commission rate set to ${Number(commission)}%.`);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Platform settings</h1>
        <p className="mt-1 text-sm text-muted">
          Configure marketplace rules and manage the demo environment.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Commission"
          description="HadaLink earns a commission on every completed transaction."
        />
        <form onSubmit={onSave} noValidate className="space-y-4">
          <div className="max-w-xs">
            <Input
              label="Commission rate (%)"
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={commission}
              error={errors.commission}
              onChange={(e) => setCommission(e.target.value)}
              hint="Example: on ₦100,000 at 5%, commission is ₦5,000 and the provider receives ₦95,000."
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save settings"}
          </Button>
        </form>
        <div className="mt-4 rounded-md border border-line bg-sand p-3.5 text-sm">
          <p className="font-medium text-ink">Simulated transaction example</p>
          <p className="mt-1 text-muted">
            Transaction {formatNaira(100000)} | HadaLink commission {formatNaira(100000 * (Number(commission) / 100))} | Provider amount{" "}
            {formatNaira(100000 - 100000 * (Number(commission) / 100))}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Demo data"
          description="Reset the local database back to the original seeded demo data."
        />
        <div className="space-y-3">
          <InlineNote tone={status.persistent ? "info" : "warning"}>
            {status.persistent
              ? "Browser storage is working. Data persists across refreshes and browser restarts."
              : "Browser storage is unavailable or full. Changes are kept in memory only for this session."}
            {status.lastError ? ` ${status.lastError}` : ""}
          </InlineNote>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" icon="settings" onClick={() => setResetOpen(true)}>
              Reset demo data
            </Button>
            <p className="text-xs text-muted">
              This clears all local records (bookings, listings, messages, notifications) and
              restores the seeded demo state.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Prototype boundaries" />
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>Authentication is simulated and stored in this browser.</li>
          <li>Payments are simulated: successful, failed, and pending outcomes only.</li>
          <li>Provider verification is a document review workflow with no physical inspection.</li>
          <li>There is no real payment gateway, insurance coverage, or automatic dispute resolution.</li>
          <li>HadaLink does not own the listed equipment and does not guarantee availability or price.</li>
        </ul>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        title="Reset demo data?"
        message="This will delete every change you made in this browser and restore the original seeded database. This cannot be undone."
        confirmLabel="Reset everything"
        danger
        busy={busy}
        onConfirm={() => {
          setBusy(true);
          resetDemoData();
          setBusy(false);
          setResetOpen(false);
          toast.success("Demo data reset", "The original seed database has been restored.");
          refresh();
        }}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
