#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract';
import endContract from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/21e0a40d61137768bc0e1d45658b037e79f32aedb6f4281655ee0ebc2eb2bcda/contract';
import startContract from '../../snapshots/21e0a40d61137768bc0e1d45658b037e79f32aedb6f4281655ee0ebc2eb2bcda/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'products',
        columns: [
          col('barcode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('brand', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('category', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('subcategory', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('unit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'products',
        constraint: 'products_barcode_key',
        columns: ['barcode'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
