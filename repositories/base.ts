/**
 * Base repository contract.
 *
 * Every entity gets a repository so that swapping localStorage for a REST
 * API later only requires reimplementing these methods.
 */

import { getDatabase, mutate } from "@/lib/db";
import type { CollectionName, DatabaseShape, Timestamps } from "@/types/models";

type Entity = Timestamps & { id: string };

type ArrayCollections = {
  [K in CollectionName]: DatabaseShape[K] extends Array<infer T> ? T : never;
};

export interface Repository<T extends Entity> {
  findAll(): T[];
  findById(id: string): T | undefined;
  findByIds(ids: string[]): T[];
  findWhere(predicate: (record: T) => boolean): T[];
  findOne(predicate: (record: T) => boolean): T | undefined;
  create(record: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  replace(record: T): T;
  delete(id: string): boolean;
  count(predicate?: (record: T) => boolean): number;
}

export function createRepository<C extends keyof ArrayCollections>(
  collection: C,
): Repository<ArrayCollections[C] & Entity> {
  type T = ArrayCollections[C] & Entity;

  const read = (): T[] => getDatabase()[collection] as unknown as T[];

  return {
    findAll: () => [...read()],
    findById: (id) => read().find((record) => record.id === id),
    findByIds: (ids) => read().filter((record) => ids.includes(record.id)),
    findWhere: (predicate) => read().filter(predicate),
    findOne: (predicate) => read().find(predicate),
    create: (record) => {
      mutate((draft) => {
        (draft[collection] as unknown as T[]).push(record);
      });
      return record;
    },
    update: (id, patch) => {
      let updated: T | undefined;
      mutate((draft) => {
        const list = draft[collection] as unknown as T[];
        const index = list.findIndex((record) => record.id === id);
        if (index === -1) return;
        updated = {
          ...list[index],
          ...patch,
          updatedAt: new Date().toISOString(),
        } as T;
        list[index] = updated;
      });
      return updated;
    },
    replace: (record) => {
      mutate((draft) => {
        const list = draft[collection] as unknown as T[];
        const index = list.findIndex((existing) => existing.id === record.id);
        if (index === -1) {
          list.push(record);
        } else {
          list[index] = record;
        }
      });
      return record;
    },
    delete: (id) => {
      let removed = false;
      mutate((draft) => {
        const list = draft[collection] as unknown as T[];
        const index = list.findIndex((record) => record.id === id);
        if (index !== -1) {
          list.splice(index, 1);
          removed = true;
        }
      });
      return removed;
    },
    count: (predicate) => {
      const list = read();
      return predicate ? list.filter(predicate).length : list.length;
    },
  };
}
