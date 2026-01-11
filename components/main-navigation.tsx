"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Users, Package, Wrench, LogOut, User, CreditCard } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const navigationItems = [
  {
    name: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    name: "Empleados",
    href: "/empleados",
    icon: Users,
  },
  {
    name: "Stock",
    href: "/stock",
    icon: Package,
  },
  {
    name: "Servicios",
    href: "/servicios",
    icon: Wrench,
  },
  {
    name: "Préstamos",
    href: "/prestamos",
    icon: CreditCard,
  },
]

export function MainNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y navegación desktop */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo-hoteles-costa.png"
                  alt="Hoteles de la Costa"
                  width={180}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Navegación desktop */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Usuario y logout desktop */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>Bienvenido, {user.displayName || user.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </Button>
              </div>
            )}
          </div>

          {/* Menú móvil */}
          <div className="sm:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col h-full">
                  {/* Header móvil */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <Image
                      src="/images/logo-hoteles-costa.png"
                      alt="Hoteles de la Costa"
                      width={140}
                      height={30}
                      className="h-6 w-auto"
                    />
                  </div>

                  {/* Usuario móvil */}
                  {user && (
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <User className="h-4 w-4" />
                        <span>{user.displayName || user.username}</span>
                      </div>
                    </div>
                  )}

                  {/* Navegación móvil */}
                  <div className="flex-1 py-4">
                    <nav className="space-y-1">
                      {navigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive(item.href)
                                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>

                  {/* Logout móvil */}
                  {user && (
                    <div className="p-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 bg-transparent"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default MainNavigation
