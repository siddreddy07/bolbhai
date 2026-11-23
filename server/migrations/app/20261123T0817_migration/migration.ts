#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6d9664c1fa65c396d19caf46686ea1db01d980bdfc572bd4fdf068089e1aacbf/contract';
import startContract from '../../snapshots/6d9664c1fa65c396d19caf46686ea1db01d980bdfc572bd4fdf068089e1aacbf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ee2fa86c1924a75d5921323b385d0aab9bb09c560b11b666df933e44e5900222/contract';
import endContract from '../../snapshots/ee2fa86c1924a75d5921323b385d0aab9bb09c560b11b666df933e44e5900222/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropColumn({ schema: 'public', table: 'invoices', column: 'transactionId' })];
  }
}

MigrationCLI.run(import.meta.url, M);
