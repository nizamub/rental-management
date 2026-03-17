import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // The CLI uses this DIRECT URL to push tables and run Prisma Studio safely
    url: env("POSTGRES_URL_NON_POOLING"), 
  },
  migrations: {
    // Tells Prisma 7 how to run your seed script
    seed: "npx tsx prisma/seed.ts",
  },
});