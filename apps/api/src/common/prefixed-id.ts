import { randomUUID } from 'crypto';

export type EntityIdPrefix = 'evt' | 'tkt' | 'usr' | 'typ';

export function prefixedId(prefix: EntityIdPrefix) {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}
