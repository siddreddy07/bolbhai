/// <reference types="node" />
import { definePrismaConfig } from '@prisma/cli-engine';
import {env} from './src/config/env.js'
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

process.loadEnvFile();

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: env.DATABASE_URL!,
    },
  }),
});
