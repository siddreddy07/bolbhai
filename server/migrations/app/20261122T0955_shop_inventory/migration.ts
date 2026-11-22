#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/87552acff119be57daff3598318cbf894e809fd3c95630a783cd10df547bd442/contract';
import startContract from '../../snapshots/87552acff119be57daff3598318cbf894e809fd3c95630a783cd10df547bd442/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ef20b74aaaa6f31374c0d0b39466f9682a78d5187b2b0eb4a6ed54f670adc8a2/contract';
import endContract from '../../snapshots/ef20b74aaaa6f31374c0d0b39466f9682a78d5187b2b0eb4a6ed54f670adc8a2/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'items' }),
      this.createTable({
        schema: 'public',
        table: 'shop_inventory',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('customName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('sellingPrice', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('shopId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('stock', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
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
        table: 'shop_inventory',
        constraint: 'shop_inventory_shopId_productId_key',
        columns: ['shopId', 'productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shop_inventory',
        index: 'shop_inventory_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shop_inventory',
        index: 'shop_inventory_shopId_idx_e9207c6b',
        columns: ['shopId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shop_inventory',
        foreignKey: {
          name: 'shop_inventory_shopId_fkey',
          columns: ['shopId'],
          references: { schema: 'public', table: 'shops', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shop_inventory',
        foreignKey: {
          name: 'shop_inventory_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
