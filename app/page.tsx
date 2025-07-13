"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Package, Wrench, CreditCard, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const modules = [
  {
    title: "Empleados",
    description: "Gestión de empleados, horarios y pagos",
    icon: Users,
    href: "/empleados",
    color: "bg-blue-500",
  },
  {
    title: "Stock",
    description: "Control de inventario y productos",
    icon: Package,
    href: "/stock",
    color: "bg-green-500",
  },
  {
    title: "Servicios",
    description: "Gestión de servicios y reservaciones",
    icon: Wrench,
    href: "/servicios",
    color: "bg-orange-500",
  },
  {
    title: "Préstamos",
    description: "Control de préstamos entre hoteles",
    icon: CreditCard,
    href: "/prestamos",
    color: "bg-purple-500",
  },
]

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    try {
      logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/images/logo-hoteles-costa.png"
                alt="Hoteles de la Costa"
                width={180}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>Bienvenido, {user?.displayName || user?.username}</span>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión Hotelera</h1>
            <p className="mt-2 text-lg text-gray-600">Selecciona el módulo que deseas utilizar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <Link key={module.title} href={module.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="text-center">
                      <div
                        className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mx-auto mb-4`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-transparent" variant="outline">
                        Acceder
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
