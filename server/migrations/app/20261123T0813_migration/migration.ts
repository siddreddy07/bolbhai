#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/632b534f88f1f565e2f46dd6e7e04fb3a5f11f22aab0abed4779433b5b208a5d/contract';
import endContract from '../../snapshots/632b534f88f1f565e2f46dd6e7e04fb3a5f11f22aab0abed4779433b5b208a5d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7cdf7dbc115d0ae8257b672e0ab471b4510143de6dcc1f5dfd4542480afafa5c/contract';
import startContract from '../../snapshots/7cdf7dbc115d0ae8257b672e0ab471b4510143de6dcc1f5dfd4542480afafa5c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'customer_transactions',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('customerId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('invoiceId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('paymentStatus', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('shopId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subtotal', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'customer_transactions',
        constraint: 'customer_transactions_id_invoiceId_key',
        columns: ['id', 'invoiceId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
