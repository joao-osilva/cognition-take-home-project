import { Inngest } from "inngest";

// Event/signing keys come from the Vercel Inngest integration
// (INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY); the SDK reads them from env.
export const inngest = new Inngest({ id: "internal-tools" });
