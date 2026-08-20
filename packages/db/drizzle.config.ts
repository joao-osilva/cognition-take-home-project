import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  // Aggregates the platform/core slices owned here plus every app package's slice.
  schema: ["./src/schema/*.ts", "../apps/*/src/schema.ts"],
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
