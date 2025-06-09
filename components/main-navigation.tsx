"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Package, Users, Menu, X, Wrench, LogOut, User, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"

export function MainNavigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { signOut, session, isAuthenticated } = useAuth()

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

  // Solo mostrar el botón de asignar en la página principal
  const isHomePage = pathname === "/"

  return (
    <>
      {/* Navegación principal */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 py-2 px-3 md:py-2 md:px-4 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between md:hidden">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} title="Volver atrás">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            {/* Usuario visible en móvil - solo si está autenticado */}
            {isAuthenticated && (
              <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                <User className="h-3 w-3 text-gray-600 mr-1" />
                <span className="text-xs font-medium text-gray-700 max-w-16 truncate">
                  {session?.username || "User"}
                </span>
              </div>
            )}

            {/* Botón de logout más pequeño - solo si está autenticado */}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 px-2 py-1 h-7"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            )}

            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Menú móvil mejorado */}
        {mobileMenuOpen && (
          <div
            ref={menuRef}
            className="mt-2 md:hidden bg-white/95 backdrop-blur-sm rounded-xl border shadow-xl p-3 mx-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname === "/" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <Home className="h-3 w-3 mr-2" />
                  <span>Inicio</span>
                </Button>
              </Link>

              <Link href="/stock" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname.startsWith("/stock") ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <Package className="h-3 w-3 mr-2" />
                  <span>Stock</span>
                </Button>
              </Link>

              <Link href="/empleados" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={pathname.startsWith("/empleados") ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                >
                  <Users className="h-3 w-3 mr-2" />
                  <span>Empleados</span>
                </Button>
              </Link>

              {showServiciosLink && (
                <Link href="/servicios" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={pathname.startsWith("/servicios") ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs h-8"
                  >
                    <Wrench className="h-3 w-3 mr-2" />
                    <span>Servicios</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Separador */}
            <div className="border-t my-2"></div>

            {/* Acceso directo a asignar en móvil */}
            <Link href="/asignar" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname.startsWith("/asignar") ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-xs h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
              >
                <UserPlus className="h-3 w-3 mr-2" />
                <span>Asignación Rápida</span>
              </Button>
            </Link>

            {/* Logout en el menú - solo si está autenticado */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:bg-red-50 text-xs h-8 mt-1"
              >
                <LogOut className="h-3 w-3 mr-2" />
                <span>Cerrar Sesión</span>
              </Button>
            )}
          </div>
        )}

        {/* Menú desktop mejorado */}
        <div className="hidden md:flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              title="Volver atrás"
              className="h-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex space-x-1">
              <Link href="/">
                <Button
                  variant={pathname === "/" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3"
                >
                  <Home className="h-3 w-3" />
                  <span className="text-sm">Inicio</span>
                </Button>
              </Link>

              <Link href="/stock">
                <Button
                  variant={pathname.startsWith("/stock") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3"
                >
                  <Package className="h-3 w-3" />
                  <span className="text-sm">Stock</span>
                </Button>
              </Link>

              <Link href="/empleados">
                <Button
                  variant={pathname.startsWith("/empleados") ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3"
                >
                  <Users className="h-3 w-3" />
                  <span className="text-sm">Empleados</span>
                </Button>
              </Link>

              {showServiciosLink && (
                <Link href="/servicios">
                  <Button
                    variant={pathname.startsWith("/servicios") ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 h-8 px-3"
                  >
                    <Wrench className="h-3 w-3" />
                    <span className="text-sm">Servicios</span>
                  </Button>
                </Link>
              )}

              {/* Botón de asignar en el menú desktop - solo en página principal */}
              {isHomePage && (
                <Link href="/asignar">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 h-8 px-3 ml-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span className="text-sm">Asignar</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Información de usuario y botón de cerrar sesión en desktop - solo si está autenticado */}
          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <User className="h-3 w-3 text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">{session?.username || "Usuario"}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 h-8 px-2"
              >
                <LogOut className="h-3 w-3" />
                <span className="text-xs">Salir</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
