export type GitHubStatsSnapshot = {
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  contributionsLastYear: number;
  mergedPullRequests: number;
  topRepo: { name: string; stars: number; description: string | null } | null;
};

export function computeXp(s: GitHubStatsSnapshot): number {
  return (
    s.totalStars * 4 +
    s.contributionsLastYear * 2 +
    s.followers * 3 +
    s.publicRepos * 6 +
    s.mergedPullRequests * 12
  );
}

export function xpToLevel(xp: number): number {
  const lvl = Math.floor(Math.sqrt(xp / 45)) + 1;
  return Math.min(99, Math.max(1, lvl));
}

export function titleForLevel(level: number): string {
  if (level <= 5) return "Initiate";
  if (level <= 12) return "Codewalker";
  if (level <= 22) return "Spellforger";
  if (level <= 38) return "Archmage of the CI";
  if (level <= 55) return "Starforged";
  if (level <= 75) return "Warden of Netharion";
  return "Legend of the Realm";
}

export function rankLabelFromLevel(level: number): string {
  if (level < 15) return "Bronze";
  if (level < 35) return "Silver";
  if (level < 60) return "Gold";
  if (level < 85) return "Mythic";
  return "Immortal";
}
