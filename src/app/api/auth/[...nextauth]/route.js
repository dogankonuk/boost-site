import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtar'

const providers = []
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  }))
}

async function findOrCreateUser(email, provider) {
  let user = await prisma.user.findUnique({ where: { email } })
  if (user) return user

  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user'
  let username = base
  let suffix = 0
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix++
    username = `${base}${suffix}`
  }

  return prisma.user.create({
    data: { email, username, passwordHash: null, oauthProvider: provider, emailVerified: true },
  })
}

const handler = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false
      const dbUser = await findOrCreateUser(user.email, account?.provider)
      if (!dbUser.isActive) return false
      user.appUserId = dbUser.id
      user.appUsername = dbUser.username
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.appUserId = user.appUserId
        token.appUsername = user.appUsername
      }
      return token
    },
    async session({ session, token }) {
      if (token?.appUserId) {
        session.appToken = jwt.sign(
          { userId: token.appUserId, username: token.appUsername },
          JWT_SECRET,
          { expiresIn: '7d' }
        )
        session.appUsername = token.appUsername
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
