"use client"

import React from "react"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

export type ModuleName = "stock" | "empleados" | "servicios" | "admin"

// Configuración de permisos por rol (igual que antes)
const ROLE_PERMISSIONS: Record<UserRole, ModuleName[]> = {
  [UserRole.SUPER_ADMIN]: ["stock", "empleados", "servicios", "admin"],
  [UserRole.MANAGER]: ["stock", "empleados", "servicios"],
  [UserRole.EMPLOYEE]: ["stock", "empleados"],
}

// Cache local para mejorar rendimiento
let rolesCache: Record<string, UserRole> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Obtiene roles desde Supabase con cache
 */
async function getRolesFromCloud(): Promise<Record<string, UserRole>> {
  const now = Date.now()

  // Usar cache si es reciente
  if (now - cacheTimestamp < CACHE_DURATION && Object.keys(rolesCache).length > 0) {
    return rolesCache
  }

  try {
    const { data, error } = await supabase.from("user_roles").select("username, role")

    if (error) {
      console.error("Error al obtener roles:", error)
      return rolesCache // Devolver cache en caso de error
    }

    // Actualizar cache
    rolesCache = {}
    data?.forEach((row) => {
      rolesCache[row.username.toLowerCase()] = row.role as UserRole
    })
    cacheTimestamp = now

    return rolesCache
  } catch (error) {
    console.error("Error de conexión:", error)
    return rolesCache
  }
}

/**
 * Obtiene el rol de un usuario desde la nube
 */
export async function getUserRole(username: string): Promise<UserRole> {
  const roles = await getRolesFromCloud()
  return roles[username.toLowerCase()] || UserRole.EMPLOYEE
}

/**
 * Actualiza el rol de un usuario en la nube
 */
export async function updateUserRole(
  username: string,
  newRole: UserRole,
  updatedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("user_roles").upsert({
      username: username.toLowerCase(),
      role: newRole,
      updated_by: updatedBy,
    })

    if (error) {
      console.error("Error al actualizar rol:", error)
      return { success: false, error: error.message }
    }

    // Limpiar cache para forzar recarga
    rolesCache = {}
    cacheTimestamp = 0

    console.log(`Rol actualizado en la nube: ${username} -> ${newRole}`)
    return { success: true }
  } catch (error) {
    console.error("Error de conexión al actualizar rol:", error)
    return { success: false, error: "Error de conexión" }
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
 * Obtiene todos los usuarios y sus roles desde la nube
 */
export async function getAllUserRoles(): Promise<
  Array<{
    username: string
    role: UserRole
    createdAt: string
    updatedAt: string
    updatedBy: string
  }>
> {
  try {
    const { data, error } = await supabase.from("user_roles").select("*").order("username")

    if (error) {
      console.error("Error al obtener usuarios:", error)
      return []
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
    return []
  }
}

/**
 * Crea un nuevo usuario con rol específico
 */
export async function createUserRole(
  username: string,
  role: UserRole,
  createdBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("user_roles").insert({
      username: username.toLowerCase(),
      role: role,
      updated_by: createdBy,
    })

    if (error) {
      console.error("Error al crear usuario:", error)
      return { success: false, error: error.message }
    }

    // Limpiar cache
    rolesCache = {}
    cacheTimestamp = 0

    return { success: true }
  } catch (error) {
    console.error("Error de conexión al crear usuario:", error)
    return { success: false, error: "Error de conexión" }
  }
}

/**
 * Hook para usar permisos en componentes React (versión async)
 */
export function useCloudPermissions(username: string) {
  const [permissions, setPermissions] = React.useState({
    role: UserRole.EMPLOYEE,
    modules: [] as ModuleName[],
    isLoading: true,
  })

  React.useEffect(() => {
    async function loadPermissions() {
      const role = await getUserRole(username)
      const modules = ROLE_PERMISSIONS[role] || []

      setPermissions({
        role,
        modules,
        isLoading: false,
      })
    }

    loadPermissions()
  }, [username])

  return {
    ...permissions,
    canAccess: (module: ModuleName) => permissions.modules.includes(module),
    isAdmin: permissions.role === UserRole.SUPER_ADMIN,
    canAccessServices: permissions.modules.includes("servicios"),
  }
}
