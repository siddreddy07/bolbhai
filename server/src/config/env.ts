import { existsSync } from "node:fs";

// Load .env when present (local dev); in Docker the variables are already set.
if (existsSync(".env")) process.loadEnvFile();

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: required("DATABASE_URL"),
};
