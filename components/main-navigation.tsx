"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package2, Users, Wrench, Home, Settings } from "lucide-react"

export function MainNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname?.startsWith(path)
  }

  const navItems = [
    {
      name: "Inicio",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Stock",
      href: "/stock",
      icon: <Package2 className="h-5 w-5" />,
    },
    {
      name: "Empleados",
      href: "/empleados",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Servicios",
      href: "/servicios",
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      name: "Admin",
      href: "/admin",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="sr-only">Hoteles de la Costa</span>
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md"></div>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={cn(
                      "transition-all",
                      isActive(item.href)
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          <div className="block md:hidden">
            <div className="flex items-center space-x-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "transition-all",
                      isActive(item.href)
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                    title={item.name}
                  >
                    {item.icon}
                    <span className="sr-only">{item.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
