"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Tipos para el contexto de autenticación
interface User {
  id: string
  email: string
  username: string
  fullName: string
  role: "admin" | "user"
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (credentials: { username: string; password: string }) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  refreshUser: () => void
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Usuarios locales para autenticación
const LOCAL_USERS = {
  admin: {
    id: "1",
    password: "admin123",
    email: "admin@hoteles.com",
    fullName: "Administrador",
    role: "admin" as const,
  },
  ncannata: {
    id: "2",
    password: "nacho1234N",
    email: "ncannata@hoteles.com",
    fullName: "Nicolás Cannata",
    role: "admin" as const,
  },
  dpili: {
    id: "3",
    password: "pili123",
    email: "dpili@hoteles.com",
    fullName: "Diego Pili",
    role: "user" as const,
  },
  jprey: {
    id: "4",
    password: "qw425540",
    email: "jprey@hoteles.com",
    fullName: "Juan Pablo Rey",
    role: "user" as const,
  },
}

// Función para obtener el nombre de display del usuario
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Usuario"

  // Priorizar fullName, luego username, luego email
  if (user.fullName && user.fullName.trim()) {
    return user.fullName
  }

  if (user.username && user.username.trim()) {
    return user.username
  }

  if (user.email && user.email.trim()) {
    return user.email.split("@")[0]
  }

  return "Usuario"
}

// Función para convertir username a email (función faltante)
export function usernameToEmail(username: string): string {
  // Si ya es un email, devolverlo tal como está
  if (username.includes("@")) {
    return username
  }

  // Convertir username a formato de email
  return `${username}@hotelescosta.com`
}

// Proveedor del contexto de autenticación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Función para refrescar el usuario actual
  const refreshUser = () => {
    try {
      const stored = localStorage.getItem("auth_user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        console.log("Usuario refrescado:", userData.fullName)
      } else {
        setUser(null)
        console.log("No hay usuario actual")
      }
    } catch (error) {
      console.error("Error refrescando usuario:", error)
      setUser(null)
    }
  }

  // Función de login
  const signIn = async (credentials: { username: string; password: string }) => {
    try {
      console.log("Iniciando proceso de login...")

      const { username, password } = credentials
      const localUser = LOCAL_USERS[username as keyof typeof LOCAL_USERS]

      if (localUser && localUser.password === password) {
        const userData: User = {
          id: localUser.id,
          email: localUser.email,
          username: username,
          fullName: localUser.fullName,
          role: localUser.role,
        }

        setUser(userData)
        localStorage.setItem("auth_user", JSON.stringify(userData))
        console.log("Login exitoso, usuario establecido:", userData.fullName)

        return { success: true }
      } else {
        console.log("Login fallido: credenciales incorrectas")
        return { success: false, message: "Credenciales incorrectas" }
      }
    } catch (error) {
      console.error("Error en login:", error)
      return {
        success: false,
        message: "Error interno del sistema",
      }
    }
  }

  // Función de logout
  const logout = async (): Promise<void> => {
    try {
      console.log("Iniciando proceso de logout...")
      localStorage.removeItem("auth_user")
      setUser(null)
      console.log("Logout completado")
    } catch (error) {
      console.error("Error en logout:", error)
    }
  }

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = () => {
      try {
        console.log("Verificando sesión existente...")
        refreshUser()
      } catch (error) {
        console.error("Error verificando sesión:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook para usar el contexto de autenticación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

// Hooks adicionales para conveniencia
export function useUser(): User | null {
  const { user } = useAuth()
  return user
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.role === "admin" || false
}
