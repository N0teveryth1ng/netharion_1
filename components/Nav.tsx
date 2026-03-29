"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { SoundToggle } from "@/components/SoundToggle";
import { useNetharionSound } from "@/components/SoundProvider";

const links = [
  { href: "/", label: "Gate" },
  { href: "/hall", label: "Great Hall" },
  { href: "/battle", label: "Arena" },
  { href: "/quests", label: "Quests" },
  { href: "/achievements", label: "Achievements" },
  { href: "/guilds", label: "Guilds" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/contributions", label: "Contributions" },
  { href: "/streaks", label: "Streaks" },
  { href: "/stats", label: "Stats" },
  { href: "/network", label: "Network" },
  { href: "/avatar", label: "Avatar" },
  { href: "/customize", label: "Customize" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { play } = useNetharionSound();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--n-border)] bg-[var(--n-void)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-[family-name:var(--font-cinzel)] text-lg tracking-[0.2em] text-[var(--n-gold)]"
          onMouseEnter={() => play("hover")}
          onClick={() => play("click")}
        >
          NETHARION
        </Link>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onMouseEnter={() => play("hover")}
              onClick={() => play("click")}
              className={`text-sm transition ${
                pathname === l.href
                  ? "text-[var(--n-gold)]"
                  : "text-[var(--n-muted)] hover:text-[var(--n-foreground)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {session?.user?.githubLogin && (
            <Link
              href={`/profile/${session.user.githubLogin}`}
              onMouseEnter={() => play("hover")}
              onClick={() => play("click")}
              className={`text-sm transition ${
                pathname?.startsWith("/profile/")
                  ? "text-[var(--n-gold)]"
                  : "text-[var(--n-muted)] hover:text-[var(--n-foreground)]"
              }`}
            >
              Presence
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <SoundToggle />
          {status === "loading" ? (
            <span className="text-xs text-[var(--n-muted)]">…</span>
          ) : session ? (
            <button
              type="button"
              onClick={() => {
                play("click");
                void signOut({ callbackUrl: "/" });
              }}
              className="rounded-full border border-[var(--n-border)] px-3 py-1.5 text-xs text-[var(--n-muted)] transition hover:border-red-500/40 hover:text-red-300"
            >
              Leave realm
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                play("portal");
                void signIn("github");
              }}
              className="rounded-full bg-gradient-to-r from-[var(--n-gold-dim)] to-[var(--n-gold)] px-4 py-1.5 text-xs font-semibold text-[var(--n-void)] shadow-[0_0_24px_rgba(212,175,55,0.25)] transition hover:brightness-110"
            >
              Enter with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
