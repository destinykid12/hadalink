/** Stable ID generation for local records. */

let counter = 0;

export function createId(prefix: string): string {
  counter += 1;
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}${random}${counter.toString(36)}`;
}

export function createReference(prefix: string): string {
  const block = (): string => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${block()}-${block()}`;
}
