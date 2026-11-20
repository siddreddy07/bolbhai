#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0990da850079bd34c59839cc56c80f932576a1ac0054675ffaf85337320c43b7/contract';
import endContract from '../../snapshots/0990da850079bd34c59839cc56c80f932576a1ac0054675ffaf85337320c43b7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e51618840447456e1f9c6d0fa5b331ab6769af795e7333965e1e15559cdcdd40/contract';
import startContract from '../../snapshots/e51618840447456e1f9c6d0fa5b331ab6769af795e7333965e1e15559cdcdd40/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropNotNull({ schema: 'public', table: 'shops', column: 'name' })];
  }
}

MigrationCLI.run(import.meta.url, M);
