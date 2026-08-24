import { Inngest } from "inngest";

// Event/signing keys come from the Vercel Inngest integration
// (INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY); the SDK reads them from env.
export const inngest = new Inngest({ id: "internal-tools" });

/** Fire-and-forget event emit: a delivery failure must never fail the user
 * action that triggered it. */
export async function sendEvent(name: string, data: Record<string, unknown>): Promise<void> {
  try {
    await inngest.send({ name, data });
  } catch (error) {
    console.error(`Failed to send Inngest event ${name}`, error);
  }
}
