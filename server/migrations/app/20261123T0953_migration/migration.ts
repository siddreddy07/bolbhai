#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6be9db0e6183bdb1d49277156c7c36e05d5b50937d1ed1a626246f096b45ca1c/contract';
import endContract from '../../snapshots/6be9db0e6183bdb1d49277156c7c36e05d5b50937d1ed1a626246f096b45ca1c/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/712167cadf5909e34d957bb3863907cd307693e78b409c31990e96095b6c1ed5/contract';
import startContract from '../../snapshots/712167cadf5909e34d957bb3863907cd307693e78b409c31990e96095b6c1ed5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'customer_transactions',
        column: col('transactionId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'customer_transactions',
        constraint: 'customer_transactions_transactionId_key',
        columns: ['transactionId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
