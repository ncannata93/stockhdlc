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
  CUSTOM = "CUSTOM",
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

// Claves para localStorage
const USER_ROLES_KEY = "user_custom_roles"
const USER_PERMISSIONS_KEY = "user_custom_permissions"

// Cache local
let rolesCache: Record<string, UserRole> = {}
let permissionsCache: Record<string, ModuleName[]> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 30 * 1000 // 30 segundos para testing

// Estado del sistema
let cloudModeEnabled = true
let cloudModeInitialized = false
let cloudModeError: string | null = null
let customPermissionsSupported = true

/**
 * Funciones de localStorage (fallback)
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

function saveCustomRoles(roles: Record<string, UserRole>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(roles))
  } catch (error) {
    console.error("Error al guardar roles personalizados:", error)
  }
}

function saveCustomPermissions(permissions: Record<string, ModuleName[]>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(permissions))
  } catch (error) {
    console.error("Error al guardar permisos personalizados:", error)
  }
}

/**
 * Verifica si la tabla user_roles existe y es accesible
 */
export async function checkUserRolesTable(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("No hay cliente Supabase disponible")
    return false
  }

  try {
    console.log("Verificando tabla user_roles...")
    const { data, error } = await supabase.from("user_roles").select("username").limit(1)

    if (error) {
      console.error("Error al verificar tabla:", error)
      if (error.message.includes("does not exist")) {
        console.error("❌ La tabla user_roles no existe")
        return false
      }
      return false
    }

    console.log("✅ Tabla user_roles verificada correctamente")
    return true
  } catch (error) {
    console.error("Error de conexión al verificar tabla:", error)
    return false
  }
}

/**
 * Verifica si la columna custom_permissions existe
 */
async function checkCustomPermissionsColumn(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Intentar consultar la columna custom_permissions
    const { error } = await supabase.from("user_roles").select("custom_permissions").limit(1)

    if (error && error.message.includes("custom_permissions does not exist")) {
      console.warn("⚠️ La columna custom_permissions no existe")
      customPermissionsSupported = false
      return false
    }

    customPermissionsSupported = true
    return true
  } catch (error) {
    console.error("Error al verificar columna custom_permissions:", error)
    customPermissionsSupported = false
    return false
  }
}

/**
 * Inicializa el modo de permisos
 */
