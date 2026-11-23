export const env = {
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN!,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  // Where Ollama is. Leave it out to use constant.ts. In Docker it is http://host.docker.internal:11434/api
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  DEEPGRAM_API_KEY:process.env.DEEPGRAM_API_KEY,
  // Upstash Redis (the rate limits). Leave them out and the limits are off.
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
};
