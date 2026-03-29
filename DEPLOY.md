# Deploying Netharion (Vercel + PostgreSQL)

This app uses **PostgreSQL** in production. Local development can use the same database via Docker (see below).

## 1. Create a PostgreSQL database

Use any managed Postgres (recommended for Vercel):

- **[Neon](https://neon.tech)** — serverless, generous free tier, works well with Prisma.
- **[Supabase](https://supabase.com)** — Postgres + extras.
- **Vercel Postgres** — if available in your Vercel dashboard.

Create a database and copy the connection string. It usually looks like:

```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

For Neon, `sslmode=require` is often included automatically.

## 2. Environment variables on Vercel

In the Vercel project → **Settings** → **Environment Variables**, add:

| Name | Notes |
|------|--------|
| `DATABASE_URL` | Full Postgres URL (Production, Preview, Development as needed). |
| `AUTH_SECRET` | Random secret, e.g. `openssl rand -base64 32`. Same value can be used for all environments. |
| `GITHUB_ID` | GitHub OAuth App **Client ID**. |
| `GITHUB_SECRET` | GitHub OAuth App **Client secret**. |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://your-app.vercel.app` (no trailing slash). |
| `AUTH_URL` | Optional; Auth.js v5 sometimes reads this. Set to the same as `NEXTAUTH_URL` if you see redirect issues. |

### GitHub OAuth App URLs

In [GitHub → Developer Settings → OAuth Apps](https://github.com/settings/developers), set:

- **Homepage URL:** `https://your-app.vercel.app`
- **Authorization callback URL:** `https://your-app.vercel.app/api/auth/callback/github`

## 3. Build command

- **Locally**, `npm run build` runs `prisma generate` and `next build` only (no DB required for the compile step).
- **On Vercel**, the repo includes `vercel.json` so the build runs:

  `prisma migrate deploy && prisma generate && next build`

  That applies pending migrations, then generates the client, then builds Next.js.

**Important:** `DATABASE_URL` must be set for **Production** (and Preview, if you want migrations there) so `prisma migrate deploy` can reach Postgres during the Vercel build.

If you remove `vercel.json`, set the Vercel **Build Command** to:

`prisma migrate deploy && npm run build`

## 4. Deploy

Connect the GitHub repo to Vercel, set variables, and deploy. After the first deploy, sign in with GitHub and use **Great Hall → Sync from GitHub** to pull stats.

## 5. Local development with Postgres

1. Start Postgres:

   ```bash
   docker compose up -d
   ```

2. Set in `.env`:

   ```env
   DATABASE_URL="postgresql://netharion:netharion@localhost:5432/netharion"
   ```

3. Apply migrations:

   ```bash
   npx prisma migrate dev
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

If you previously used SQLite, remove the old `file:./prisma/dev.db` URL and run `migrate dev` once against Postgres so your schema matches.
