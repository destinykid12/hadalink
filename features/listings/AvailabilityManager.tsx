"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { listAvailability, setAvailability } from "@/services/listingService";
import { formatDate, todayISODate, addDays } from "@/lib/dates";

export function AvailabilityManager({
  providerProfileId,
  listingId,
}: {
  providerProfileId: string;
  listingId: string;
}) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"UNAVAILABLE" | "BOOKED">("UNAVAILABLE");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const entries = listAvailability(listingId);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!date) {
      setError("Pick a date first.");
      return;
    }
    setBusy(true);
    const result = setAvailability(providerProfileId, listingId, { date, status, note });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(
      status === "UNAVAILABLE" ? "Date marked unavailable" : "Date marked booked",
      `${formatDate(date)} has been updated.`,
    );
    setDate("");
    setNote("");
  };

  const release = (entryDate: string) => {
    const result = setAvailability(providerProfileId, listingId, {
      date: entryDate,
      status: "AVAILABLE",
    });
    if (result.ok) {
      toast.success("Date released", `${formatDate(entryDate)} is available again.`);
    } else {
      toast.error("Could not update date", result.error);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Availability"
        description="Mark dates as unavailable (maintenance, travel) or booked (manual commitments). Confirmed bookings block dates automatically."
      />
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        {error ? (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Date"
            type="date"
            min={todayISODate()}
            max={addDays(todayISODate(), 365)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "UNAVAILABLE" | "BOOKED")}
            options={[
              { value: "UNAVAILABLE", label: "Unavailable" },
              { value: "BOOKED", label: "Booked (manual)" },
            ]}
          />
          <Input
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Scheduled servicing"
          />
        </div>
        <Button type="submit" disabled={busy} size="sm">
          {busy ? "Saving..." : "Add availability entry"}
        </Button>
      </form>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-ink">Current blocked dates</h3>
        {entries.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon="calendar"
              title="No blocked dates"
              message="Most dates are open for booking right now."
            />
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-md border border-line px-3.5 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{formatDate(entry.date)}</span>
                  <Badge tone={entry.status === "BOOKED" ? "amber" : "red"}>
                    {entry.status === "BOOKED" ? "Booked" : "Unavailable"}
                  </Badge>
                  {entry.note ? <span className="text-xs text-muted">{entry.note}</span> : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => release(entry.date)}>
                  Release date
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
