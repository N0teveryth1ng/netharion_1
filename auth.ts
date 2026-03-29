import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const row = await prisma.$queryRaw`SELECT * FROM users WHERE _id = ${user.id} LIMIT 1` as any[];
        session.user.githubLogin = row[0]?.github_login ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile && typeof profile === "object") {
        const p = profile as { login?: string; name?: string | null; avatar_url?: string };
        await prisma.$queryRaw`
          UPDATE users 
          SET 
            github_login = ${p.login ?? null},
            name = ${p.name ?? user.name ?? null},
            image = ${p.avatar_url ?? user.image ?? null}
          WHERE _id = ${user.id}
        `;
      }
    },
  },
});
