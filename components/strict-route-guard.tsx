"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessRoute, clearPermissionsCache, isPublicRoute, getModuleFromPath } from "@/lib/strict-permissions"
import { Loader2, RefreshCw, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StrictRouteGuard({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [redirectToLogin, setRedirectToLogin] = useState(false)

  // Verificar si es una ruta pública
  useEffect(() => {
    setIsPublic(isPublicRoute(pathname))
  }, [pathname])

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isPublic) {
      console.log("🔒 Usuario no autenticado, redirigiendo a login")
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
      setRedirectToLogin(true)
    } else {
      setRedirectToLogin(false)
    }
  }, [isAuthenticated, authLoading, pathname, router, isPublic])

  // Verificar permisos para rutas protegidas
  useEffect(() => {
    if (!session?.username || authLoading || isPublic || redirectToLogin) {
      return
    }

    const checkAccess = async () => {
      setIsChecking(true)
      setError(null)

      try {
        console.log("🔍 Verificando acceso para:", session.username, "en ruta:", pathname)

        const canAccess = await canAccessRoute(session.username, pathname)

        console.log("✅ Resultado verificación:", canAccess)

        if (!canAccess) {
          console.log("❌ Acceso denegado, redirigiendo al inicio")
          setHasAccess(false)
          router.replace("/")
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error("❌ Error verificando permisos:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
        // En caso de error, permitir acceso para evitar bloqueos
        setHasAccess(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [session?.username, pathname, router, authLoading, isPublic, redirectToLogin])

  // Función para actualizar permisos manualmente
  const refreshPermissions = () => {
    clearPermissionsCache()
    window.location.reload()
  }

  // Renderizado condicional basado en estados
  let content = children

  // Mostrar loading mientras se autentica
  if (authLoading) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Cargando...</h2>
        </div>
      </div>
    )
  }
  // Si no está autenticado y debe redirigir, mostrar nada
  else if (redirectToLogin) {
    content = null
  }
  // Mostrar loading mientras se verifican permisos
  else if (isChecking) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Verificando permisos...</h2>
          <p className="text-gray-500 mt-2">Usuario: {session?.username}</p>
          <p className="text-gray-500">Ruta: {pathname}</p>
          <p className="text-gray-500">Módulo: {getModuleFromPath(pathname) || "Ninguno"}</p>
        </div>
      </div>
    )
  }
  // Mostrar error si hay problemas
  else if (error) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Error de Permisos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshPermissions} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }
  // Si no tiene acceso, no mostrar nada (se redirigirá)
  else if (!hasAccess && !isPublic) {
    content = null
  }

  // Panel de debug para admin
  const debugPanel =
    isAuthenticated &&
    session?.username &&
    ["admin", "ncannata"].includes(session.username) &&
    !authLoading &&
    !isChecking ? (
      <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-3 text-xs max-w-xs z-50">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="font-medium">Debug Permisos</span>
        </div>
        <div className="space-y-1 text-gray-600">
          <div>Usuario: {session?.username}</div>
          <div>Ruta: {pathname}</div>
          <div>Módulo: {getModuleFromPath(pathname) || "Ninguno"}</div>
          <div>Público: {isPublic ? "✅" : "❌"}</div>
          <div>Acceso: {hasAccess ? "✅" : "❌"}</div>
        </div>
        <Button size="sm" variant="outline" onClick={refreshPermissions} className="w-full mt-2 text-xs h-7">
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualizar
        </Button>
      </div>
    ) : null

  return (
    <>
      {content}
      {debugPanel}
    </>
  )
}
