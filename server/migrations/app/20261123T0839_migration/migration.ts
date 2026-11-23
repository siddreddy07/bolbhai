#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/712167cadf5909e34d957bb3863907cd307693e78b409c31990e96095b6c1ed5/contract';
import endContract from '../../snapshots/712167cadf5909e34d957bb3863907cd307693e78b409c31990e96095b6c1ed5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ee2fa86c1924a75d5921323b385d0aab9bb09c560b11b666df933e44e5900222/contract';
import startContract from '../../snapshots/ee2fa86c1924a75d5921323b385d0aab9bb09c560b11b666df933e44e5900222/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'customers',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('shopId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoices',
        column: col('customerId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'customers',
        constraint: 'customers_shopId_phone_key',
        columns: ['shopId', 'phone'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customer_transactions',
        index: 'customer_transactions_customerId_idx_b2a8a46c',
        columns: ['customerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customers',
        index: 'customers_shopId_idx_e9207c6b',
        columns: ['shopId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoices',
        index: 'invoices_customerId_idx_b2a8a46c',
        columns: ['customerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customers',
        foreignKey: {
          name: 'customers_shopId_fkey',
          columns: ['shopId'],
          references: { schema: 'public', table: 'shops', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customer_transactions',
        foreignKey: {
          name: 'customer_transactions_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'invoices',
        foreignKey: {
          name: 'invoices_customerId_fkey',
          columns: ['customerId'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
