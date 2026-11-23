#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/296bbe7436b6d5b6f0b8eab2dd0b21f74416a9fe4b9dc7137eff6791cc0c1a7b/contract';
import startContract from '../../snapshots/296bbe7436b6d5b6f0b8eab2dd0b21f74416a9fe4b9dc7137eff6791cc0c1a7b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/7cdf7dbc115d0ae8257b672e0ab471b4510143de6dcc1f5dfd4542480afafa5c/contract';
import endContract from '../../snapshots/7cdf7dbc115d0ae8257b672e0ab471b4510143de6dcc1f5dfd4542480afafa5c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'invoices',
        index: 'invoices_shopId_date_idx_7c8f3022',
        columns: ['shopId', 'date'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
