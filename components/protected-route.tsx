"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
  allowRedirect?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false, allowRedirect = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/login" && allowRedirect) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }

    // Verificar permisos de admin si es requerido
    if (!isLoading && isAuthenticated && adminOnly) {
      const username = session?.username || ""
      const isAdmin = username === "admin" || username === "ncannata"

      if (!isAdmin && allowRedirect) {
        router.replace("/stock")
        return
      }
    }
  }, [isLoading, isAuthenticated, pathname, router, adminOnly, session, allowRedirect])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Cargando...</h2>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && allowRedirect) {
    return null
  }

  return <>{children}</>
}
