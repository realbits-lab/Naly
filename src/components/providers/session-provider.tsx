"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // Auto-create anonymous session for guests
    if (!isPending && !session) {
      // Use better-auth's anonymous sign-in
      authClient.signIn.anonymous({
        callbackURL: window.location.pathname,
      }).catch((error) => {
        console.error("Failed to create anonymous session:", error);
      });
    }
  }, [session, isPending]);

  return <>{children}</>;
}
