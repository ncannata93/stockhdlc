"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

// Definir los tipos
type User = {
  id: string
  username: string
  name: string
  role: string
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)

  // Sincronizar el estado con la sesión de NextAuth
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: (session.user.id as string) || "0",
        username: session.user.email?.split("@")[0] || "",
        name: session.user.name || "",
        role: session.user.role || "user",
      })
    } else {
      setUser(null)
    }
  }, [session])

  // Función de login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      })

      return !result?.error
    } catch (error) {
      console.error("Error during login:", error)
      return false
    }
  }

  // Función de logout
  const logout = async () => {
    await signOut({ redirect: false })
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: status === "authenticated",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
