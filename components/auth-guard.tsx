"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Solo proteger la ruta de empleados, no la de stock
    const isProtectedPath = pathname === "/empleados" || pathname.startsWith("/empleados/")

    // Si es una ruta protegida y no está autenticado, redirigir al login
    if (isProtectedPath && !isAuthenticated) {
      console.log(`Redirigiendo desde ${pathname} a login porque no está autenticado`)
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }

    setIsChecking(false)
  }, [isAuthenticated, pathname, router])

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f8ff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado y es una ruta protegida de empleados, no mostrar nada
  const isProtectedEmpleadosPath = pathname === "/empleados" || pathname.startsWith("/empleados/")
  if (!isAuthenticated && isProtectedEmpleadosPath) {
    return null
  }

  return <>{children}</>
}
