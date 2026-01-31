"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MainNavigation } from "@/components/main-navigation"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function PrestamosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.allowedRoutes) {
      const isAllowed = user.allowedRoutes.some((route: string) => "/prestamos".startsWith(route))
      if (!isAllowed) {
        router.replace(user.allowedRoutes[0] || "/")
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) return null
  if (user?.allowedRoutes && !user.allowedRoutes.some((route: string) => "/prestamos".startsWith(route))) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 font-medium">Sistema de Préstamos</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
    </div>
  )
}
