import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.usuario.findUnique({
          where: { username: credentials.username },
        })

        if (!user) return null

        let passwordValid = false
        if (user.password.startsWith('$2')) {
          passwordValid = await bcrypt.compare(credentials.password, user.password)
        } else {
          // Soporte para contraseñas en texto plano (migración desde sistema anterior)
          passwordValid = user.password === credentials.password
        }

        if (!passwordValid) return null

        return {
          id: user.id.toString(),
          name: user.username,
          email: user.username,
          role: user.role,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string; role?: string }).id = token.sub
        ;(session.user as { id?: string; role?: string }).role = token.role as string
      }
      return session
    },
  },
}
