"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Drawer } from "@/components/ui/Drawer";
import { listCategories } from "@/services/categoryService";
import type { ListingSearchFilters, ListingType } from "@/types/models";

const NIGERIAN_LOCATIONS = [
  "All locations",
  "Zaria",
  "Kaduna",
  "Kano",
  "Jos",
  "Abuja",
  "Minna",
  "Ibadan",
  "Enugu",
  "Awka",
  "Bauchi",
  "Gombe",
  "Yola",
  "Makurdi",
  "Lafia",
];

const SORT_OPTIONS = [
  { value: "RELEVANCE", label: "Sort by relevance" },
  { value: "PRICE_LOW", label: "Price: low to high" },
  { value: "PRICE_HIGH", label: "Price: high to low" },
  { value: "NEWEST", label: "Newest first" },
  { value: "RATING", label: "Highest rated" },
];

export function SearchPanel({
  filters,
  onChange,
  resultCount,
  lockType,
}: {
  filters: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
  resultCount: number;
  lockType?: ListingType;
}) {
  const categories = useMemo(() => listCategories(), []);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const update = (patch: Partial<ListingSearchFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const activeFilterCount = [
    filters.categoryId,
    filters.location && filters.location !== "All locations" ? filters.location : undefined,
    filters.minPrice,
    filters.maxPrice,
    filters.availableOnly,
    filters.operatorRequired,
    filters.verifiedOnly,
    filters.type && filters.type !== "ALL" && !lockType ? filters.type : undefined,
  ].filter(Boolean).length;

  const filterControls = (
    <div className="space-y-4">
      {!lockType ? (
        <Select
          label="Listing type"
          value={filters.type ?? "ALL"}
          onChange={(event) => update({ type: event.target.value as ListingSearchFilters["type"] })}
          options={[
            { value: "ALL", label: "Equipment and services" },
            { value: "EQUIPMENT", label: "Equipment only" },
            { value: "SERVICE", label: "Services only" },
          ]}
        />
      ) : null}

      <Select
        label="Category"
        value={filters.categoryId ?? ""}
        onChange={(event) => update({ categoryId: event.target.value || undefined })}
        options={[
          { value: "", label: "All categories" },
          ...categories.map((category) => ({ value: category.id, label: category.name })),
        ]}
      />

      <Select
        label="Location"
        value={filters.location ?? "All locations"}
        onChange={(event) =>
          update({ location: event.target.value === "All locations" ? undefined : event.target.value })
        }
        options={NIGERIAN_LOCATIONS.map((location) => ({ value: location, label: location }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min price (₦)"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={filters.minPrice ?? ""}
          onChange={(event) =>
            update({ minPrice: event.target.value === "" ? undefined : Number(event.target.value) })
          }
        />
        <Input
          label="Max price (₦)"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Any"
          value={filters.maxPrice ?? ""}
          onChange={(event) =>
            update({ maxPrice: event.target.value === "" ? undefined : Number(event.target.value) })
          }
        />
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium text-ink">Show only</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={!!filters.availableOnly}
            onChange={(event) => update({ availableOnly: event.target.checked })}
            className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary"
          />
          Available listings
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={!!filters.operatorRequired}
            onChange={(event) => update({ operatorRequired: event.target.checked })}
            className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary"
          />
          Operator included
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={!!filters.verifiedOnly}
            onChange={(event) => update({ verifiedOnly: event.target.checked })}
            className="h-4 w-4 rounded border-line-strong text-primary focus:ring-primary"
          />
          Verified providers only
        </label>
      </fieldset>

      <Button
        variant="outline"
        size="sm"
        fullWidth
        onClick={() =>
          onChange({
            query: filters.query,
            type: lockType ?? "ALL",
            sort: filters.sort ?? "RELEVANCE",
          })
        }
      >
        Clear filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="listing-search" className="sr-only">
            Search equipment and services
          </label>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="search" size={18} />
          </span>
          <input
            id="listing-search"
            type="search"
            value={filters.query ?? ""}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search by equipment, service, category, location, or provider"
            className="h-12 w-full rounded-md border border-line-strong bg-white pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 sm:w-52">
            <label htmlFor="listing-sort" className="sr-only">
              Sort results
            </label>
            <select
              id="listing-sort"
              value={filters.sort ?? "RELEVANCE"}
              onChange={(event) => update({ sort: event.target.value as ListingSearchFilters["sort"] })}
              className="h-12 w-full appearance-none rounded-md border border-line-strong bg-white px-3 pr-8 text-sm text-ink focus:border-primary focus:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="lg"
            icon="filter"
            className="sm:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="rounded-lg border border-line bg-white p-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{filterControls}</div>
        </div>
      </div>

      <Drawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Search filters"
        side="right"
      >
        {filterControls}
        <div className="mt-4">
          <Button variant="primary" fullWidth onClick={() => setMobileFiltersOpen(false)}>
            Show {resultCount} result{resultCount === 1 ? "" : "s"}
          </Button>
        </div>
      </Drawer>

      <p className="text-sm text-muted" aria-live="polite">
        {resultCount} listing{resultCount === 1 ? "" : "s"} found
      </p>
    </div>
  );
}
