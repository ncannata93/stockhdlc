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
  CUSTOM = "CUSTOM", // Nuevo rol para permisos personalizados
}

export type ModuleName = "stock" | "empleados" | "servicios" | "admin"

// Configuración de permisos por rol (plantillas base)
const ROLE_PERMISSIONS: Record<UserRole, ModuleName[]> = {
  [UserRole.SUPER_ADMIN]: ["stock", "empleados", "servicios", "admin"],
  [UserRole.MANAGER]: ["stock", "empleados", "servicios"],
  [UserRole.EMPLOYEE]: ["stock", "empleados"],
  [UserRole.CUSTOM]: [], // Los permisos personalizados se definen individualmente
}

// Configuración específica de usuarios (fallback local)
const USER_SPECIFIC_ROLES: Record<string, UserRole> = {
  admin: UserRole.SUPER_ADMIN,
  ncannata: UserRole.SUPER_ADMIN,
  dpili: UserRole.MANAGER,
  jprey: UserRole.EMPLOYEE,
}

// Clave para almacenar roles y permisos personalizados en localStorage
const USER_ROLES_KEY = "user_custom_roles"
const USER_PERMISSIONS_KEY = "user_custom_permissions"

// Cache local para mejorar rendimiento
let rolesCache: Record<string, UserRole> = {}
let permissionsCache: Record<string, ModuleName[]> = {}
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
 * Obtiene los permisos personalizados del localStorage (fallback)
 */
function getCustomPermissions(): Record<string, ModuleName[]> {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(USER_PERMISSIONS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error("Error al obtener permisos personalizados:", error)
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
 * Guarda los permisos personalizados en localStorage (fallback)
 */
function saveCustomPermissions(permissions: Record<string, ModuleName[]>): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(permissions))
  } catch (error) {
    console.error("Error al guardar permisos personalizados:", error)
  }
}

/**
 * Verifica si la tabla user_roles existe
 */
export async function checkUserRolesTable(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { data, error } = await supabase.from("user_roles").select("username").limit(1)

    if (error && error.message.includes("does not exist")) {
      console.error("La tabla user_roles no existe:", error.message)
      return false
    }

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
 * Obtiene roles y permisos desde Supabase con cache
 */
async function getRolesAndPermissionsFromCloud(): Promise<{
  roles: Record<string, UserRole>
  permissions: Record<string, ModuleName[]>
}> {
  const now = Date.now()
  const supabase = getSupabaseClient()

  // Si no hay cliente Supabase o no estamos en modo nube, usar fallback
  if (!supabase || !cloudModeEnabled) {
    return {
      roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
      permissions: getCustomPermissions(),
    }
  }

  // Usar cache si es reciente
  if (now - cacheTimestamp < CACHE_DURATION && Object.keys(rolesCache).length > 0) {
    return { roles: rolesCache, permissions: permissionsCache }
  }

  try {
    const { data, error } = await supabase.from("user_roles").select("username, role, custom_permissions")

    if (error) {
      console.error("Error al obtener roles:", error)
      cloudModeError = error.message

      if (error.message.includes("does not exist")) {
        cloudModeEnabled = false
        console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")
      }

      return {
        roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
        permissions: getCustomPermissions(),
      }
    }

    // Actualizar cache
    rolesCache = {}
    permissionsCache = {}
    data?.forEach((row) => {
      rolesCache[row.username.toLowerCase()] = row.role as UserRole
      if (row.custom_permissions) {
        permissionsCache[row.username.toLowerCase()] = row.custom_permissions as ModuleName[]
      }
    })
    cacheTimestamp = now
    cloudModeError = null

    console.log("Roles y permisos cargados desde la nube:", { rolesCache, permissionsCache })
    return { roles: rolesCache, permissions: permissionsCache }
  } catch (error) {
    console.error("Error de conexión:", error)
    cloudModeError = "Error de conexión a la base de datos"

    return {
      roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
      permissions: getCustomPermissions(),
    }
  }
}

/**
 * Obtiene el rol de un usuario
 */
export async function getUserRole(username: string): Promise<UserRole> {
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  if (cloudModeEnabled) {
    const { roles } = await getRolesAndPermissionsFromCloud()
    return roles[username.toLowerCase()] || UserRole.EMPLOYEE
  }

  const customRoles = getCustomRoles()
  if (customRoles[username.toLowerCase()]) {
    return customRoles[username.toLowerCase()]
  }

  if (USER_SPECIFIC_ROLES[username.toLowerCase()]) {
    return USER_SPECIFIC_ROLES[username.toLowerCase()]
  }

  return UserRole.EMPLOYEE
}

/**
 * Obtiene los permisos específicos de un usuario
 */
export async function getUserPermissions(username: string): Promise<ModuleName[]> {
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  const { roles, permissions } = await getRolesAndPermissionsFromCloud()
  const userRole = roles[username.toLowerCase()] || UserRole.EMPLOYEE

  // Si tiene permisos personalizados, usarlos
  if (permissions[username.toLowerCase()]) {
    return permissions[username.toLowerCase()]
  }

  // Si no, usar los permisos del rol
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Actualiza el rol de un usuario
 */
export async function updateUserRole(
  username: string,
  newRole: UserRole,
  updatedBy = "admin",
): Promise<{ success: boolean; error?: string }> {
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

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
        custom_permissions: null, // Limpiar permisos personalizados al cambiar rol
      })

      if (error) {
        console.error("Error al actualizar rol:", error)

        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")

          const customRoles = getCustomRoles()
          customRoles[username.toLowerCase()] = newRole
          saveCustomRoles(customRoles)

          return { success: true, error: "Actualizado en modo local (fallback)" }
        }

        return { success: false, error: error.message }
      }

      // Limpiar cache para forzar recarga
      rolesCache = {}
      permissionsCache = {}
      cacheTimestamp = 0

      console.log(`Rol actualizado en la nube: ${username} -> ${newRole}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al actualizar rol:", error)

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
    const customRoles = getCustomRoles()
    customRoles[username.toLowerCase()] = newRole
    saveCustomRoles(customRoles)

    console.log(`Rol actualizado localmente: ${username} -> ${newRole}`)
    return { success: true }
  }
}

/**
 * Actualiza los permisos personalizados de un usuario
 */
export async function updateUserPermissions(
  username: string,
  permissions: ModuleName[],
  updatedBy = "admin",
): Promise<{ success: boolean; error?: string }> {
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente Supabase no disponible" }
    }

    try {
      const { error } = await supabase.from("user_roles").upsert({
        username: username.toLowerCase(),
        role: UserRole.CUSTOM,
        custom_permissions: permissions,
        updated_by: updatedBy,
      })

      if (error) {
        console.error("Error al actualizar permisos:", error)

        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")

          const customPermissions = getCustomPermissions()
          customPermissions[username.toLowerCase()] = permissions
          saveCustomPermissions(customPermissions)

          const customRoles = getCustomRoles()
          customRoles[username.toLowerCase()] = UserRole.CUSTOM
          saveCustomRoles(customRoles)

          return { success: true, error: "Actualizado en modo local (fallback)" }
        }

        return { success: false, error: error.message }
      }

      // Limpiar cache para forzar recarga
      rolesCache = {}
      permissionsCache = {}
      cacheTimestamp = 0

      console.log(`Permisos actualizados en la nube: ${username} -> ${permissions.join(", ")}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al actualizar permisos:", error)

      cloudModeEnabled = false
      const customPermissions = getCustomPermissions()
      customPermissions[username.toLowerCase()] = permissions
      saveCustomPermissions(customPermissions)

      const customRoles = getCustomRoles()
      customRoles[username.toLowerCase()] = UserRole.CUSTOM
      saveCustomRoles(customRoles)

      return {
        success: true,
        error: "Actualizado en modo local (fallback por error de conexión)",
      }
    }
  } else {
    const customPermissions = getCustomPermissions()
    customPermissions[username.toLowerCase()] = permissions
    saveCustomPermissions(customPermissions)

    const customRoles = getCustomRoles()
    customRoles[username.toLowerCase()] = UserRole.CUSTOM
    saveCustomRoles(customRoles)

    console.log(`Permisos actualizados localmente: ${username} -> ${permissions.join(", ")}`)
    return { success: true }
  }
}

