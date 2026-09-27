/** Category CRUD. Admin-managed, with safe delete rules. */

import { hydrateDatabase } from "@/lib/db";
import { createId } from "@/lib/ids";
import { nowISO } from "@/lib/dates";
import { categoryRepository, listingRepository } from "@/repositories";
import type { Category, ListingType, Result } from "@/types/models";

export interface CategoryInput {
  name: string;
  slug?: string;
  description: string;
  listingType: ListingType | "BOTH";
  icon?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listCategories(): Category[] {
  hydrateDatabase();
  return [...categoryRepository.findAll()].sort((a, b) => a.name.localeCompare(b.name));
}

export function createCategory(input: CategoryInput): Result<Category> {
  hydrateDatabase();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Category name is required." };
  const slug = input.slug ? slugify(input.slug) : slugify(name);
  if (categoryRepository.findOne((category) => category.slug === slug)) {
    return { ok: false, error: "A category with this name already exists." };
  }

  const now = nowISO();
  const category = categoryRepository.create({
    id: createId("cat"),
    name,
    slug,
    description: input.description.trim(),
    listingType: input.listingType,
    icon: input.icon ?? "wrench",
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true, data: category };
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Result<Category> {
  hydrateDatabase();
  const existing = categoryRepository.findById(id);
  if (!existing) return { ok: false, error: "Category not found." };

  const patch: Partial<Category> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.listingType !== undefined) patch.listingType = input.listingType;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.slug !== undefined) patch.slug = slugify(input.slug);

  const updated = categoryRepository.update(id, patch);
  return { ok: true, data: updated ?? existing };
}

export function deleteCategory(id: string): Result<boolean> {
  hydrateDatabase();
  const existing = categoryRepository.findById(id);
  if (!existing) return { ok: false, error: "Category not found." };

  const linked = listingRepository.count((listing) => listing.categoryId === id);
  if (linked > 0) {
    return {
      ok: false,
      error: `This category has ${linked} listing${linked === 1 ? "" : "s"}. Move or delete those listings first.`,
    };
  }

  categoryRepository.delete(id);
  return { ok: true, data: true };
}
