import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"

// En un sistema real, estos usuarios estarían en una base de datos
// y las contraseñas estarían hasheadas
const usuarios = [
  { id: "1", username: "admin", password: "admin123", name: "Administrador", role: "admin" },
  { id: "2", username: "usuario", password: "usuario123", name: "Usuario", role: "user" },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Buscar el usuario
        const user = usuarios.find(
          (user) => user.username === credentials.username && user.password === credentials.password,
        )

        if (user) {
          // En un sistema real, nunca devuelvas la contraseña
          return {
            id: user.id,
            name: user.name,
            email: user.username + "@example.com",
            role: user.role,
          }
        }

        return null
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      // Añadir el rol al token
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Añadir el rol a la sesión
      if (session.user) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "tu-secreto-seguro-aqui",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
