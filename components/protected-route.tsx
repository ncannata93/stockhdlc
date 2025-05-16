"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, session } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Asegurarse de que estamos en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Solo ejecutar la lógica de redirección cuando estamos en el cliente y isLoading es false
    if (isClient && !isLoading) {
      console.log("ProtectedRoute - Estado:", { isAuthenticated, isAdmin, adminOnly, session })

      if (!isAuthenticated) {
        console.log("ProtectedRoute - Redirigiendo a /login")
        router.push("/login")
      } else if (adminOnly && !isAdmin) {
        console.log("ProtectedRoute - Redirigiendo a /stock (no es admin)")
        router.push("/stock")
      } else {
        console.log("ProtectedRoute - Usuario autorizado")
        setIsAuthorized(true)
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, adminOnly, isClient, session])

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isLoading || !isClient || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">
            {isLoading ? "Verificando autenticación..." : "Redirigiendo..."}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {!isAuthenticated ? "No autenticado" : adminOnly && !isAdmin ? "No es administrador" : "Cargando..."}
          </p>
        </div>
      </div>
    )
  }

  // Si está autenticado y tiene los permisos necesarios, mostrar el contenido
  return <>{children}</>
}
