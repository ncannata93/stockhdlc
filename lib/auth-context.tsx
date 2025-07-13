"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  username: string
  displayName: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (credentials: { username: string; password: string }) => Promise<{
    success: boolean
    user?: User
    error?: string
  }>
  logout: () => void
  getUserDisplayName: (username: string) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// User database
const users = [
  { id: "1", username: "ncannata", password: "nacho1234N", displayName: "Nacho Cannata", role: "admin" },
  { id: "2", username: "admin", password: "admin123", displayName: "Administrador", role: "admin" },
  { id: "3", username: "dpili", password: "pili123", displayName: "Diego Pili", role: "manager" },
]

// Helper function to convert username to email format
export function usernameToEmail(username: string): string {
  return `${username}@hotelescosta.com`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const signIn = async (credentials: { username: string; password: string }) => {
    try {
      console.log("SignIn attempt:", credentials.username)

      const foundUser = users.find((u) => u.username === credentials.username && u.password === credentials.password)

      if (foundUser) {
        const userWithoutPassword = {
          id: foundUser.id,
          username: foundUser.username,
          displayName: foundUser.displayName,
          role: foundUser.role,
        }

        setUser(userWithoutPassword)
        localStorage.setItem("user", JSON.stringify(userWithoutPassword))

        console.log("Login successful for:", foundUser.username)
        return { success: true, user: userWithoutPassword }
      } else {
        console.log("Login failed: Invalid credentials")
        return { success: false, error: "Credenciales incorrectas" }
      }
    } catch (error) {
      console.error("SignIn error:", error)
      return { success: false, error: "Error interno del servidor" }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  const getUserDisplayName = (username: string): string => {
    const foundUser = users.find((u) => u.username === username)
    return foundUser?.displayName || username
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    logout,
    getUserDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
