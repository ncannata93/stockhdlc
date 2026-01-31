"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ServiciosLayoutProps {
  children: ReactNode
}

export default function ServiciosLayout({ children }: ServiciosLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.allowedRoutes) {
      const isAllowed = user.allowedRoutes.some((route: string) => "/servicios".startsWith(route))
      if (!isAllowed) {
        router.replace(user.allowedRoutes[0] || "/")
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) return null
  if (user?.allowedRoutes && !user.allowedRoutes.some((route: string) => "/servicios".startsWith(route))) return null

  return <div className="min-h-screen bg-gray-50">{children}</div>
}
