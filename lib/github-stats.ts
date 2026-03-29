import type { GitHubStatsSnapshot } from "@/lib/game";

const GITHUB_API = "https://api.github.com";

async function ghJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

async function graphqlContributions(
  token: string,
  login: string,
): Promise<{ total: number; contributions: { date: string; count: number }[] }> {
  const query = `
    query ($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login } }),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GraphQL: ${res.status} ${text}`);
  }
  const body = (await res.json()) as {
    data?: {
      user?: {
        contributionsCollection?: {
          contributionCalendar?: {
            totalContributions?: number;
            weeks?: { contributionDays?: { date: string; contributionCount: number }[] }[];
          };
        };
      };
    };
    errors?: { message: string }[];
  };
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  
  const calendar = body.data?.user?.contributionsCollection?.contributionCalendar;
  const total = calendar?.totalContributions ?? 0;
  const weeks = calendar?.weeks ?? [];
  
  const contributions: { date: string; count: number }[] = [];
  for (const week of weeks) {
    for (const day of week.contributionDays ?? []) {
      contributions.push({ date: day.date, count: day.contributionCount });
    }
  }
  
  return { total, contributions };
}

type Repo = {
  name: string;
  stargazers_count: number;
  description: string | null;
  fork: boolean;
};

export async function fetchGitHubStats(
  token: string,
  login: string,
): Promise<GitHubStatsSnapshot> {
  const user = await ghJson<{
    public_repos: number;
    followers: number;
    following: number;
  }>(`/users/${encodeURIComponent(login)}`, token);

  let page = 1;
  let totalStars = 0;
  let top: Repo | null = null;

  for (;;) {
    const repos = await ghJson<Repo[]>(
      `/users/${encodeURIComponent(login)}/repos?per_page=100&page=${page}&sort=updated`,
      token,
    );
    if (repos.length === 0) break;
    for (const r of repos) {
      if (r.fork) continue;
      totalStars += r.stargazers_count;
      if (!top || r.stargazers_count > top.stargazers_count) top = r;
    }
    if (repos.length < 100) break;
    page += 1;
    if (page > 20) break;
  }

  let mergedPullRequests = 0;
  try {
    const search = await ghJson<{
      total_count: number;
    }>(
      `/search/issues?q=${encodeURIComponent(`author:${login} is:pr is:merged`)}&per_page=1`,
      token,
    );
    mergedPullRequests = search.total_count ?? 0;
  } catch {
    mergedPullRequests = 0;
  }

  let contributionsLastYear = 0;
  let contributions: { date: string; count: number }[] = [];
  try {
    const result = await graphqlContributions(token, login);
    contributionsLastYear = result.total;
    contributions = result.contributions;
  } catch {
    contributionsLastYear = 0;
    contributions = [];
  }

  return {
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    totalStars,
    contributionsLastYear,
    mergedPullRequests,
    topRepo: top
      ? { name: top.name, stars: top.stargazers_count, description: top.description }
      : null,
    contributions,
  };
}
