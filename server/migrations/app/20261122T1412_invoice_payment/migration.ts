#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/296bbe7436b6d5b6f0b8eab2dd0b21f74416a9fe4b9dc7137eff6791cc0c1a7b/contract';
import endContract from '../../snapshots/296bbe7436b6d5b6f0b8eab2dd0b21f74416a9fe4b9dc7137eff6791cc0c1a7b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/5aa35e0bb554909d45d260bb646f3442ef09d5931b8e88ffde293e24c705edc2/contract';
import startContract from '../../snapshots/5aa35e0bb554909d45d260bb646f3442ef09d5931b8e88ffde293e24c705edc2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'invoices',
        column: col('payment', 'text', {
          notNull: true,
          default: lit('PAID'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'invoices',
        column: col('paymentType', 'text', {
          notNull: true,
          default: lit('CASH'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'invoices',
        constraint: 'invoices_paymentType_check_59ca32a3',
        expression: sql`"paymentType" IN ('CASH', 'UPI')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'invoices',
        constraint: 'invoices_payment_check_cacccf0d',
        expression: sql`"payment" IN ('PAID', 'LEDGER')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
