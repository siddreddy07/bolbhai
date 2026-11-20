export const env = {
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN!,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
};
