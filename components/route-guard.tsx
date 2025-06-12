"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { canAccessModule } from "@/lib/user-permissions"
import { Loader2, AlertTriangle } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
  requiredModule?: "stock" | "empleados" | "servicios" | "admin"
}

export function RouteGuard({ children, requiredModule }: RouteGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAccess() {
      if (!user?.username) {
        setIsChecking(false)
        return
      }

      if (!requiredModule) {
        setHasAccess(true)
        setIsChecking(false)
        return
      }

      try {
        console.log(`🔒 Verificando acceso a ${requiredModule} para ${user.username}`)

        const access = await canAccessModule(user.username, requiredModule)

        console.log(`✅ Resultado: ${access ? "PERMITIDO" : "DENEGADO"}`)

        if (!access) {
          console.warn(`⚠️ Acceso denegado a ${requiredModule}. Redirigiendo a inicio...`)
          router.push("/")
          return
        }

        setHasAccess(true)
      } catch (err) {
        console.error("❌ Error al verificar acceso:", err)
        setError("Error al verificar permisos")

        // Fallback: permitir acceso a usuarios conocidos
        const fallbackAccess = getFallbackAccess(user.username, requiredModule)
        if (fallbackAccess) {
          console.log("🔄 Usando acceso fallback")
          setHasAccess(true)
        } else {
          router.push("/")
        }
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [user?.username, requiredModule, router])

  // Función de fallback para usuarios conocidos
  function getFallbackAccess(username: string, module: string): boolean {
    const userLower = username.toLowerCase()

    switch (module) {
      case "stock":
      case "empleados":
        return true // Todos pueden acceder
      case "servicios":
        return ["admin", "ncannata", "dpili"].includes(userLower)
      case "admin":
        return ["admin", "ncannata"].includes(userLower)
      default:
        return false
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando permisos...</p>
          {requiredModule && <p className="text-sm text-gray-500 mt-2">Módulo: {requiredModule}</p>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 font-medium">Error de Permisos</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 font-medium">Acceso Denegado</p>
          <p className="text-gray-600 mt-2">No tienes permisos para acceder a este módulo</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
