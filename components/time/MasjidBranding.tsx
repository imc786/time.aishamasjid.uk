/**
 * MasjidBranding component for the /tv/time page
 *
 * Displays masjid logo and Hibah branding in a horizontal layout.
 * Masjid logo on the left, Hibah logo with version number on the right.
 * Styled with reduced opacity for subtle appearance.
 */

import { HibahLogo } from "@/components/hibah-logo";
import Logo from "@/components/logo";

export function MasjidBranding() {
  return (
    <div className="flex items-center justify-between w-full opacity-80">
      <Logo className="h-16 w-auto" />
      <div className="flex flex-col items-end">
        <HibahLogo className="h-8 fill-slate-500" />
      </div>
    </div>
  );
}
