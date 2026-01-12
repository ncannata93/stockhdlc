"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  debugRoles,
  getPermissionsSystemStatus,
  refreshRolesCache,
  getUserRole,
  getUserPermissions,
  checkUserRolesTable,
} from "@/lib/user-permissions"
import { useAuth } from "@/lib/auth-context"
import { Bug, Database, RefreshCw, User, Shield } from "lucide-react"

export default function PermissionsDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { session } = useAuth()

  const runDebug = async () => {
    setIsLoading(true)
    try {
      // Obtener estado del sistema
      const status = getPermissionsSystemStatus()

      // Verificar tabla
      const tableExists = await checkUserRolesTable()

      // Obtener información del usuario actual
      let userRole = null
      let userPermissions = null
      if (session?.username) {
        userRole = await getUserRole(session.username)
        userPermissions = await getUserPermissions(session.username)
      }

      // Ejecutar debug completo
      await debugRoles()

      setDebugInfo({
        status,
        tableExists,
        currentUser: session?.username || "No autenticado",
        userRole,
        userPermissions,
        timestamp: new Date().toLocaleString(),
      })
    } catch (error) {
      console.error("Error en debug:", error)
      setDebugInfo({
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toLocaleString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshCache = () => {
    refreshRolesCache()
    runDebug()
  }

  useEffect(() => {
    runDebug()
  }, [session])

  if (!session?.username || !["admin", "ncannata"].includes(session.username.toLowerCase())) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug de Permisos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDebug} disabled={isLoading} size="sm">
            <Bug className="h-4 w-4 mr-2" />
            {isLoading ? "Ejecutando..." : "Ejecutar Debug"}
          </Button>
          <Button onClick={handleRefreshCache} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar Cache
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-3">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Estado del Sistema:</strong>
                <br />
                Modo:{" "}
                <Badge variant={debugInfo.status?.mode === "cloud" ? "default" : "secondary"}>
                  {debugInfo.status?.mode?.toUpperCase() || "DESCONOCIDO"}
                </Badge>
                <br />
                Inicializado: {debugInfo.status?.initialized ? "✅ Sí" : "❌ No"}
                <br />
                Tabla existe: {debugInfo.tableExists ? "✅ Sí" : "❌ No"}
                <br />
                {debugInfo.status?.error && (
                  <>
                    Error: <span className="text-red-600">{debugInfo.status.error}</span>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {debugInfo.currentUser && (
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  <strong>Usuario Actual:</strong> {debugInfo.currentUser}
                  <br />
                  <strong>Rol:</strong> <Badge variant="outline">{debugInfo.userRole || "No determinado"}</Badge>
                  <br />
                  <strong>Permisos:</strong>{" "}
                  {debugInfo.userPermissions?.length > 0 ? (
                    debugInfo.userPermissions.map((perm: string) => (
                      <Badge key={perm} variant="outline" className="mr-1">
                        {perm}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">Sin permisos</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {debugInfo.error && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {debugInfo.error}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500">Última actualización: {debugInfo.timestamp}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
