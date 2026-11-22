#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract';
import startContract from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/87552acff119be57daff3598318cbf894e809fd3c95630a783cd10df547bd442/contract';
import endContract from '../../snapshots/87552acff119be57daff3598318cbf894e809fd3c95630a783cd10df547bd442/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'products',
        column: col('cost', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'products',
        column: col('currency', 'text', {
          notNull: true,
          default: lit('INR'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
