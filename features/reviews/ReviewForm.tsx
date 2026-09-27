"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { RatingInput } from "@/components/ui/RatingStars";
import { useToast } from "@/components/ui/Toast";
import { createReview } from "@/services/reviewService";

export function ReviewForm({
  bookingId,
  farmerProfileId,
  listingTitle,
  onDone,
}: {
  bookingId: string;
  farmerProfileId: string;
  listingTitle: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!comment.trim()) {
      setError("Please add a short comment with your rating.");
      return;
    }
    setBusy(true);
    const result = createReview({
      bookingId,
      farmerProfileId,
      rating,
      comment,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Review submitted", `Thanks for reviewing ${listingTitle}.`);
    onDone();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <p className="text-sm font-medium text-ink">Your rating</p>
        <div className="mt-2">
          <RatingInput value={rating} onChange={setRating} />
        </div>
      </div>
      <Textarea
        label="Your review"
        required
        value={comment}
        error={error ?? undefined}
        onChange={(event) => setComment(event.target.value)}
        placeholder="How did the job go? Was the provider on time and was the work done properly?"
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
