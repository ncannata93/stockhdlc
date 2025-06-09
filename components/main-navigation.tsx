"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Package, Users, Menu, X, Wrench, LogOut, User } from "lucide-react"
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
      setMobileMenuOpen(false)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Determinar qué enlaces mostrar según el usuario
  const showServiciosLink = !session || session.username === "admin" || session.username === "ncannata"

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-3 md:py-3 md:px-4 shadow-sm">
      <div className="flex items-center justify-between md:hidden">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} title="Volver atrás">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center space-x-2">
          {/* Usuario visible en móvil */}
          <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
            <User className="h-4 w-4 text-gray-600 mr-1" />
            <span className="text-sm font-medium text-gray-700">{session?.username || "Usuario"}</span>
          </div>

          {/* Botón de logout prominente */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="text-xs">Salir</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="mt-3 md:hidden bg-white rounded-lg border shadow-lg p-2">
          <div className="flex flex-col space-y-1">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === "/" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Home className="h-4 w-4 mr-2" />
                <span>Inicio</span>
              </Button>
            </Link>

            <Link href="/stock" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith("/stock") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Package className="h-4 w-4 mr-2" />
                <span>Stock</span>
              </Button>
            </Link>

            <Link href="/empleados" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith("/empleados") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                <span>Empleados</span>
              </Button>
            </Link>

            {showServiciosLink && (
              <Link href="/servicios" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname.startsWith("/servicios") ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  <span>Servicios</span>
                </Button>
              </Link>
            )}

            {/* Separador */}
            <div className="border-t my-2"></div>

            {/* Logout en el menú también */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Cerrar Sesión</span>
            </Button>
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
              <Button variant={pathname === "/" ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </Button>
            </Link>

            <Link href="/stock">
              <Button
                variant={pathname.startsWith("/stock") ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                <span>Stock</span>
              </Button>
            </Link>

            <Link href="/empleados">
              <Button
                variant={pathname.startsWith("/empleados") ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
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
                  className="flex items-center gap-2"
                >
                  <Wrench className="h-4 w-4" />
                  <span>Servicios</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Información de usuario y botón de cerrar sesión en desktop */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <User className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">{session?.username || "Usuario"}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
