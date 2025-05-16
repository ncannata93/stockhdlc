"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  initLocalAuth,
  loginLocalUser,
  logoutLocalUser,
  getCurrentLocalSession,
  createLocalUser,
  getLocalUsers,
  usernameToEmail as convertUsernameToEmail,
  type LocalSession,
  type LocalUser,
} from "@/lib/local-auth"

// Exportar la función para que esté disponible para otros componentes
export const usernameToEmail = convertUsernameToEmail

type AuthContextType = {
  session: LocalSession | null
  isLoading: boolean
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
  isLoading: true,
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
  const router = useRouter()

  // Inicializar el sistema de autenticación local
  useEffect(() => {
    const init = async () => {
      try {
        // Solo inicializar en el cliente
        if (typeof window !== "undefined") {
          initLocalAuth()
          const currentSession = getCurrentLocalSession()
          setSession(currentSession)
          setUsers(getLocalUsers())

          // Registrar el estado de la sesión para depuración
          console.log("Sesión inicial:", currentSession)
        }
      } catch (error) {
        console.error("Error al inicializar autenticación local:", error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Verificar periódicamente la sesión para mantenerla actualizada
  useEffect(() => {
    if (typeof window === "undefined") return

    // Verificar la sesión cada 10 segundos
    const interval = setInterval(() => {
      const currentSession = getCurrentLocalSession()
      if (JSON.stringify(currentSession) !== JSON.stringify(session)) {
        console.log("Actualizando sesión:", currentSession)
        setSession(currentSession)
      }
    }, 10000)

    // Limpiar el intervalo al desmontar
    return () => clearInterval(interval)
  }, [session])

  // Función para iniciar sesión
  const signIn = async (username: string, password: string) => {
    try {
      const result = loginLocalUser(username, password)

      if (result.success && result.session) {
        setSession(result.session)
        // Actualizar la lista de usuarios
        setUsers(getLocalUsers())
        console.log("Inicio de sesión exitoso:", result.session)
        return { success: true, error: null }
      } else {
        return { success: false, error: result.error || "Error al iniciar sesión" }
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al iniciar sesión",
      }
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      logoutLocalUser()
      setSession(null)
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Función para crear un nuevo usuario
  const createUser = async (username: string, password: string, isAdmin = false) => {
    try {
      const result = createLocalUser(username, password, isAdmin)

      if (result.success) {
        // Actualizar la lista de usuarios
        setUsers(getLocalUsers())
        return { success: true, error: null }
      } else {
        return { success: false, error: result.error || "Error al crear usuario" }
      }
    } catch (error) {
      console.error("Error al crear usuario:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al crear usuario",
      }
    }
  }

  // Verificar si el usuario actual es administrador
  const isAdmin = session?.isAdmin || false

  // Verificar si el usuario está autenticado
  const isAuthenticated = session !== null

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
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
