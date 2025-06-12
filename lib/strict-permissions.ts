"use client"

import { getSupabaseClient } from "@/lib/supabase"

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

// Cache para permisos
let permissionsCache: { [username: string]: { permissions: UserPermissions; timestamp: number } } = {}
const CACHE_DURATION = 30 * 1000 // 30 segundos

// Estado de disponibilidad de Supabase
let supabaseAvailable: boolean | null = null
let lastSupabaseCheck = 0
const SUPABASE_CHECK_INTERVAL = 60 * 1000 // 1 minuto

async function checkSupabaseAvailability(): Promise<boolean> {
  const now = Date.now()

  // Si ya verificamos recientemente, usar el resultado cacheado
  if (supabaseAvailable !== null && now - lastSupabaseCheck < SUPABASE_CHECK_INTERVAL) {
    return supabaseAvailable
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.log("🔍 Cliente Supabase no disponible")
      supabaseAvailable = false
      lastSupabaseCheck = now
      return false
    }

    // Intentar una consulta simple con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

    const { error } = await supabase.from("user_roles").select("username").limit(1).abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) {
      console.log("🔍 Error al verificar tabla user_roles:", error.message)
      supabaseAvailable = false
    } else {
      console.log("✅ Supabase disponible")
      supabaseAvailable = true
    }
  } catch (error) {
    console.log("🔍 Error de conexión a Supabase:", error)
    supabaseAvailable = false
  }

  lastSupabaseCheck = now
  return supabaseAvailable
}

export async function getUserPermissionsStrict(username: string): Promise<UserPermissions> {
  console.log("🔍 getUserPermissionsStrict:", username)

  // Verificar cache primero
  const cached = permissionsCache[username]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("📋 Usando permisos desde cache:", cached.permissions)
    return cached.permissions
  }

  // Verificar si Supabase está disponible
  const isSupabaseAvailable = await checkSupabaseAvailability()

  if (!isSupabaseAvailable) {
    console.log("⚠️ Supabase no disponible, usando permisos por defecto")
    const defaultPermissions = getDefaultPermissions(username)

    // Cachear los permisos por defecto por un tiempo más corto
    permissionsCache[username] = {
      permissions: defaultPermissions,
      timestamp: Date.now(),
    }

    return defaultPermissions
  }

  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return getDefaultPermissions(username)
    }

    // Intentar consultar con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single()
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) {
      console.log("⚠️ Error consultando permisos, usando fallback:", error.message)
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
    console.log("⚠️ Error en getUserPermissionsStrict, usando fallback:", error)
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
  console.log("🔧 Usando permisos por defecto para:", username)

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

  const defaultPerms = knownUsers[username.toLowerCase()] || {
    canAccessStock: true, // Por defecto permitir acceso básico
    canAccessEmployees: true,
    canAccessServices: false,
    canAccessAdmin: false,
  }

  console.log("🔧 Permisos por defecto asignados:", defaultPerms)
  return defaultPerms
}

export async function canAccessModule(
  username: string,
  module: "stock" | "employees" | "services" | "admin",
): Promise<boolean> {
  try {
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
  } catch (error) {
    console.log("⚠️ Error en canAccessModule, permitiendo acceso por defecto:", error)
    // En caso de error, permitir acceso básico
    return module === "stock" || module === "employees"
  }
}

// Limpiar cache manualmente
export function clearPermissionsCache() {
  permissionsCache = {}
  supabaseAvailable = null
  lastSupabaseCheck = 0
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

  try {
    // Verificar permisos para el módulo
    return await canAccessModule(username, module)
  } catch (error) {
    console.log("⚠️ Error en canAccessRoute, permitiendo acceso:", error)
    return true // En caso de error, permitir acceso
  }
}

// Función para obtener el estado de Supabase
export function getSupabaseStatus(): { available: boolean | null; lastCheck: number } {
  return {
    available: supabaseAvailable,
    lastCheck: lastSupabaseCheck,
  }
}
