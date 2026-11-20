#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/01d883ff9bc30b47059d26a6fa3818cba804b646cd749ca6cc7a73589031886a/contract';
import startContract from '../../snapshots/01d883ff9bc30b47059d26a6fa3818cba804b646cd749ca6cc7a73589031886a/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e51618840447456e1f9c6d0fa5b331ab6769af795e7333965e1e15559cdcdd40/contract';
import endContract from '../../snapshots/e51618840447456e1f9c6d0fa5b331ab6769af795e7333965e1e15559cdcdd40/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'items', column: 'id' }),
      this.dropDefault({ schema: 'public', table: 'shops', column: 'id' }),
      this.dropDefault({ schema: 'public', table: 'users', column: 'id' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
