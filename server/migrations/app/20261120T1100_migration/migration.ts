#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0990da850079bd34c59839cc56c80f932576a1ac0054675ffaf85337320c43b7/contract';
import startContract from '../../snapshots/0990da850079bd34c59839cc56c80f932576a1ac0054675ffaf85337320c43b7/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/21e0a40d61137768bc0e1d45658b037e79f32aedb6f4281655ee0ebc2eb2bcda/contract';
import endContract from '../../snapshots/21e0a40d61137768bc0e1d45658b037e79f32aedb6f4281655ee0ebc2eb2bcda/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'users',
        column: 'password',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