export async function initPermissionsMode(): Promise<boolean> {
  if (cloudModeInitialized) return cloudModeEnabled

  console.log("Inicializando sistema de permisos...")

  try {
    const tableExists = await checkUserRolesTable()
    if (tableExists) {
      await checkCustomPermissionsColumn()
    }

    cloudModeEnabled = tableExists
    cloudModeError = tableExists ? null : "La tabla user_roles no existe en la base de datos"

    console.log(`✅ Sistema inicializado en modo ${tableExists ? "NUBE" : "LOCAL"}`)
    if (tableExists && !customPermissionsSupported) {
      console.warn("⚠️ Permisos personalizados no disponibles (columna custom_permissions faltante)")
    }

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
 * Obtiene roles y permisos desde Supabase
 */
async function getRolesAndPermissionsFromCloud(): Promise<{
  roles: Record<string, UserRole>
  permissions: Record<string, ModuleName[]>
}> {
  const now = Date.now()
  const supabase = getSupabaseClient()

  // Verificar si podemos usar la nube
  if (!supabase || !cloudModeEnabled) {
    console.log("Usando fallback local")
    return {
      roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
      permissions: getCustomPermissions(),
    }
  }

  // Usar cache si es reciente
  if (now - cacheTimestamp < CACHE_DURATION && Object.keys(rolesCache).length > 0) {
    console.log("Usando cache local")
    return { roles: rolesCache, permissions: permissionsCache }
  }

  try {
    console.log("Obteniendo datos desde Supabase...")

    // Consultar solo las columnas que sabemos que existen
    const selectColumns = customPermissionsSupported ? "username, role, custom_permissions" : "username, role"

    const { data, error } = await supabase.from("user_roles").select(selectColumns)

    if (error) {
      console.error("Error al obtener roles desde Supabase:", error)
      cloudModeError = error.message

      // Si es error de columna faltante, marcar como no soportada
      if (error.message.includes("custom_permissions does not exist")) {
        customPermissionsSupported = false
        console.warn("⚠️ Columna custom_permissions no existe. Usando solo roles.")

        // Reintentar sin la columna custom_permissions
        const { data: retryData, error: retryError } = await supabase.from("user_roles").select("username, role")

        if (retryError) {
          console.error("Error en reintento:", retryError)
          return {
            roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
            permissions: getCustomPermissions(),
          }
        }

        // Procesar datos sin custom_permissions
        rolesCache = {}
        permissionsCache = {}

        retryData?.forEach((row) => {
          const username = row.username.toLowerCase()
          rolesCache[username] = row.role as UserRole
        })

        cacheTimestamp = now
        cloudModeError = null

        console.log("✅ Datos cargados desde Supabase (sin permisos personalizados):", {
          usuarios: Object.keys(rolesCache).length,
        })

        return { roles: rolesCache, permissions: permissionsCache }
      }

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
      const username = row.username.toLowerCase()
      rolesCache[username] = row.role as UserRole

      // Procesar permisos personalizados solo si la columna existe
      if (customPermissionsSupported && row.custom_permissions && Array.isArray(row.custom_permissions)) {
        permissionsCache[username] = row.custom_permissions as ModuleName[]
      }
    })

    cacheTimestamp = now
    cloudModeError = null

    console.log("✅ Datos cargados desde Supabase:", {
      usuarios: Object.keys(rolesCache).length,
      permisosPersonalizados: Object.keys(permissionsCache).length,
      soportePermisos: customPermissionsSupported,
    })

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

  const { roles } = await getRolesAndPermissionsFromCloud()
  const role = roles[username.toLowerCase()] || UserRole.EMPLOYEE
  console.log(`Rol de ${username}:`, role)
  return role
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
    const customPerms = permissions[username.toLowerCase()]
    console.log(`Permisos personalizados de ${username}:`, customPerms)
    return customPerms
  }

  // Si no, usar los permisos del rol
  const rolePerms = ROLE_PERMISSIONS[userRole] || []
  console.log(`Permisos por rol de ${username} (${userRole}):`, rolePerms)
  return rolePerms
}

/**
 * Actualiza el rol de un usuario
 */
export async function updateUserRole(
  username: string,
  newRole: UserRole,
  updatedBy = "admin",
): Promise<{ success: boolean; error?: string }> {
  console.log(`Actualizando rol de ${username} a ${newRole}`)

  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente Supabase no disponible" }
    }

    try {
      const updateData: any = {
        username: username.toLowerCase(),
        role: newRole,
        updated_by: updatedBy,
      }

      // Solo incluir custom_permissions si la columna existe
      if (customPermissionsSupported) {
        updateData.custom_permissions = null // Limpiar permisos personalizados al cambiar rol
      }

      const { error } = await supabase.from("user_roles").upsert(updateData, {
        onConflict: "username",
      })

      if (error) {
        console.error("Error al actualizar rol en Supabase:", error)

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

      console.log(`✅ Rol actualizado en Supabase: ${username} -> ${newRole}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al actualizar rol:", error)

      // Fallback a modo local
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

    console.log(`✅ Rol actualizado localmente: ${username} -> ${newRole}`)
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
  console.log(`Actualizando permisos de ${username}:`, permissions)

  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  // Si no se soportan permisos personalizados, usar modo local
  if (!customPermissionsSupported) {
    console.warn("⚠️ Permisos personalizados no soportados. Usando modo local.")

    const customPermissions = getCustomPermissions()
    customPermissions[username.toLowerCase()] = permissions
    saveCustomPermissions(customPermissions)

    const customRoles = getCustomRoles()
    customRoles[username.toLowerCase()] = UserRole.CUSTOM
    saveCustomRoles(customRoles)

    return { success: true, error: "Guardado en modo local (permisos personalizados no soportados en la nube)" }
  }

  if (cloudModeEnabled) {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { success: false, error: "Cliente Supabase no disponible" }
    }

    try {
      const { error } = await supabase.from("user_roles").upsert(
        {
          username: username.toLowerCase(),
          role: UserRole.CUSTOM,
          custom_permissions: permissions,
          updated_by: updatedBy,
        },
        {
          onConflict: "username",
        },
      )

      if (error) {
        console.error("Error al actualizar permisos en Supabase:", error)

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

      console.log(`✅ Permisos actualizados en Supabase: ${username} -> [${permissions.join(", ")}]`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al actualizar permisos:", error)

      // Fallback a modo local
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
    // Modo local
    const customPermissions = getCustomPermissions()
    customPermissions[username.toLowerCase()] = permissions
    saveCustomPermissions(customPermissions)

    const customRoles = getCustomRoles()
    customRoles[username.toLowerCase()] = UserRole.CUSTOM
    saveCustomRoles(customRoles)

    console.log(`✅ Permisos actualizados localmente: ${username} -> [${permissions.join(", ")}]`)
    return { success: true }
  }
}

/**
 * Verifica si un usuario puede acceder a un módulo específico
 */
export async function canAccessModule(username: string, module: ModuleName): Promise<boolean> {
  const userPermissions = await getUserPermissions(username)
  const hasAccess = userPermissions.includes(module)
  console.log(`${username} acceso a ${module}:`, hasAccess)
  return hasAccess
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
      const selectColumns = customPermissionsSupported ? "*" : "id, username, role, updated_by, created_at, updated_at"

      const { data, error } = await supabase.from("user_roles").select(selectColumns).order("username")

      if (error) {
        console.error("Error al obtener usuarios:", error)

        if (error.message.includes("does not exist")) {
          cloudModeEnabled = false
          console.warn("⚠️ Tabla no encontrada. Cambiando a modo LOCAL")
        }

        return getFallbackUserRoles()
      }

      return (
        data?.map((row) => {
          const permissions =
            customPermissionsSupported && row.custom_permissions
              ? (row.custom_permissions as ModuleName[])
              : ROLE_PERMISSIONS[row.role as UserRole] || []

          return {
            username: row.username,
            role: row.role as UserRole,
            permissions,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
          }
        }) || []
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
  console.log(`Creando usuario ${username} con rol ${role}`)

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
        console.error("Error al crear usuario en Supabase:", error)

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

      // Limpiar cache
      rolesCache = {}
      permissionsCache = {}
      cacheTimestamp = 0

      console.log(`✅ Usuario creado en Supabase: ${username} con rol ${role}`)
      return { success: true }
    } catch (error) {
      console.error("Error de conexión al crear usuario:", error)

      // Fallback a modo local
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

    console.log(`✅ Usuario creado localmente: ${username} con rol ${role}`)
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
  customPermissionsSupported = true // Resetear para verificar nuevamente
  console.log("🔄 Cache de roles y permisos limpiado")
}

/**
 * Obtiene el estado actual del sistema de permisos
 */
export function getPermissionsSystemStatus(): {
  mode: "cloud" | "local"
  initialized: boolean
  error: string | null
  customPermissionsSupported: boolean
} {
  return {
    mode: cloudModeEnabled ? "cloud" : "local",
    initialized: cloudModeInitialized,
    error: cloudModeError,
    customPermissionsSupported,
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
  console.log("Soporte permisos personalizados:", customPermissionsSupported)
  console.log("Cache roles:", rolesCache)
  console.log("Cache permisos:", permissionsCache)
  console.log("Timestamp cache:", new Date(cacheTimestamp))

  const { roles, permissions } = await getRolesAndPermissionsFromCloud()
  console.log("Roles actuales:", roles)
  console.log("Permisos actuales:", permissions)
  console.log("Permisos por rol:", ROLE_PERMISSIONS)

  // Verificar tabla
  const tableExists = await checkUserRolesTable()
  console.log("Tabla existe:", tableExists)

  if (tableExists) {
    const customPermsSupported = await checkCustomPermissionsColumn()
    console.log("Columna custom_permissions existe:", customPermsSupported)
  }
}
