"use client"

import { createClient } from "@supabase/supabase-js"

// Singleton para el cliente de Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient && typeof window !== "undefined") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
    }
  }
  return supabaseClient
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

export type ModuleName = "stock" | "empleados" | "servicios" | "admin"

// Configuración de permisos por rol
const ROLE_PERMISSIONS: Record<UserRole, ModuleName[]> = {
  [UserRole.SUPER_ADMIN]: ["stock", "empleados", "servicios", "admin"],
  [UserRole.MANAGER]: ["stock", "empleados", "servicios"],
  [UserRole.EMPLOYEE]: ["stock", "empleados"],
}

// Configuración específica de usuarios (fallback local)
const USER_SPECIFIC_ROLES: Record<string, UserRole> = {
  admin: UserRole.SUPER_ADMIN,
  ncannata: UserRole.SUPER_ADMIN,
  dpili: UserRole.MANAGER,
  jprey: UserRole.EMPLOYEE,
}

// Clave para almacenar roles personalizados en localStorage
const USER_ROLES_KEY = "user_custom_roles"

// Cache local para mejorar rendimiento
let rolesCache: Record<string, UserRole> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

// Estado del sistema de permisos
let cloudModeEnabled = true
let cloudModeInitialized = false
let cloudModeError: string | null = null

/**
 * Obtiene los roles personalizados del localStorage (fallback)
 */
function getCustomRoles(): Record<string, UserRole> {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(USER_ROLES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error al obtener roles personalizados:", error)
    return {}
  }
}

/**
 * Guarda los roles personalizados en localStorage (fallback)
 */
function saveCustomRoles(roles: Record<string, UserRole>): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(roles))
  } catch (error) {
    console.error("Error al guardar roles personalizados:", error)
  }
}

/**
 * Verifica si la tabla user_roles existe
 */
export async function checkUserRolesTable(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Intentar hacer una consulta simple
    const { data, error } = await supabase.from("user_roles").select("username").limit(1)

    // Si hay un error específico sobre la tabla no existente
    if (error && error.message.includes("does not exist")) {
      console.error("La tabla user_roles no existe:", error.message)
      return false
    }

    // Si hay datos o no hay error específico sobre la tabla
    return !error
  } catch (error) {
    console.error("Error al verificar tabla user_roles:", error)
    return false
  }
}

/**
 * Inicializa el modo de permisos (nube o local)
 */
export async function initPermissionsMode(): Promise<boolean> {
  if (cloudModeInitialized) return cloudModeEnabled

  try {
    const tableExists = await checkUserRolesTable()
    cloudModeEnabled = tableExists
    cloudModeError = tableExists ? null : "La tabla user_roles no existe en la base de datos"

    console.log(`Sistema de permisos inicializado en modo ${tableExists ? "NUBE" : "LOCAL"}`)

    if (!tableExists) {
      console.warn("⚠️ Usando sistema de permisos LOCAL como fallback")
    }

    cloudModeInitialized = true
    return tableExists
  } catch (error) {
    console.error("Error al inicializar modo de permisos:", error)
    cloudModeEnabled = false
    cloudModeError = "Error de conexión a la base de datos"
    cloudModeInitialized = true
    return false
  }
}

/**
 * Obtiene roles desde Supabase con cache
 */
async function getRolesFromCloud(): Promise<Record<string, UserRole>> {
  const now = Date.now()
  const supabase = getSupabaseClient()

  // Si no hay cliente Supabase o no estamos en modo nube, usar fallback
  if (!supabase || !cloudModeEnabled) {
    return { ...USER_SPECIFIC_ROLES, ...getCustomRoles() }
  }

  // Usar cache si es reciente
  if (now - cacheTimestamp < CACHE_DURATION && Object.keys(rolesCache).length > 0) {
    return rolesCache
  }

  try {
    const { data, error } = await supabase.from("user_roles").select("username, role")

    if (error) {
      console.error("Error al obtener roles:", error)
      cloudModeError = error.message

      // Si hay error, desactivar modo nube y usar fallback
      if (error.message.includes("does not exist")) {
        cloudModeEnabled = false
        console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")
      }

      // Devolver fallback en caso de error
      return { ...USER_SPECIFIC_ROLES, ...getCustomRoles() }
    }

    // Actualizar cache
    rolesCache = {}
    data?.forEach((row) => {
      rolesCache[row.username.toLowerCase()] = row.role as UserRole
    })
    cacheTimestamp = now
    cloudModeError = null

    console.log("Roles cargados desde la nube:", rolesCache)
    return rolesCache
  } catch (error) {
    console.error("Error de conexión:", error)
    cloudModeError = "Error de conexión a la base de datos"

    // En caso de error de conexión, usar fallback
    return { ...USER_SPECIFIC_ROLES, ...getCustomRoles() }
  }
}

