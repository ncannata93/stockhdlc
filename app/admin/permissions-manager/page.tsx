"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  UserRole,
  getAllUserRoles,
  updateUserRole,
  getPermissionsSystemStatus,
  refreshRolesCache,
  initPermissionsMode,
} from "@/lib/user-permissions"
import { AlertTriangle, Check, Cloud, RefreshCw, Server } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function PermissionsManager() {
  const [users, setUsers] = useState<
    Array<{
      username: string
      role: UserRole
      createdAt?: string
      updatedAt?: string
      updatedBy?: string
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<{
    mode: "cloud" | "local"
    initialized: boolean
    error: string | null
  }>({ mode: "local", initialized: false, error: null })
  const [refreshing, setRefreshing] = useState(false)
  const { session } = useAuth()
  const router = useRouter()

  // Verificar si el usuario es admin
  useEffect(() => {
    if (session && session.username !== "admin" && session.username !== "ncannata") {
      router.push("/")
    }
  }, [session, router])

  // Cargar usuarios y estado del sistema
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Inicializar sistema de permisos
        await initPermissionsMode()

        // Obtener estado del sistema
        const status = getPermissionsSystemStatus()
        setSystemStatus(status)

        // Cargar usuarios
        const userRoles = await getAllUserRoles()
        setUsers(userRoles)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Función para refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      refreshRolesCache()
      await initPermissionsMode()

      const status = getPermissionsSystemStatus()
      setSystemStatus(status)

      const userRoles = await getAllUserRoles()
      setUsers(userRoles)
    } catch (error) {
      console.error("Error al refrescar datos:", error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Administrador de Permisos</h1>

      {/* Estado del sistema */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            {systemStatus.mode === "cloud" ? (
              <Cloud className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <Server className="h-5 w-5 mr-2 text-amber-500" />
            )}
            Sistema de Permisos: {systemStatus.mode === "cloud" ? "Nube" : "Local"}
          </CardTitle>
          <CardDescription>
            {systemStatus.mode === "cloud"
              ? "Los permisos se almacenan en la base de datos y se sincronizan entre dispositivos."
              : "Los permisos se almacenan localmente en este dispositivo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemStatus.error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error en el sistema de permisos</AlertTitle>
              <AlertDescription>{systemStatus.error}</AlertDescription>
            </Alert>
          ) : systemStatus.mode === "cloud" ? (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertTitle>Sistema en la nube activo</AlertTitle>
              <AlertDescription>Los permisos están sincronizados con la base de datos.</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sistema local activo</AlertTitle>
              <AlertDescription>
                Los permisos solo están disponibles en este dispositivo.
                {systemStatus.error && <span className="block mt-1">Motivo: {systemStatus.error}</span>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh} disabled={refreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualizando..." : "Actualizar Estado"}
          </Button>
        </CardFooter>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios y Roles</CardTitle>
          <CardDescription>Administra los permisos de los usuarios del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando usuarios...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border">Usuario</th>
                    <th className="text-left p-2 border">Rol</th>
                    <th className="text-left p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.username} className="border-b">
                      <td className="p-2 border">{user.username}</td>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === UserRole.SUPER_ADMIN
                              ? "bg-purple-100 text-purple-800"
                              : user.role === UserRole.MANAGER
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-2 border">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const newRole =
                                user.role === UserRole.SUPER_ADMIN
                                  ? UserRole.MANAGER
                                  : user.role === UserRole.MANAGER
                                    ? UserRole.EMPLOYEE
                                    : UserRole.SUPER_ADMIN

                              await updateUserRole(user.username, newRole, session?.username)
                              handleRefresh()
                            }}
                          >
                            Cambiar Rol
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
