import { randomUUID } from 'crypto';

export type EntityIdPrefix = 'evt' | 'tkt' | 'usr' | 'typ' | 'act';

export function prefixedId(prefix: EntityIdPrefix) {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}
