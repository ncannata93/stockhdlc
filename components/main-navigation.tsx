"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessModule, clearPermissionsCache } from "@/lib/strict-permissions"
import { Home, Package, Users, Wrench, Settings, LogOut, RefreshCw, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  module?: "stock" | "employees" | "services" | "admin"
}

const navigation: NavigationItem[] = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Stock", href: "/stock", icon: Package, module: "stock" },
  { name: "Empleados", href: "/empleados", icon: Users, module: "employees" },
  { name: "Servicios", href: "/servicios", icon: Wrench, module: "services" },
  { name: "Admin", href: "/admin", icon: Settings, module: "admin" },
]

export function MainNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { session, logout } = useAuth()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar permisos para todos los módulos
  useEffect(() => {
    if (!session?.username) {
      setIsLoading(false)
      return
    }

    const checkAllPermissions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("🔍 Verificando permisos de navegación para:", session.username)

        const permissionChecks = await Promise.all([
          canAccessModule(session.username, "stock"),
          canAccessModule(session.username, "employees"),
          canAccessModule(session.username, "services"),
          canAccessModule(session.username, "admin"),
        ])

        const newPermissions = {
          stock: permissionChecks[0],
          employees: permissionChecks[1],
          services: permissionChecks[2],
          admin: permissionChecks[3],
        }

        console.log("✅ Permisos de navegación:", newPermissions)
        setPermissions(newPermissions)
      } catch (err) {
        console.error("❌ Error verificando permisos de navegación:", err)
        setError("Error al verificar permisos")

        // Fallback: permisos básicos para usuarios conocidos
        const fallbackPermissions = {
          stock: true,
          employees: true,
          services: ["admin", "ncannata", "dpili"].includes(session.username.toLowerCase()),
          admin: ["admin", "ncannata"].includes(session.username.toLowerCase()),
        }

        console.log("🔄 Usando permisos fallback:", fallbackPermissions)
        setPermissions(fallbackPermissions)
      } finally {
        setIsLoading(false)
      }
    }

    checkAllPermissions()
  }, [session?.username])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const refreshPermissions = () => {
    clearPermissionsCache()
    window.location.reload()
  }

  const handleNavClick = (item: NavigationItem, e: React.MouseEvent) => {
    // Si no tiene permisos para el módulo, prevenir navegación
    if (item.module && !permissions[item.module]) {
      e.preventDefault()
      console.warn(`⛔ Navegación bloqueada a ${item.name}`)
      return false
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Hotel Management</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                const hasPermission = !item.module || permissions[item.module]
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`
                      inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "border-blue-500 text-gray-900"
                          : hasPermission
                            ? "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            : "border-transparent text-gray-300 cursor-not-allowed"
                      }
                      ${!hasPermission ? "opacity-50" : ""}
                    `}
                    aria-disabled={!hasPermission}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {!hasPermission && item.module && <AlertTriangle className="h-3 w-3 ml-1 text-red-500" />}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Indicador de estado de permisos */}
            {isLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                Verificando...
              </div>
            )}

            {error && (
              <div className="flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Error permisos
              </div>
            )}

            {/* Botón de actualización para admin */}
            {(session?.username === "admin" || session?.username === "ncannata") && (
              <Button variant="outline" size="sm" onClick={refreshPermissions} className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Actualizar
              </Button>
            )}

            {/* Usuario actual */}
            <div className="flex items-center text-sm text-gray-700">
              <Shield className="h-4 w-4 mr-1" />
              {session?.username || "Usuario"}
            </div>

            {/* Botón de logout */}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Salir
            </Button>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              const hasPermission = !item.module || permissions[item.module]
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`
                    flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : hasPermission
                          ? "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                          : "border-transparent text-gray-300 cursor-not-allowed bg-gray-50"
                    }
                    ${!hasPermission ? "opacity-50" : ""}
                  `}
                  aria-disabled={!hasPermission}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                  {!hasPermission && item.module && <AlertTriangle className="h-4 w-4 ml-auto text-red-500" />}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Debug info para admin */}
      {(session?.username === "admin" || session?.username === "ncannata") && !isLoading && (
        <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-600">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>Usuario: {session?.username}</span>
              <span>Stock: {permissions.stock ? "✅" : "❌"}</span>
              <span>Empleados: {permissions.employees ? "✅" : "❌"}</span>
              <span>Servicios: {permissions.services ? "✅" : "❌"}</span>
              <span>Admin: {permissions.admin ? "✅" : "❌"}</span>
            </div>
            {error && <span className="text-red-600">Error: {error}</span>}
          </div>
        </div>
      )}
    </nav>
  )
}
