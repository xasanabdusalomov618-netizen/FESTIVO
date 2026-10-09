"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicUser } from "@/lib/types";

const SessionContext = createContext<PublicUser | null>(null);

export function SessionProvider({ user, children }: { user: PublicUser | null; children: ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSessionUser(): PublicUser | null {
  return useContext(SessionContext);
}
