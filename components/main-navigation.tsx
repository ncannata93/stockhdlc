"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Package, Users, Menu, X, Wrench, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

export function MainNavigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { signOut, session } = useAuth()

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Determinar qué enlaces mostrar según el usuario
  const showServiciosLink = !session || session.username === "admin" || session.username === "ncannata"

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-3 md:py-3 md:px-4">
      <div className="flex items-center justify-between md:hidden">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} title="Volver atrás">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center">
          {session && <span className="text-sm font-medium text-gray-700 mr-2">{session.username}</span>}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión" className="mr-2">
            <LogOut className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="mt-2 md:hidden">
          <div className="flex flex-col space-y-1">
            <Link href="/">
              <Button variant={pathname === "/" ? "default" : "ghost"} size="sm" className="w-full justify-start">
                <Home className="h-4 w-4 mr-2" />
                <span>Inicio</span>
              </Button>
            </Link>

            <Link href="/stock">
              <Button
                variant={pathname.startsWith("/stock") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Package className="h-4 w-4 mr-2" />
                <span>Stock</span>
              </Button>
            </Link>

            <Link href="/empleados">
              <Button
                variant={pathname.startsWith("/empleados") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                <span>Empleados</span>
              </Button>
            </Link>

            {showServiciosLink && (
              <Link href="/servicios">
                <Button
                  variant={pathname.startsWith("/servicios") ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  <span>Servicios</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Menú desktop */}
      <div className="hidden md:flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} title="Volver atrás">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex space-x-2">
            <Link href="/">
              <Button variant={pathname === "/" ? "default" : "ghost"} size="sm" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </Button>
            </Link>

            <Link href="/stock">
              <Button
                variant={pathname.startsWith("/stock") ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-1"
              >
                <Package className="h-4 w-4" />
                <span>Stock</span>
              </Button>
            </Link>

            <Link href="/empleados">
              <Button
                variant={pathname.startsWith("/empleados") ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                <span>Empleados</span>
              </Button>
            </Link>

            {showServiciosLink && (
              <Link href="/servicios">
                <Button
                  variant={pathname.startsWith("/servicios") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Wrench className="h-4 w-4" />
                  <span>Servicios</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Información de usuario y botón de cerrar sesión */}
        <div className="flex items-center space-x-3">
          {session && <span className="text-sm font-medium text-gray-700">{session.username}</span>}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
