#!/usr/bin/env -S node
import type {
  Contract as End,
  Contract as Start,
} from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract';
import endContract from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract.json' with { type: 'json' };
import startContract from '../../snapshots/0481d484aca09bb41b85923edc2f42881315267621234bf9b13333fb37bf11e0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    // Switches on fuzzy text matching, so "ashirvad" can find "Aashirvaad".
    // It is a raw SQL step of class "data" because the contract itself does not change.
    return [
      rawSql({
        id: 'install_pg_trgm',
        label: 'Install pg_trgm (fuzzy text search)',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'dependency', name: 'pg_trgm' } },
        precheck: [],
        execute: [{ description: 'create extension "pg_trgm"', sql: 'CREATE EXTENSION IF NOT EXISTS pg_trgm' }],
        postcheck: [
          {
            description: 'confirm extension "pg_trgm" is enabled',
            sql: `SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS "result"`,
            params: [],
            expectation: { expects: 'present', object: 'extension "pg_trgm"' },
          },
        ],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
