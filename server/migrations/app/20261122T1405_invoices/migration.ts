#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5aa35e0bb554909d45d260bb646f3442ef09d5931b8e88ffde293e24c705edc2/contract';
import endContract from '../../snapshots/5aa35e0bb554909d45d260bb646f3442ef09d5931b8e88ffde293e24c705edc2/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ef20b74aaaa6f31374c0d0b39466f9682a78d5187b2b0eb4a6ed54f670adc8a2/contract';
import startContract from '../../snapshots/ef20b74aaaa6f31374c0d0b39466f9682a78d5187b2b0eb4a6ed54f670adc8a2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'invoices',
        columns: [
          col('date', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('items', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('shopId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('transactionId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoices',
        index: 'invoices_shopId_idx_e9207c6b',
        columns: ['shopId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'invoices',
        foreignKey: {
          name: 'invoices_shopId_fkey',
          columns: ['shopId'],
          references: { schema: 'public', table: 'shops', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
