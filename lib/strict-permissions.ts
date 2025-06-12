"use client"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface UserPermissions {
  canAccessStock: boolean
  canAccessEmployees: boolean
  canAccessServices: boolean
  canAccessAdmin: boolean
}

export interface UserRole {
  username: string
  role: string
  custom_permissions?: string[]
  updated_at?: string
}

// Rutas públicas que no requieren verificación de permisos
const PUBLIC_ROUTES = [
  "/login",
  "/reset-password",
  "/offline.html",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/icons",
]

// Verificar si una ruta es pública
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

// Obtener módulo desde la ruta
export function getModuleFromPath(pathname: string): "stock" | "employees" | "services" | "admin" | null {
  if (pathname.startsWith("/stock")) return "stock"
  if (pathname.startsWith("/empleados")) return "employees"
  if (pathname.startsWith("/servicios")) return "services"
  if (pathname.startsWith("/admin")) return "admin"
  return null
}

// Cache para permisos (reducido para testing)
let permissionsCache: { [username: string]: { permissions: UserPermissions; timestamp: number } } = {}
const CACHE_DURATION = 30 * 1000 // 30 segundos

export async function getUserPermissionsStrict(username: string): Promise<UserPermissions> {
  console.log("🔍 getUserPermissionsStrict:", username)

  // Verificar cache
  const cached = permissionsCache[username]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("📋 Usando permisos desde cache:", cached.permissions)
    return cached.permissions
  }

  try {
    // Consultar directamente en Supabase
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single()

    if (error) {
      console.error("❌ Error consultando permisos:", error)
      return getDefaultPermissions(username)
    }

    const permissions = calculatePermissions(data)

    // Actualizar cache
    permissionsCache[username] = {
      permissions,
      timestamp: Date.now(),
    }

    console.log("✅ Permisos obtenidos de Supabase:", permissions)
    return permissions
  } catch (error) {
    console.error("❌ Error en getUserPermissionsStrict:", error)
    return getDefaultPermissions(username)
  }
}

function calculatePermissions(userRole: UserRole): UserPermissions {
  // Si tiene permisos personalizados, usarlos
  if (userRole.custom_permissions && userRole.custom_permissions.length > 0) {
    return {
      canAccessStock: userRole.custom_permissions.includes("stock"),
      canAccessEmployees: userRole.custom_permissions.includes("employees"),
      canAccessServices: userRole.custom_permissions.includes("services"),
      canAccessAdmin: userRole.custom_permissions.includes("admin"),
    }
  }

  // Usar permisos basados en rol
  switch (userRole.role.toLowerCase()) {
    case "super_admin":
      return {
        canAccessStock: true,
        canAccessEmployees: true,
        canAccessServices: true,
        canAccessAdmin: true,
      }
    case "manager":
      return {
        canAccessStock: true,
        canAccessEmployees: true,
        canAccessServices: true,
        canAccessAdmin: false,
      }
    case "employee":
      return {
        canAccessStock: true,
        canAccessEmployees: true,
        canAccessServices: false,
        canAccessAdmin: false,
      }
    default:
      return {
        canAccessStock: false,
        canAccessEmployees: false,
        canAccessServices: false,
        canAccessAdmin: false,
      }
  }
}

function getDefaultPermissions(username: string): UserPermissions {
  // Fallback para usuarios conocidos
  const knownUsers: { [key: string]: UserPermissions } = {
    admin: {
      canAccessStock: true,
      canAccessEmployees: true,
      canAccessServices: true,
      canAccessAdmin: true,
    },
    ncannata: {
      canAccessStock: true,
      canAccessEmployees: true,
      canAccessServices: true,
      canAccessAdmin: true,
    },
    dpili: {
      canAccessStock: true,
      canAccessEmployees: true,
      canAccessServices: true,
      canAccessAdmin: false,
    },
    jprey: {
      canAccessStock: true,
      canAccessEmployees: true,
      canAccessServices: false,
      canAccessAdmin: false,
    },
  }

  return (
    knownUsers[username.toLowerCase()] || {
      canAccessStock: false,
      canAccessEmployees: false,
      canAccessServices: false,
      canAccessAdmin: false,
    }
  )
}

export async function canAccessModule(
  username: string,
  module: "stock" | "employees" | "services" | "admin",
): Promise<boolean> {
  const permissions = await getUserPermissionsStrict(username)

  switch (module) {
    case "stock":
      return permissions.canAccessStock
    case "employees":
      return permissions.canAccessEmployees
    case "services":
      return permissions.canAccessServices
    case "admin":
      return permissions.canAccessAdmin
    default:
      return false
  }
}

// Limpiar cache manualmente
export function clearPermissionsCache() {
  permissionsCache = {}
  console.log("🧹 Cache de permisos limpiado")
}

// Función para verificar si el usuario puede acceder a una ruta específica
export async function canAccessRoute(username: string, pathname: string): Promise<boolean> {
  // Si es ruta pública, permitir acceso
  if (isPublicRoute(pathname)) {
    return true
  }

  // Obtener módulo de la ruta
  const module = getModuleFromPath(pathname)
  if (!module) {
    return true // Si no es un módulo específico, permitir acceso
  }

  // Verificar permisos para el módulo
  return await canAccessModule(username, module)
}
