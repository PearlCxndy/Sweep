"use client";

import { usePathname } from "next/navigation";

/**
 * Page transitions.
 *
 * A template re-mounts on every navigation, so the fade runs each time without
 * any router wiring. Inside the motion budget: 120ms of opacity, nothing that
 * moves, which is also the form the spec asks for under reduced motion.
 *
 * The ground is painted by the outer element and does not fade. Without that,
 * the incoming page fades up from whatever `body` happens to be, and walking
 * into trip mode flashes paper before the ink arrives. The shell knows the
 * route's ground during render, so the first painted frame is already correct.
 */
function groundFor(pathname: string): "ink" | "grove" | "wash" {
  // Trip mode only. /trip/done and /trips are ordinary wash-ground screens,
  // and painting them ink would flash the wrong colour on the way in.
  if (pathname === "/trip") return "ink";
  if (pathname.startsWith("/onboarding")) return "grove";
  return "wash";
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-shell" data-ground={groundFor(pathname)}>
      <div className="page-enter">{children}</div>
    </div>
  );
}
