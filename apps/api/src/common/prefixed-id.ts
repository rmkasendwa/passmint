import { randomUUID } from 'crypto';

export type EntityIdPrefix = 'evt' | 'tkt' | 'usr';

export function prefixedId(prefix: EntityIdPrefix) {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}
