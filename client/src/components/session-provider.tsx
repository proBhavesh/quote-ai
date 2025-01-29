"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { useEffect } from "react";

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  useEffect(() => {
    // Force a rerender on session change to sync client and server state
    console.debug("[SessionProvider] Session updated:", session);
  }, [session]);

  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
