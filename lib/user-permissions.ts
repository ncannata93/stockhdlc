"use client"

import { getSupabaseClient } from "@/lib/supabase"

// Singleton para el cliente de Supabase - removido ya que usamos getSupabaseClient()

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

// Estado de disponibilidad de Supabase
let supabaseAvailable: boolean | null = null
let lastSupabaseCheck = 0
const SUPABASE_CHECK_INTERVAL = 60 * 1000 // 1 minuto

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
 * Verifica disponibilidad de Supabase con timeout
 */
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

/**
 * Verifica si la tabla user_roles existe y es accesible
 */
export async function checkUserRolesTable(): Promise<boolean> {
  try {
    return await checkSupabaseAvailability()
  } catch (error) {
    console.log("⚠️ Error al verificar tabla user_roles:", error)
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
    // Intentar consultar la columna custom_permissions con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const { error } = await supabase
      .from("user_roles")
      .select("custom_permissions")
      .limit(1)
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error && error.message.includes("custom_permissions does not exist")) {
      console.warn("⚠️ La columna custom_permissions no existe")
      customPermissionsSupported = false
      return false
    }

    customPermissionsSupported = true
    return true
  } catch (error) {
    console.log("⚠️ Error al verificar columna custom_permissions:", error)
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
    cloudModeError = tableExists ? null : "La tabla user_roles no existe o Supabase no está disponible"

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
    console.log("⚠️ Error al inicializar modo de permisos:", error)
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

  // Verificar si podemos usar la nube
  if (!cloudModeEnabled) {
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

  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
      permissions: getCustomPermissions(),
    }
  }

  try {
    console.log("Obteniendo datos desde Supabase...")

    // Consultar solo las columnas que sabemos que existen
    const selectColumns = customPermissionsSupported ? "username, role, custom_permissions" : "username, role"

    // Añadir timeout a la consulta
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos

    const { data, error } = await supabase.from("user_roles").select(selectColumns).abortSignal(controller.signal)

    clearTimeout(timeoutId)

    if (error) {
      console.log("⚠️ Error al obtener roles desde Supabase:", error.message)
      cloudModeError = error.message

      // Si es error de columna faltante, marcar como no soportada
      if (error.message.includes("custom_permissions does not exist")) {
        customPermissionsSupported = false
        console.warn("⚠️ Columna custom_permissions no existe. Usando solo roles.")

        // Reintentar sin la columna custom_permissions
        try {
          const { data: retryData, error: retryError } = await supabase
            .from("user_roles")
            .select("username, role")
            .abortSignal(controller.signal)

          if (retryError) {
            console.log("⚠️ Error en reintento:", retryError.message)
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
        } catch (retryError) {
          console.log("⚠️ Error en reintento:", retryError)
          return {
            roles: { ...USER_SPECIFIC_ROLES, ...getCustomRoles() },
            permissions: getCustomPermissions(),
          }
        }
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
    console.log("⚠️ Error de conexión:", error)
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

  try {
    const { roles } = await getRolesAndPermissionsFromCloud()
    const role = roles[username.toLowerCase()] || UserRole.EMPLOYEE
    console.log(`Rol de ${username}:`, role)
    return role
  } catch (error) {
    console.log(`⚠️ Error obteniendo rol de ${username}, usando fallback:`, error)
    return USER_SPECIFIC_ROLES[username.toLowerCase()] || UserRole.EMPLOYEE
  }
}

/**
 * Obtiene los permisos específicos de un usuario
 */
export async function getUserPermissions(username: string): Promise<ModuleName[]> {
  if (!cloudModeInitialized) {
    await initPermissionsMode()
  }

  try {
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
  } catch (error) {
    console.log(`⚠️ Error obteniendo permisos de ${username}, usando fallback:`, error)
    const fallbackRole = USER_SPECIFIC_ROLES[username.toLowerCase()] || UserRole.EMPLOYEE
    return ROLE_PERMISSIONS[fallbackRole] || []
  }
}

/**
 * Verifica si un usuario puede acceder a un módulo específico
 */
export async function canAccessModule(username: string, module: ModuleName): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(username)
    const hasAccess = userPermissions.includes(module)
    console.log(`${username} acceso a ${module}:`, hasAccess)
    return hasAccess
  } catch (error) {
    console.log(`⚠️ Error verificando acceso de ${username} a ${module}, permitiendo acceso básico:`, error)
    // En caso de error, permitir acceso básico
    return module === "stock" || module === "empleados"
  }
}

/**
 * Verifica si un usuario es administrador
 */
export async function isUserAdmin(username: string): Promise<boolean> {
  try {
    return await canAccessModule(username, "admin")
  } catch (error) {
    console.log(`⚠️ Error verificando admin para ${username}:`, error)
    // Fallback para usuarios conocidos
    return username.toLowerCase() === "admin" || username.toLowerCase() === "ncannata"
  }
}

/**
 * Verifica si un usuario puede acceder a servicios
 */
export async function canAccessServices(username: string): Promise<boolean> {
  try {
    return await canAccessModule(username, "servicios")
  } catch (error) {
    console.log(`⚠️ Error verificando servicios para ${username}:`, error)
    // Fallback para usuarios conocidos
    const knownManagers = ["admin", "ncannata", "dpili"]
    return knownManagers.includes(username.toLowerCase())
  }
}

// Resto de las funciones mantienen la misma estructura pero con manejo de errores mejorado...

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

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { error } = await supabase
        .from("user_roles")
        .upsert(updateData, {
          onConflict: "username",
        })
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.log("⚠️ Error al actualizar rol en Supabase:", error.message)

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
      console.log("⚠️ Error de conexión al actualizar rol:", error)

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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { error } = await supabase
        .from("user_roles")
        .upsert(
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
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.log("⚠️ Error al actualizar permisos en Supabase:", error.message)

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
      console.log("⚠️ Error de conexión al actualizar permisos:", error)

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
 * Obtiene todos los módulos a los que un usuario puede acceder
 */
export async function getUserModules(username: string): Promise<ModuleName[]> {
  try {
    return await getUserPermissions(username)
  } catch (error) {
    console.log(`⚠️ Error obteniendo módulos de ${username}:`, error)
    const fallbackRole = USER_SPECIFIC_ROLES[username.toLowerCase()] || UserRole.EMPLOYEE
    return ROLE_PERMISSIONS[fallbackRole] || []
  }
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

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { data, error } = await supabase
        .from("user_roles")
        .select(selectColumns)
        .order("username")
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.log("⚠️ Error al obtener usuarios:", error.message)

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
      console.log("⚠️ Error de conexión:", error)
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const { error } = await supabase
        .from("user_roles")
        .insert({
          username: username.toLowerCase(),
          role: role,
          updated_by: createdBy,
        })
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (error) {
        console.log("⚠️ Error al crear usuario en Supabase:", error.message)

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
      console.log("⚠️ Error de conexión al crear usuario:", error)

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
  supabaseAvailable = null
  lastSupabaseCheck = 0
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

  try {
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
  } catch (error) {
    console.log("⚠️ Error en debugRoles:", error)
  }
}
