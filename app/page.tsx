/**
 * Time Page route
 *
 * Server Component wrapper that forces dynamic rendering so the
 * prayer-clock always shows the current date on first paint —
 * even before client-side JavaScript hydrates.
 *
 * Without this, Next.js statically generates the page at build time
 * and caches the HTML (including the build-time date) indefinitely.
 */

import { TimePage } from "@/components/time/TimePage";

export const dynamic = "force-dynamic";

export default function Page() {
  return <TimePage />;
}
