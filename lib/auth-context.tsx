"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  loginLocalUser,
  logoutLocalUser,
  getCurrentLocalSession,
  createLocalUser,
  getLocalUsers,
  usernameToEmail as convertUsernameToEmail,
  type LocalSession,
  type LocalUser,
  ensurePredefinedUsers,
} from "@/lib/local-auth"

export const usernameToEmail = convertUsernameToEmail

type AuthContextType = {
  session: LocalSession | null
  user: LocalSession | null
  isLoading: boolean
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: (username: string, password: string) => Promise<{ success: boolean; error: string | null }>
  signOut: () => Promise<void>
  createUser: (
    username: string,
    password: string,
    isAdmin?: boolean,
  ) => Promise<{ success: boolean; error: string | null }>
  users: LocalUser[]
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  signIn: async () => ({ success: false, error: "No implementado" }),
  signOut: async () => {},
  createUser: async () => ({ success: false, error: "No implementado" }),
  users: [],
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LocalSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<LocalUser[]>([])

  // Inicializar solo una vez
  useEffect(() => {
    if (typeof window !== "undefined") {
      ensurePredefinedUsers()
      const currentSession = getCurrentLocalSession()
      setSession(currentSession)
      setUsers(getLocalUsers())
      setIsLoading(false)
    }
  }, [])

  const signIn = async (username: string, password: string) => {
    try {
      const result = loginLocalUser(username, password)
      if (result.success && result.session) {
        setSession(result.session)
        setUsers(getLocalUsers())
        return { success: true, error: null }
      } else {
        return { success: false, error: result.error || "Error al iniciar sesión" }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  const signOut = async () => {
    logoutLocalUser()
    setSession(null)
  }

  const createUser = async (username: string, password: string, isAdmin = false) => {
    try {
      const result = createLocalUser(username, password, isAdmin)
      if (result.success) {
        setUsers(getLocalUsers())
        return { success: true, error: null }
      } else {
        return { success: false, error: result.error || "Error al crear usuario" }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  const isAdmin = session?.isAdmin || false
  const isAuthenticated = session !== null

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session,
        isLoading,
        loading: isLoading,
        isAuthenticated,
        isAdmin,
        signIn,
        signOut,
        createUser,
        users,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
