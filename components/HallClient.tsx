"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useNetharionSound } from "@/components/SoundProvider";

type LogRow = {
  id: string;
  message: string;
  createdAt: string;
  user: { name: string | null; githubLogin: string | null; image: string | null };
};

export type Champion = {
  id: string;
  name: string | null;
  githubLogin: string | null;
  image: string | null;
  level: number;
  title: string | null;
  xp: number;
};

type FriendsPayload = {
  incoming: {
    id: string;
    requester: {
      id: string;
      name: string | null;
      githubLogin: string | null;
      image: string | null;
      level: number;
      title: string | null;
    };
  }[];
  outgoing: {
    id: string;
    addressee: {
      id: string;
      name: string | null;
      githubLogin: string | null;
      image: string | null;
      level: number;
      title: string | null;
    };
  }[];
  friends: { friendshipId: string; user: Champion }[];
};

export default function HallClient({
  initialLogs,
  champions,
}: {
  initialLogs: LogRow[];
  champions: Champion[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { play } = useNetharionSound();
  const [logs, setLogs] = useState(initialLogs);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [friendLogin, setFriendLogin] = useState("");
  const [friendsState, setFriendsState] = useState<FriendsPayload | null>(null);

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/friends");
    if (!res.ok) return;
    const data = (await res.json()) as FriendsPayload;
    setFriendsState(data);
  }, []);

  const refreshFeed = useCallback(async () => {
    const res = await fetch("/api/hall/feed");
    if (!res.ok) return;
    const data = (await res.json()) as {
      logs: (LogRow & { createdAt: string | Date })[];
    };
    setLogs(
      data.logs.map((l) => ({
        ...l,
        createdAt: typeof l.createdAt === "string" ? l.createdAt : new Date(l.createdAt).toISOString(),
      })),
    );
  }, []);

  useEffect(() => {
    if (session?.user) void loadFriends();
  }, [session?.user, loadFriends]);

  const handleSync = async () => {
    setSyncing(true);
    setToast(null);
    play("chime");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setToast(body.error ?? "Sync failed");
        play("click");
        return;
      }
      play("success");
      setToast("Realm attuned to your GitHub.");
      await refreshFeed();
      router.refresh();
    } catch {
      setToast("Network error");
    } finally {
      setSyncing(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendLogin.trim()) return;
    play("click");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", login: friendLogin.trim() }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setToast(body.error ?? "Could not send request");
      return;
    }
    setFriendLogin("");
    setToast("Pact sigil sent.");
    await loadFriends();
  };

  const respond = async (friendshipId: string, accept: boolean) => {
    play(accept ? "success" : "click");
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", friendshipId, accept }),
    });
    await loadFriends();
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-4">
        <h2 className="font-[family-name:var(--font-cinzel)] text-lg text-[var(--n-gold)]">Your essence</h2>
        {status === "loading" && <p className="text-sm text-[var(--n-muted)]">Reading the veil…</p>}
        {status === "unauthenticated" && (
          <p className="text-sm text-[var(--n-muted)]">Sign in with GitHub to sync your legend.</p>
        )}
        {session?.user && (
          <div className="rounded-2xl border border-[var(--n-border)] bg-[var(--n-surface)]/80 p-4 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-full border border-[var(--n-border)]"
                />
              )}
              <div>
                <p className="font-medium">{session.user.githubLogin}</p>
                <p className="text-xs text-[var(--n-muted)]">GitHub-bound soul</p>
              </div>
            </div>
            <button
              type="button"
              disabled={syncing}
              onClick={() => void handleSync()}
              onMouseEnter={() => play("hover")}
              className="mt-4 w-full rounded-xl border border-[var(--n-gold-dim)]/50 bg-[var(--n-elevated)] py-2.5 text-sm font-semibold text-[var(--n-gold)] transition hover:border-[var(--n-gold)] disabled:opacity-50"
            >
              {syncing ? "Attuning…" : "Sync from GitHub"}
            </button>
            {toast && <p className="mt-2 text-xs text-[var(--n-ice)]">{toast}</p>}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--n-border)] bg-[var(--n-surface)]/60 p-4">
          <h3 className="font-[family-name:var(--font-cinzel)] text-sm text-[var(--n-gold-dim)]">Companions</h3>
          {!session?.user && <p className="mt-2 text-xs text-[var(--n-muted)]">Sign in to send requests.</p>}
          {session?.user && (
            <>
              <div className="mt-3 flex gap-2">
                <input
                  value={friendLogin}
                  onChange={(e) => setFriendLogin(e.target.value)}
                  placeholder="GitHub username"
                  className="flex-1 rounded-lg border border-[var(--n-border)] bg-[var(--n-void)] px-3 py-2 text-sm outline-none ring-[var(--n-gold-dim)] focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => void sendFriendRequest()}
                  onMouseEnter={() => play("hover")}
                  className="rounded-lg bg-[var(--n-ember)]/90 px-3 py-2 text-xs font-semibold text-white"
                >
                  Invite
                </button>
              </div>
              {friendsState?.incoming?.length ? (
                <ul className="mt-4 space-y-2">
                  {friendsState.incoming.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--n-border)] px-2 py-2 text-xs"
                    >
                      <span>{f.requester.githubLogin}</span>
                      <span className="flex gap-1">
                        <button
                          type="button"
                          className="rounded bg-emerald-600/80 px-2 py-1"
                          onClick={() => void respond(f.id, true)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="rounded bg-zinc-700 px-2 py-1"
                          onClick={() => void respond(f.id, false)}
                        >
                          Decline
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {friendsState?.friends?.length ? (
                <ul className="mt-4 space-y-2 text-sm">
                  {friendsState.friends.map((f) => (
                    <li key={f.friendshipId}>
                      <Link
                        href={`/profile/${f.user.githubLogin ?? ""}`}
                        className="text-[var(--n-ice)] hover:underline"
                        onClick={() => play("click")}
                      >
                        {f.user.githubLogin}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : session?.user && friendsState ? (
                <p className="mt-3 text-xs text-[var(--n-muted)]">No companions yet — forge alliances in the hall.</p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="lg:col-span-5">
        <h2 className="font-[family-name:var(--font-cinzel)] text-lg text-[var(--n-gold)]">Battle log</h2>
        <ul className="mt-4 space-y-3">
          {logs.map((l) => (
            <li
              key={l.id}
              className="rounded-xl border border-[var(--n-border)] bg-[var(--n-surface)]/50 px-4 py-3 text-left text-sm leading-relaxed text-[var(--n-muted)]"
            >
              <span className="text-[var(--n-foreground)]">{l.message}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-wider text-[var(--n-gold-dim)]">
                {new Date(l.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {!logs.length && (
            <li className="text-sm text-[var(--n-muted)]">The hall is quiet — be the first to sync your legend.</li>
          )}
        </ul>
      </section>

      <section className="lg:col-span-3">
        <h2 className="font-[family-name:var(--font-cinzel)] text-lg text-[var(--n-gold)]">Hall of legends</h2>
        <ul className="mt-4 space-y-3">
          {champions.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/profile/${c.githubLogin ?? ""}`}
                onMouseEnter={() => play("hover")}
                onClick={() => play("click")}
                className="flex items-center gap-3 rounded-xl border border-[var(--n-border)] bg-[var(--n-surface)]/40 px-3 py-2 transition hover:border-[var(--n-gold-dim)]"
              >
                <span className="font-[family-name:var(--font-cinzel)] text-xs text-[var(--n-gold-dim)]">
                  #{i + 1}
                </span>
                {c.image && (
                  <Image src={c.image} alt="" width={36} height={36} className="rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.githubLogin}</p>
                  <p className="truncate text-xs text-[var(--n-muted)]">
                    Lv.{c.level} · {c.title}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
