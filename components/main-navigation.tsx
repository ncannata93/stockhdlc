"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MainNavigation() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200 py-3 px-4 flex items-center space-x-4">
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
  )
}