/**
 * Verifica si un usuario puede acceder a un módulo específico
 */
export async function canAccessModule(username: string, module: ModuleName): Promise<boolean> {
  const userPermissions = await getUserPermissions(username)
  return userPermissions.includes(module)
}

/**
 * Verifica si un usuario es administrador
 */
export async function isUserAdmin(username: string): Promise<boolean> {
  return await canAccessModule(username, "admin")
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
  return await getUserPermissions(username)
}

/**
 * Obtiene todos los usuarios y sus roles
 */
export async function getAllUserRoles(): Promise<
  Array<{
    username: string
    role: UserRole
    permissions: ModuleName[]
    createdAt?: string
    updatedAt?: string
    updatedBy?: string
  }>
> {
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return getFallbackUserRoles()
    }

    try {
      const { data, error } = await supabase.from("user_roles").select("*").order("username")

      if (error) {
        console.error("Error al obtener usuarios:", error)

        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")
        }

        return getFallbackUserRoles()
      }

      return (
        data?.map((row) => ({
          username: row.username,
          role: row.role as UserRole,
          permissions: row.custom_permissions || ROLE_PERMISSIONS[row.role as UserRole] || [],
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
    return getFallbackUserRoles()
  }
}

/**
 * Obtiene usuarios y roles del fallback local
 */
function getFallbackUserRoles(): Array<{
  username: string
  role: UserRole
  permissions: ModuleName[]
}> {
  const customRoles = getCustomRoles()
  const customPermissions = getCustomPermissions()

  const allRoles = { ...USER_SPECIFIC_ROLES, ...customRoles }

  return Object.entries(allRoles).map(([username, role]) => ({
    username,
    role,
    permissions: customPermissions[username] || ROLE_PERMISSIONS[role] || [],
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
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

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

        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")

          const customRoles = getCustomRoles()
          customRoles[username.toLowerCase()] = role
          saveCustomRoles(customRoles)

          return { success: true, error: "Creado en modo local (fallback)" }
        }

        return { success: false, error: error.message }
      }

      rolesCache = {}
      permissionsCache = {}
      cacheTimestamp = 0

      console.log(`Usuario creado en la nube: ${username} con rol ${role}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al crear usuario:", error)

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
  permissionsCache = {}
  cacheTimestamp = 0
  cloudModeInitialized = false
  console.log("Cache de roles y permisos limpiado")
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
  console.log("Cache roles:", rolesCache)
  console.log("Cache permisos:", permissionsCache)
  console.log("Timestamp cache:", new Date(cacheTimestamp))

  const { roles, permissions } = await getRolesAndPermissionsFromCloud()
  console.log("Roles actuales:", roles)
  console.log("Permisos actuales:", permissions)
  console.log("Permisos por rol:", ROLE_PERMISSIONS)
}
