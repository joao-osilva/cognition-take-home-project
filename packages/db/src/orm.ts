// Single-instance re-export of drizzle-orm for all workspace packages.
// Importing drizzle-orm directly elsewhere creates a second peer-scoped
// instance under pnpm, whose types are incompatible with this one.
export * from "drizzle-orm";
