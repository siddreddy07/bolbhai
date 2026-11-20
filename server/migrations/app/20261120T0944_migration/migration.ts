#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/01d883ff9bc30b47059d26a6fa3818cba804b646cd749ca6cc7a73589031886a/contract';
import endContract from '../../snapshots/01d883ff9bc30b47059d26a6fa3818cba804b646cd749ca6cc7a73589031886a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b3725694653f3ceea15beac4d1c0989e1efa8878a13bc34b04b0a63da3f89ab1/contract';
import startContract from '../../snapshots/b3725694653f3ceea15beac4d1c0989e1efa8878a13bc34b04b0a63da3f89ab1/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
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
      this.dropTable({ schema: 'public', table: 'posts' }),
      this.dropColumn({ schema: 'public', table: 'users', column: 'username' }),
      this.createTable({
        schema: 'public',
        table: 'items',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', {
            notNull: true,
            default: fn(sql`gen_random_uuid()`),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('shopId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('stock', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('unit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'shops',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('gstin', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn(sql`gen_random_uuid()`),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ownerId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('shops_type_check_c776e5ed', sql`"type" IN ('GROCERY', 'CAFE')`),
        ],
      }),
      this.dropDefault({ schema: 'public', table: 'users', column: 'id' }),
      this.alterColumnType({
        schema: 'public',
        table: 'users',
        column: 'id',
        type: 'uuid',
        using: sql`gen_random_uuid()`,
      }),
      this.setDefault({
        schema: 'public',
        table: 'users',
        column: col('id', 'uuid', {
          default: fn(sql`gen_random_uuid()`),
          codecRef: { codecId: 'pg/uuid@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'shops',
        constraint: 'shops_gstin_key',
        columns: ['gstin'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'items',
        index: 'items_shopId_idx_e9207c6b',
        columns: ['shopId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shops',
        index: 'shops_ownerId_idx_e2d0c1ef',
        columns: ['ownerId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'items',
        foreignKey: {
          name: 'items_shopId_fkey',
          columns: ['shopId'],
          references: { schema: 'public', table: 'shops', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shops',
        foreignKey: {
          name: 'shops_ownerId_fkey',
          columns: ['ownerId'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
