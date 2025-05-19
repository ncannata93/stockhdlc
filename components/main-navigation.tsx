"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Package, Users, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

export function MainNavigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-3 md:py-3 md:px-4">
      <div className="flex items-center justify-between md:hidden">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} title="Volver atrás">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
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
          </div>
        </div>
      )}

      {/* Menú desktop */}
      <div className="hidden md:flex items-center space-x-4">
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
        </div>
      </div>
    </div>
  )
}
