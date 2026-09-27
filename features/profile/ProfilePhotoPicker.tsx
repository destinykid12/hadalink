"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { updateProfile } from "@/services/profileService";
import { Avatar } from "@/components/ui/Avatar";

const PHOTO_OPTIONS = [
  "/images/farm-scene.jpg",
  "/images/tractor.jpg",
  "/images/ploughing.jpg",
  "/images/planting.jpg",
  "/images/harvesting.jpg",
  "/images/irrigation.jpg",
  "/images/transport.jpg",
  "/images/processing.jpg",
  "/images/service-team.jpg",
];

export function ProfilePhotoPicker({
  userId,
  name,
  avatar,
  onSaved,
}: {
  userId: string;
  name: string;
  avatar: string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState(avatar);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const save = (value: string) => {
    const result = updateProfile(userId, { avatar: value });
    if (result.ok) {
      setSelected(value);
      toast.success("Profile photo updated");
      onSaved();
    } else {
      toast.error("Could not update photo", result.error);
    }
  };

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 200 * 1024) {
      setUploadError("Images must be 200 KB or smaller so they fit in browser storage.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (dataUrl) save(dataUrl);
    };
    reader.onerror = () => setUploadError("The image could not be read. Try another file.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={name} src={selected} size={64} />
        <div>
          <label
            htmlFor={`photo-upload-${userId}`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-sand-deep"
          >
            Upload a photo
            <input
              id={`photo-upload-${userId}`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onUpload}
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">Max 200 KB, or pick one below.</p>
        </div>
      </div>
      {uploadError ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {uploadError}
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PHOTO_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => save(option)}
            aria-label="Use this photo"
            aria-pressed={selected === option}
            className={`overflow-hidden rounded-md border-2 ${
              selected === option ? "border-primary" : "border-line"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={option} alt="" className="h-12 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
