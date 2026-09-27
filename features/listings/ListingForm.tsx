"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { listCategories } from "@/services/categoryService";
import {
  createListing,
  updateListing,
  type ListingInput,
} from "@/services/listingService";
import type { ListingType, PricingUnit, EquipmentCondition, ListingWithRelations } from "@/types/models";
import { validateNumber, validateRequired, hasErrors, type FieldErrors } from "@/lib/validation";

const IMAGE_OPTIONS = [
  { value: "/images/tractor.jpg", label: "Tractor" },
  { value: "/images/ploughing.jpg", label: "Ploughing" },
  { value: "/images/planting.jpg", label: "Planting" },
  { value: "/images/harvesting.jpg", label: "Harvesting" },
  { value: "/images/irrigation.jpg", label: "Irrigation" },
  { value: "/images/transport.jpg", label: "Transport" },
  { value: "/images/processing.jpg", label: "Processing" },
  { value: "/images/service-team.jpg", label: "Service team" },
  { value: "/images/farm-scene.jpg", label: "Farm scene" },
];

export function ListingForm({
  providerProfileId,
  existing,
}: {
  providerProfileId: string;
  existing?: ListingWithRelations;
}) {
  const router = useRouter();
  const toast = useToast();
  const categories = useMemo(() => listCategories(), []);
  const isEdit = Boolean(existing);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (jpg, png, or webp).");
      return;
    }
    if (file.size > 200 * 1024) {
      setUploadError("Images must be 200 KB or smaller so they fit in browser storage.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setImages((current) =>
        current.length >= 3 ? current : [...current, dataUrl],
      );
    };
    reader.onerror = () => setUploadError("The image could not be read. Try another file.");
    reader.readAsDataURL(file);
  };

  const [title, setTitle] = useState(existing?.title ?? "");
  const [type, setType] = useState<ListingType>(existing?.type ?? "EQUIPMENT");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [price, setPrice] = useState(existing ? String(existing.price) : "");
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>(existing?.pricingUnit ?? "PER_DAY");
  const [condition, setCondition] = useState<EquipmentCondition>(existing?.condition ?? "GOOD");
  const [operatorIncluded, setOperatorIncluded] = useState(existing?.operatorIncluded ?? true);
  const [terms, setTerms] = useState(existing?.terms ?? "");
  const [images, setImages] = useState<string[]>(existing?.images ?? ["/images/tractor.jpg"]);

  const [brand, setBrand] = useState(existing?.equipment?.brand ?? "");
  const [model, setModel] = useState(existing?.equipment?.model ?? "");
  const [horsepower, setHorsepower] = useState(String(existing?.equipment?.horsepower ?? ""));
  const [year, setYear] = useState(String(existing?.equipment?.yearOfManufacture ?? ""));

  const [scope, setScope] = useState(existing?.service?.scope ?? "");
  const [durationEstimate, setDurationEstimate] = useState(existing?.service?.durationEstimate ?? "");
  const [deliverables, setDeliverables] = useState(existing?.service?.deliverables ?? "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleImage = (value: string) => {
    setImages((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= 3
          ? current
          : [...current, value],
    );
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors: FieldErrors = {};
    validateRequired(title, "Title", nextErrors, "title");
    validateRequired(description, "Description", nextErrors, "description");
    validateRequired(location, "Location", nextErrors, "location");
    validateNumber(price, "Price", nextErrors, "price", { min: 1 });
    validateRequired(terms, "Terms", nextErrors, "terms");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);

    const payload: ListingInput = {
      title,
      categoryId,
      type,
      description,
      images: images.length ? images : ["/images/farm-scene.jpg"],
      location,
      price: Number(price),
      pricingUnit,
      condition,
      operatorIncluded,
      terms,
      brand,
      model,
      horsepower: horsepower ? Number(horsepower) : 0,
      yearOfManufacture: year ? Number(year) : new Date().getFullYear(),
      scope,
      durationEstimate,
      deliverables,
    };

    const result = isEdit
      ? updateListing(existing!.id, payload)
      : createListing(providerProfileId, payload);
    setBusy(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    toast.success(
      isEdit ? "Listing updated" : "Listing created",
      isEdit
        ? "Your changes are live in search results."
        : "Your listing is now visible in farmer search results.",
    );
    router.push("/provider/listings");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError ? (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <Card>
        <CardHeader title="Basic information" />
        <div className="space-y-4">
          <Input
            label="Listing title"
            required
            value={title}
            error={errors.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Massey Ferguson 375 Tractor"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as ListingType)}
              options={[
                { value: "EQUIPMENT", label: "Equipment" },
                { value: "SERVICE", label: "Service" },
              ]}
            />
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
            />
          </div>
          <Textarea
            label="Description"
            required
            value={description}
            error={errors.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the equipment or service, what it is suited to, and anything farmers should know."
          />
          <Input
            label="Location"
            required
            value={location}
            error={errors.location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Samaru, Zaria, Kaduna State"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Pricing" description="Choose the pricing unit that matches your work." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Price (₦)"
            type="number"
            min={1}
            required
            value={price}
            error={errors.price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Select
            label="Pricing unit"
            value={pricingUnit}
            onChange={(e) => setPricingUnit(e.target.value as PricingUnit)}
            options={[
              { value: "FIXED", label: "Fixed price" },
              { value: "PER_HOUR", label: "Per hour" },
              { value: "PER_HECTARE", label: "Per hectare" },
              { value: "PER_DAY", label: "Per day" },
              { value: "PER_JOB", label: "Per job" },
            ]}
          />
          <Select
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
            options={[
              { value: "NEW", label: "New" },
              { value: "EXCELLENT", label: "Excellent" },
              { value: "GOOD", label: "Good" },
              { value: "FAIR", label: "Fair" },
            ]}
          />
        </div>
        <label className="mt-4 flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={operatorIncluded}
            onChange={(e) => setOperatorIncluded(e.target.checked)}
            className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary"
          />
          Operator is included with this listing
        </label>
      </Card>

      {type === "EQUIPMENT" ? (
        <Card>
          <CardHeader title="Equipment details" description="Optional specifications farmers can review." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Massey Ferguson" />
            <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. 375" />
            <Input
              label="Horsepower"
              type="number"
              min={0}
              value={horsepower}
              error={errors.horsepower}
              onChange={(e) => setHorsepower(e.target.value)}
            />
            <Input
              label="Year of manufacture"
              type="number"
              min={1970}
              max={new Date().getFullYear()}
              value={year}
              error={errors.yearOfManufacture}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Service details" description="Help farmers understand what the job covers." />
          <div className="space-y-4">
            <Textarea label="Scope of work" value={scope} onChange={(e) => setScope(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Estimated duration"
                value={durationEstimate}
                onChange={(e) => setDurationEstimate(e.target.value)}
                placeholder="e.g. About 2 hectares per hour"
              />
              <Input
                label="Deliverables"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                placeholder="e.g. Ploughed field ready for harrowing"
              />
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Images"
          description="Upload your own photo (max 200 KB) or select up to 3 photos from the demo library."
        />
        <div className="mb-3">
          <label
            htmlFor="listing-image-upload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-sand-deep"
          >
            Upload a photo
            <input
              id="listing-image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onUpload}
            />
          </label>
          {uploadError ? (
            <p role="alert" className="mt-2 text-xs text-danger">
              {uploadError}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {IMAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleImage(option.value)}
              aria-pressed={images.includes(option.value)}
              className={`overflow-hidden rounded-md border-2 ${
                images.includes(option.value) ? "border-primary" : "border-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={option.value} alt={option.label} className="h-16 w-full object-cover" />
            </button>
          ))}
          {images
            .filter((src) => src.startsWith("data:"))
            .map((src) => (
              <button
                key={src.slice(0, 64)}
                type="button"
                onClick={() => toggleImage(src)}
                aria-pressed
                className="overflow-hidden rounded-md border-2 border-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Uploaded photo" className="h-16 w-full object-cover" />
              </button>
            ))}
        </div>
        {images.length === 0 ? (
          <p className="mt-2 text-xs text-danger">Select or upload at least one image.</p>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Terms" description="State the rules for hiring this equipment or service." />
        <Textarea
          label="Terms"
          required
          value={terms}
          error={errors.terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="e.g. Minimum booking is one day. Fuel is the responsibility of the farmer."
        />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Saving..." : isEdit ? "Save listing changes" : "Create listing"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/provider/listings")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
