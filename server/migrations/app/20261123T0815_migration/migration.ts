#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/632b534f88f1f565e2f46dd6e7e04fb3a5f11f22aab0abed4779433b5b208a5d/contract';
import startContract from '../../snapshots/632b534f88f1f565e2f46dd6e7e04fb3a5f11f22aab0abed4779433b5b208a5d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/6d9664c1fa65c396d19caf46686ea1db01d980bdfc572bd4fdf068089e1aacbf/contract';
import endContract from '../../snapshots/6d9664c1fa65c396d19caf46686ea1db01d980bdfc572bd4fdf068089e1aacbf/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'customer_transactions',
        index: 'customer_transactions_invoiceId_idx_d5c4f70e',
        columns: ['invoiceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'customer_transactions',
        index: 'customer_transactions_shopId_idx_e9207c6b',
        columns: ['shopId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customer_transactions',
        foreignKey: {
          name: 'customer_transactions_invoiceId_fkey',
          columns: ['invoiceId'],
          references: { schema: 'public', table: 'invoices', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customer_transactions',
        foreignKey: {
          name: 'customer_transactions_shopId_fkey',
          columns: ['shopId'],
          references: { schema: 'public', table: 'shops', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
