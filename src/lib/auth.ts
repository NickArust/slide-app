import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import { JWT } from "next-auth/jwt"

async function ensureUsername(userId: string, email?: string | null, name?: string | null) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) return null
  if (existing.username) return existing.username

  const base = (email?.split("@")[0] || name || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 15) || "user"
  let candidate = base.toLowerCase()
  let suffix = 1
  while (true) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { username: candidate },
      })
      return updated.username
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "P2002") {
        candidate = `${base.toLowerCase()}${suffix++}`
        continue
      }
      throw err
    }
  }
}

type AugmentedToken = JWT & { username?: string }

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
        token.email = user.email ?? token.email
        const username = await ensureUsername(user.id, user.email, user.name)
        if (username) (token as AugmentedToken).username = username
      } else if (!(token as AugmentedToken).username && token.sub) {
        const found = await prisma.user.findUnique({ where: { id: token.sub } })
        if (found?.username) (token as AugmentedToken).username = found.username
      }
      return token as AugmentedToken
    },
    async session({ session, token }) {
      if (token?.sub) (session as unknown as { userId?: string }).userId = token.sub
      if (token?.email && session.user) session.user.email = token.email as string
      const t = token as AugmentedToken
      if (t.username && session.user) {
        (session.user as { username?: string }).username = t.username
      }
      return session
    }
  }
}
