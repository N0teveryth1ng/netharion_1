"use client";

import { SessionProvider } from "next-auth/react";
import { SoundProvider } from "@/components/SoundProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SoundProvider>{children}</SoundProvider>
    </SessionProvider>
  );
}
