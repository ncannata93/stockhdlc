"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isUserAdmin } from "@/lib/user-permissions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Users, UserPlus, Database } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (session?.username) {
        try {
          const admin = await isUserAdmin(session.username)
          setIsAdmin(admin)
        } catch (error) {
          console.error("Error al verificar admin:", error)
          // Fallback para admin y ncannata
          const isAdminUser = session.username === "admin" || session.username === "ncannata"
          setIsAdmin(isAdminUser)
        }
      }
      setLoading(false)
    }

    if (isAuthenticated) {
      checkAdmin()
    } else {
      setLoading(false)
    }
  }, [session, isAuthenticated])

  // Redireccionar si no es admin o tiene rutas restringidas
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/")
    }
    // Si tiene rutas restringidas, redirigir a su ruta permitida
    if (!loading && session?.allowedRoutes) {
      router.replace(session.allowedRoutes[0] || "/")
    }
  }, [isAuthenticated, isAdmin, loading, router, session])

  if (loading) {
    return <div className="p-8 text-center">Verificando permisos...</div>
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Database className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Users className="h-4 w-4" />
            <span>Usuarios</span>
          </Button>
        </Link>
        <Link href="/admin/create-user">
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <UserPlus className="h-4 w-4" />
            <span>Crear Usuario</span>
          </Button>
        </Link>
        <Link href="/admin/permissions-manager">
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
            <Shield className="h-4 w-4" />
            <span>Permisos</span>
          </Button>
        </Link>
      </div>

      {children}
    </div>
  )
}
