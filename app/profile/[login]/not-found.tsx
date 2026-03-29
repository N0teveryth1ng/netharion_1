import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-[var(--n-gold)]">Lost in the void</h1>
      <p className="mt-4 text-[var(--n-muted)]">No adventurer by that name has crossed the gate yet.</p>
      <Link href="/hall" className="mt-8 inline-block text-[var(--n-ice)] underline">
        Return to the hall
      </Link>
    </main>
  );
}
