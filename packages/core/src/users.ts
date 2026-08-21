import { platformSchema, type Db } from "@repo/db";
import { eq } from "@repo/db/orm";

// Kernel-owned writes to the platform `users` mirror table (synced from Clerk).

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export async function upsertUser(db: Db, user: UserProfile): Promise<void> {
  await db
    .insert(platformSchema.users)
    .values(user)
    .onConflictDoUpdate({
      target: platformSchema.users.id,
      set: { email: user.email, name: user.name },
    });
}

export async function removeUser(db: Db, id: string): Promise<void> {
  await db.delete(platformSchema.users).where(eq(platformSchema.users.id, id));
}
