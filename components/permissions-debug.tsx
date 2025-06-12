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
import { Bug, Database, RefreshCw, User, Shield, ChevronUp, ChevronDown, X } from "lucide-react"

export default function PermissionsDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
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

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg p-2 bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        <Bug className="h-5 w-5 text-white" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-[350px] transition-all duration-300 ease-in-out">
      <Card
        className={`shadow-lg border-t-4 border-blue-600 ${isExpanded ? "max-h-[80vh] overflow-y-auto" : "max-h-[120px] overflow-hidden"}`}
      >
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 bg-gray-50">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            <Bug className="h-4 w-4 text-blue-600" />
            <span className="hidden sm:inline">Debug de Permisos</span>
            <span className="sm:hidden">Debug</span>
            {!isExpanded && debugInfo && (
              <Badge variant="outline" className="ml-2 text-xs">
                {debugInfo.currentUser}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVisible(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`p-3 space-y-3 ${isExpanded ? "" : "hidden"}`}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={runDebug} disabled={isLoading} size="sm" className="h-7 text-xs">
              <Bug className="h-3 w-3 mr-1" />
              {isLoading ? "..." : "Debug"}
            </Button>
            <Button onClick={handleRefreshCache} variant="outline" size="sm" className="h-7 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Cache
            </Button>
          </div>

          {debugInfo && (
            <div className="space-y-2 text-xs">
              <Alert className="py-2">
                <Database className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  <div className="grid grid-cols-2 gap-1">
                    <span>Modo:</span>
                    <Badge
                      variant={debugInfo.status?.mode === "cloud" ? "default" : "secondary"}
                      className="text-[10px] h-5"
                    >
                      {debugInfo.status?.mode?.toUpperCase() || "?"}
                    </Badge>

                    <span>Inicializado:</span>
                    <span>{debugInfo.status?.initialized ? "✅" : "❌"}</span>

                    <span>Tabla existe:</span>
                    <span>{debugInfo.tableExists ? "✅" : "❌"}</span>
                  </div>
                  {debugInfo.status?.error && (
                    <div className="mt-1 text-red-600 text-[10px]">Error: {debugInfo.status.error}</div>
                  )}
                </AlertDescription>
              </Alert>

              {debugInfo.currentUser && (
                <Alert className="py-2">
                  <User className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <div className="grid grid-cols-[80px_1fr] gap-1">
                      <span>Usuario:</span>
                      <span>{debugInfo.currentUser}</span>

                      <span>Rol:</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {debugInfo.userRole || "?"}
                      </Badge>

                      <span>Permisos:</span>
                      <div className="flex flex-wrap gap-1">
                        {debugInfo.userPermissions?.length > 0 ? (
                          debugInfo.userPermissions.map((perm: string) => (
                            <Badge key={perm} variant="outline" className="text-[10px] h-5">
                              {perm}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500">Ninguno</span>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {debugInfo.error && (
                <Alert variant="destructive" className="py-2">
                  <Shield className="h-3 w-3" />
                  <AlertDescription className="text-xs">Error: {debugInfo.error}</AlertDescription>
                </Alert>
              )}

              <div className="text-[10px] text-gray-500">Actualizado: {debugInfo.timestamp}</div>
            </div>
          )}
        </CardContent>

        {!isExpanded && debugInfo && (
          <div className="px-3 pb-3 pt-0 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-gray-500" />
              <span>{debugInfo.userRole || "Sin rol"}</span>
            </div>
            <Badge variant={debugInfo.status?.initialized ? "success" : "destructive"} className="text-[10px]">
              {debugInfo.status?.initialized ? "OK" : "Error"}
            </Badge>
          </div>
        )}
      </Card>
    </div>
  )
}
