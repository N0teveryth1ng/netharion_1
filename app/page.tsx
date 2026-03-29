"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useNetharionSound } from "@/components/SoundProvider";

export default function Home() {
  const { data: session } = useSession();
  const { play } = useNetharionSound();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-12 text-center">
      <p className="mb-4 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.35em] text-[var(--n-gold-dim)]">
        REALM ONLINE
      </p>
      <h1 className="font-[family-name:var(--font-cinzel)] text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
        <span className="text-gold-gradient">NETHARION</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-[var(--n-muted)]">
        Enter a starry abyss where your GitHub becomes your legend — level, relics, and presence in the great hall.
      </p>

      <div className="relative mt-14 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
        <div className="neth-gate-ring absolute inset-0 rounded-full border-2 border-[var(--n-border)] bg-gradient-to-br from-[#1a1028]/90 to-[#0a0810]/95" />
        <div
          className="absolute inset-4 rounded-full border border-dashed border-[var(--n-gold-dim)]/40 opacity-70"
          style={{ animation: "neth-spin-slow 72s linear infinite reverse" }}
        />
        <div className="relative z-10 flex flex-col items-center gap-3 px-4">
          {session?.user ? (
            <>
              <p className="text-sm text-[var(--n-muted)]">Welcome back,</p>
              <p className="font-[family-name:var(--font-cinzel)] text-lg text-[var(--n-gold)]">
                {session.user.githubLogin}
              </p>
              <Link
                href="/hall"
                onMouseEnter={() => play("hover")}
                onClick={() => play("portal")}
                className="mt-2 rounded-full bg-gradient-to-r from-[var(--n-gold-dim)] to-[var(--n-gold)] px-6 py-2 text-sm font-semibold text-[var(--n-void)] shadow-[0_0_32px_rgba(212,175,55,0.35)] transition hover:brightness-110"
              >
                Cross into the Hall
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--n-muted)]">The gate awaits your oath.</p>
              <button
                type="button"
                onMouseEnter={() => play("hover")}
                onClick={() => {
                  play("portal");
                  void signIn("github", { callbackUrl: "/hall" });
                }}
                className="mt-2 rounded-full bg-gradient-to-r from-[var(--n-gold-dim)] to-[var(--n-gold)] px-6 py-2 text-sm font-semibold text-[var(--n-void)] shadow-[0_0_32px_rgba(212,175,55,0.35)] transition hover:brightness-110"
              >
                Enter with GitHub
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-12 max-w-md font-[family-name:var(--font-cinzel)] text-sm italic text-[var(--n-muted)]">
        “Enter Netharion. Where Code Becomes Legend.”
      </p>
    </main>
  );
}
