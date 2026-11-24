#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5ae254307e6fd02f6d99c7002b4bc18114e1ac45276130d9309253ec3af24fa3/contract';
import endContract from '../../snapshots/5ae254307e6fd02f6d99c7002b4bc18114e1ac45276130d9309253ec3af24fa3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/6be9db0e6183bdb1d49277156c7c36e05d5b50937d1ed1a626246f096b45ca1c/contract';
import startContract from '../../snapshots/6be9db0e6183bdb1d49277156c7c36e05d5b50937d1ed1a626246f096b45ca1c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'shop_inventory', column: 'customName' }),
      this.dropColumn({ schema: 'public', table: 'shop_inventory', column: 'unit' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
