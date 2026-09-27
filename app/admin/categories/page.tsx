"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useDatabase, useHydration } from "@/hooks/useDatabase";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/services/categoryService";
import { listingRepository } from "@/repositories";
import type { Category, ListingType } from "@/types/models";
import { validateRequired, hasErrors, type FieldErrors } from "@/lib/validation";

export default function AdminCategoriesPage() {
  const hydrated = useHydration();
  useDatabase();
  const toast = useToast();
  const categories = useMemo(() => listCategories(), []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<ListingType | "BOTH">("BOTH");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  if (!hydrated) return <LoadingState label="Loading categories..." />;

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setListingType("BOTH");
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description);
    setListingType(category.listingType);
    setErrors({});
    setModalOpen(true);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    validateRequired(name, "Category name", nextErrors, "name");
    validateRequired(description, "Description", nextErrors, "description");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    const result = editing
      ? updateCategory(editing.id, { name, description, listingType })
      : createCategory({ name, description, listingType });
    setBusy(false);
    if (!result.ok) {
      toast.error("Could not save category", result.error);
      return;
    }
    toast.success(editing ? "Category updated" : "Category created", result.data.name);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            Manage the equipment and service categories used across the marketplace.
          </p>
        </div>
        <Button icon="plus" onClick={openCreate}>
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="tools"
          title="No categories"
          message="Create categories so providers can classify their listings."
          action={<Button onClick={openCreate}>Add category</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const listingCount = listingRepository.count(
              (listing) => listing.categoryId === category.id,
            );
            return (
              <Card key={category.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-ink">{category.name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {category.slug} | {listingCount} listing{listingCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge tone={category.listingType === "BOTH" ? "neutral" : "soft"}>
                    {category.listingType === "BOTH"
                      ? "Equipment and services"
                      : category.listingType === "EQUIPMENT"
                        ? "Equipment"
                        : "Services"}
                  </Badge>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{category.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" icon="edit" onClick={() => openEdit(category)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon="trash" onClick={() => setPendingDelete(category)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit category" : "Create category"}
        description="Categories organize listings in search and filters."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Category name"
            required
            value={name}
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ploughing equipment"
          />
          <Textarea
            label="Description"
            required
            value={description}
            error={errors.description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What belongs in this category?"
          />
          <Select
            label="Applies to"
            value={listingType}
            onChange={(e) => setListingType(e.target.value as ListingType | "BOTH")}
            options={[
              { value: "BOTH", label: "Equipment and services" },
              { value: "EQUIPMENT", label: "Equipment only" },
              { value: "SERVICE", label: "Services only" },
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        message={`"${pendingDelete?.name ?? ""}" will be removed. Categories with listings cannot be deleted until those listings are moved or removed.`}
        confirmLabel="Delete category"
        danger
        busy={busy}
        onConfirm={() => {
          if (!pendingDelete) return;
          setBusy(true);
          const result = deleteCategory(pendingDelete.id);
          setBusy(false);
          setPendingDelete(null);
          if (!result.ok) {
            toast.error("Could not delete category", result.error);
            return;
          }
          toast.success("Category deleted", "The category was removed.");
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