/**
 * Obtiene el rol de un usuario
 */
export async function getUserRole(username: string): Promise<UserRole> {
  // Asegurar que el modo esté inicializado
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  // Si estamos en modo nube, intentar obtener de la nube
  if (cloudModeEnabled) {
    const roles = await getRolesFromCloud()
    const role = roles[username.toLowerCase()] || UserRole.EMPLOYEE
    return role
  }

  // Modo local (fallback)
  const customRoles = getCustomRoles()

  // Primero verificar roles personalizados
  if (customRoles[username.toLowerCase()]) {
    return customRoles[username.toLowerCase()]
  }

  // Luego verificar configuración específica
  if (USER_SPECIFIC_ROLES[username.toLowerCase()]) {
    return USER_SPECIFIC_ROLES[username.toLowerCase()]
  }

  // Por defecto, empleado
  return UserRole.EMPLOYEE
}

/**
 * Actualiza el rol de un usuario
 */
export async function updateUserRole(
  username: string,
  newRole: UserRole,
  updatedBy = "admin",
): Promise<{ success: boolean; error?: string }> {
  // Asegurar que el modo esté inicializado
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  // Si estamos en modo nube, actualizar en la nube
  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente Supabase no disponible" }
    }

    try {
      const { error } = await supabase.from("user_roles").upsert({
        username: username.toLowerCase(),
        role: newRole,
        updated_by: updatedBy,
      })

      if (error) {
        console.error("Error al actualizar rol:", error)

        // Si hay error de tabla no existente, cambiar a modo local
        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")

          // Actualizar en modo local
          const customRoles = getCustomRoles()
          customRoles[username.toLowerCase()] = newRole
          saveCustomRoles(customRoles)

          return { success: true, error: "Actualizado en modo local (fallback)" }
        }

        return { success: false, error: error.message }
      }

      // Limpiar cache para forzar recarga
      rolesCache = {}
      cacheTimestamp = 0

      console.log(`Rol actualizado en la nube: ${username} -> ${newRole}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al actualizar rol:", error)

      // Intentar actualizar en modo local como fallback
      cloudModeEnabled = false
      const customRoles = getCustomRoles()
      customRoles[username.toLowerCase()] = newRole
      saveCustomRoles(customRoles)

      return {
        success: true,
        error: "Actualizado en modo local (fallback por error de conexión)",
      }
    }
  } else {
    // Modo local
    const customRoles = getCustomRoles()
    customRoles[username.toLowerCase()] = newRole
    saveCustomRoles(customRoles)

    console.log(`Rol actualizado localmente: ${username} -> ${newRole}`)
    return { success: true }
  }
}

/**
 * Verifica si un usuario puede acceder a un módulo específico
 */
export async function canAccessModule(username: string, module: ModuleName): Promise<boolean> {
  const userRole = await getUserRole(username)
  const allowedModules = ROLE_PERMISSIONS[userRole] || []
  return allowedModules.includes(module)
}

/**
 * Verifica si un usuario es administrador
 */
export async function isUserAdmin(username: string): Promise<boolean> {
  const role = await getUserRole(username)
  return role === UserRole.SUPER_ADMIN
}

/**
 * Verifica si un usuario puede acceder a servicios
 */
export async function canAccessServices(username: string): Promise<boolean> {
  return await canAccessModule(username, "servicios")
}

/**
 * Obtiene todos los módulos a los que un usuario puede acceder
 */
export async function getUserModules(username: string): Promise<ModuleName[]> {
  const userRole = await getUserRole(username)
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Obtiene todos los usuarios y sus roles
 */
export async function getAllUserRoles(): Promise<
  Array<{
    username: string
    role: UserRole
    createdAt?: string
    updatedAt?: string
    updatedBy?: string
  }>
> {
  // Asegurar que el modo esté inicializado
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  // Si estamos en modo nube, obtener de la nube
  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return Object.entries(USER_SPECIFIC_ROLES).map(([username, role]) => ({
        username,
        role,
      }))
    }

    try {
      const { data, error } = await supabase.from("user_roles").select("*").order("username")

      if (error) {
        console.error("Error al obtener usuarios:", error)

        // Si hay error de tabla no existente, cambiar a modo local
        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")
        }

        // Usar fallback
        return getFallbackUserRoles()
      }

      return (
        data?.map((row) => ({
          username: row.username,
          role: row.role as UserRole,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          updatedBy: row.updated_by,
        })) || []
      )
    } catch (error) {
      console.error("Error de conexión:", error)
      return getFallbackUserRoles()
    }
  } else {
    // Modo local
    return getFallbackUserRoles()
  }
}

/**
 * Obtiene usuarios y roles del fallback local
 */
function getFallbackUserRoles(): Array<{ username: string; role: UserRole }> {
  const customRoles = getCustomRoles()

  // Combinar roles predefinidos con personalizados
  const allRoles = { ...USER_SPECIFIC_ROLES, ...customRoles }

  return Object.entries(allRoles).map(([username, role]) => ({
    username,
    role,
  }))
}

/**
 * Crea un nuevo usuario con rol específico
 */
export async function createUserRole(
  username: string,
  role: UserRole,
  createdBy = "admin",
): Promise<{ success: boolean; error?: string }> {
  // Asegurar que el modo esté inicializado
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  // Si estamos en modo nube, crear en la nube
  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente Supabase no disponible" }
    }

    try {
      const { error } = await supabase.from("user_roles").insert({
        username: username.toLowerCase(),
        role: role,
        updated_by: createdBy,
      })

      if (error) {
        console.error("Error al crear usuario:", error)

        // Si hay error de tabla no existente, cambiar a modo local
        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")

          // Crear en modo local
          const customRoles = getCustomRoles()
          customRoles[username.toLowerCase()] = role
          saveCustomRoles(customRoles)

          return { success: true, error: "Creado en modo local (fallback)" }
        }

        return { success: false, error: error.message }
      }

      // Limpiar cache
      rolesCache = {}
      cacheTimestamp = 0

      console.log(`Usuario creado en la nube: ${username} con rol ${role}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al crear usuario:", error)

      // Intentar crear en modo local como fallback
      cloudModeEnabled = false
      const customRoles = getCustomRoles()
      customRoles[username.toLowerCase()] = role
      saveCustomRoles(customRoles)

      return {
        success: true,
        error: "Creado en modo local (fallback por error de conexión)",
      }
    }
  } else {
    // Modo local
    const customRoles = getCustomRoles()
    customRoles[username.toLowerCase()] = role
    saveCustomRoles(customRoles)

    console.log(`Usuario creado localmente: ${username} con rol ${role}`)
    return { success: true }
  }
}

/**
 * Elimina cache y fuerza recarga
 */
export function refreshRolesCache(): void {
  rolesCache = {}
  cacheTimestamp = 0
  cloudModeInitialized = false
  console.log("Cache de roles limpiado")
}

/**
 * Obtiene el estado actual del sistema de permisos
 */
export function getPermissionsSystemStatus(): {
  mode: "cloud" | "local"
  initialized: boolean
  error: string | null
} {
  return {
    mode: cloudModeEnabled ? "cloud" : "local",
    initialized: cloudModeInitialized,
    error: cloudModeError,
  }
}

/**
 * Función para debugging - muestra estado actual
 */
export async function debugRoles(): Promise<void> {
  console.log("=== DEBUG ROLES ===")
  console.log("Modo:", cloudModeEnabled ? "NUBE" : "LOCAL")
  console.log("Inicializado:", cloudModeInitialized)
  console.log("Error:", cloudModeError)
  console.log("Cache actual:", rolesCache)
  console.log("Timestamp cache:", new Date(cacheTimestamp))

  const roles = await getRolesFromCloud()
  console.log("Roles actuales:", roles)
  console.log("Permisos por rol:", ROLE_PERMISSIONS)
}
